// sockets/socketHandlers.ts
import { Server, Socket } from 'socket.io'
// import { type IProduct } from '../interfaces/product'

interface IProduct {
  name: string
  description: string
  price: number
  image?: string
}

interface User {
  username: string
  cartList?: IProduct[]
  cartPrice?: number
  online: boolean
  socketId: string
  disconnectTimeout?: NodeJS.Timeout
}

interface Room {
  sharedCartList: User[]
  members: User[]
}

interface Rooms {
  [roomId: string]: Room
}

let rooms: Rooms = {
  // roomId: {
  //   sharedCartList: [
  //     { username, cartList: [], cartPrice: 0, online: true, socketId: '' }
  //   ],
  //   members: [
  //     { username, online: true, socketId: '' }
  //   ]
  // }
}

const socketHandlers = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log(`🟢 Usuario conectado: ${socket.id}`)

    socket.on('create room', callback => {
      const roomId = Math.random().toString(36).substring(2, 7) // Considera usar una librería para IDs únicos
      rooms[roomId] = { sharedCartList: [], members: [] }
      callback({ status: 'success', roomId })
    })

    socket.on('join room', ({ roomId, username }, callback) => {
      if (rooms[roomId]) {
        const isMember = rooms[roomId].members.some(
          member => member.username === username
        )
        if (isMember) {
          callback({
            status: 'error',
            message: 'User is already joined in this room.'
          })
        }
        if (!isMember) {
          const newUser = { username, online: true, socketId: socket.id }
          rooms[roomId].members.push(newUser)
          rooms[roomId].sharedCartList.push({
            username,
            cartList: [],
            cartPrice: 0,
            online: true,
            socketId: socket.id
          })
          socket.join(roomId)
        } else {
          // Actualizar el estado en línea y el socketId si el usuario ya está en la sala
          const memberIndex = rooms[roomId].members.findIndex(
            member => member.username === username
          )
          rooms[roomId].members[memberIndex].online = true
          rooms[roomId].members[memberIndex].socketId = socket.id

          const cartIndex = rooms[roomId].sharedCartList.findIndex(
            cart => cart.username === username
          )

          rooms[roomId].sharedCartList[cartIndex].online = true
          rooms[roomId].sharedCartList[cartIndex].socketId = socket.id
        }

        callback({
          status: 'success',
          sharedCartList: rooms[roomId].sharedCartList,
          members: rooms[roomId].members.map(member => ({
            username: member.username,
            online: member.online
          }))
        })
        // Emitir evento de carrito compartido actualizado a cada usuario en la sala
        rooms[roomId].sharedCartList.forEach(user => {
          io.to(user.socketId).emit(
            'SHARED_CART_UPDATED',
            rooms[roomId].sharedCartList
          )
        })
      } else {
        callback({ status: 'error', message: 'Room does not exist.' })
      }
    })

    // Dentro de 'join room' o un nuevo evento 'reconnect'
    socket.on('reconnect', ({ username, roomId }, callback) => {
      // Comprueba si la sala y el usuario existen
      if (
        rooms[roomId] &&
        rooms[roomId].members.some(member => member.username === username)
      ) {
        // Actualiza el socketId para el miembro
        const memberIndex = rooms[roomId].members.findIndex(
          member => member.username === username
        )
        rooms[roomId].members[memberIndex].socketId = socket.id

        // Actualiza el socketId para el carrito compartido
        const cartIndex = rooms[roomId].sharedCartList.findIndex(
          cart => cart.username === username
        )
        rooms[roomId].sharedCartList[cartIndex].socketId = socket.id

        // Puedes emitir un evento aquí si necesitas notificar a otros usuarios sobre la reconexión
        rooms[roomId].sharedCartList.forEach(user => {
          io.to(user.socketId).emit(
            'SHARED_CART_UPDATED',
            rooms[roomId].sharedCartList
          )
        })
      }
      // Envía una respuesta de vuelta al cliente
      callback({ status: 'success', message: 'Reconnected successfully.' })
      rooms[roomId].sharedCartList.forEach(user => {
        io.to(user.socketId).emit(
          'SHARED_CART_UPDATED',
          rooms[roomId].sharedCartList
        )
      })
    })

    socket.on('leave room', ({ roomId, username }, callback) => {
      if (rooms[roomId]) {
        // Eliminar el usuario de la lista de miembros
        rooms[roomId].members = rooms[roomId].members.filter(
          member => member.username !== username
        )
        // Eliminar el carrito del usuario de sharedCartList
        rooms[roomId].sharedCartList = rooms[roomId].sharedCartList.filter(
          cart => cart.username !== username
        )

        // Verificar si la sala está vacía para tomar acciones adicionales, si es necesario
        if (rooms[roomId].members.length === 0) {
          // Opcional: eliminar la sala si está vacía
          // delete rooms[roomId];
          // Nota: Considera si necesitas eliminar la sala o realizar otras acciones cuando esté vacía
        } else {
          // Emitir evento de carrito compartido actualizado a cada usuario en la sala
          rooms[roomId].sharedCartList.forEach(user => {
            io.to(user.socketId).emit(
              'SHARED_CART_UPDATED',
              rooms[roomId].sharedCartList
            )
          })
          // Emitir la lista de carritos actualizada a todos en la sala
          io.to(roomId).emit(
            'SHARED_CART_UPDATED',
            rooms[roomId].sharedCartList
          )
        }

        socket.leave(roomId)
        callback({ status: 'success', message: 'User has left the room.' })
      } else {
        callback({ status: 'error', message: 'Room does not exist.' })
      }
    })

    socket.on(
      'UPDATE_CART',
      ({ roomId, username, cartList, cartPrice }, callback) => {
        // console.log(`Updating cart for room: ${roomId}, user: ${username}`) // Imprimir para depuración
        if (rooms[roomId]) {
          let cartUpdated = false

          // Buscar el carrito del usuario y actualizarlo
          rooms[roomId].sharedCartList.forEach(cart => {
            if (cart.username === username) {
              // console.log(`Found cart for user: ${cart.cartList}`) // Imprimir para depuración
              cart.cartList = cartList
              cart.cartPrice = cartPrice
              cartUpdated = true
            }
          })

          if (cartUpdated) {
            console.log(`Cart updated for user: ${username}`) // Imprimir para depuración

            // Emitir evento de carrito compartido actualizado a cada usuario en la sala
            rooms[roomId].sharedCartList.forEach(user => {
              io.to(user.socketId).emit(
                'SHARED_CART_UPDATED',
                rooms[roomId].sharedCartList
              )
            })

            // Respuesta de éxito
            console.log('💥 MY EMIT:', rooms[roomId].sharedCartList)
            callback({
              status: 'success',
              sharedCartList: rooms[roomId].sharedCartList
            })
          } else {
            console.log(`Cart not found for user: ${username}`) // Imprimir para depuración
            // Error si no se encuentra el carrito del usuario
            callback({
              status: 'error',
              message: 'User not found in shared cart.'
            })
          }
        } else {
          // Error si no existe la sala
          callback({ status: 'error', message: 'Room does not exist.' })
        }
      }
    )

    socket.on('disconnect', () => {
      console.log(`🔴 Usuario desconectado: ${socket.id}`)

      // Encuentra todas las salas a las que pertenece el socket y actualiza su estado en línea
      Object.keys(rooms).forEach(roomId => {
        const room = rooms[roomId]
        const memberIndex = room.members.findIndex(
          member => member.socketId === socket.id
        )

        // Si el usuario pertenecía a alguna sala
        if (memberIndex !== -1) {
          const member = room.members[memberIndex]
          member.online = false

          // Inicia un temporizador para esperar antes de eliminar al usuario y su carrito
          // member.disconnectTimeout = setTimeout(() => {
          // Eliminar al usuario de la sala después del tiempo establecido
          room.members.splice(memberIndex, 1)
          const cartIndex = room.sharedCartList.findIndex(
            cart => cart.username === member.username
          )
          if (cartIndex !== -1) {
            room.sharedCartList.splice(cartIndex, 1)
          }

          // Emitir evento para actualizar a los usuarios restantes en la sala
          io.to(roomId).emit('SHARED_CART_UPDATED', room.sharedCartList)

          // Si la sala está vacía, puedes considerar eliminarla completamente
          if (room.members.length === 0) {
            delete rooms[roomId]
          }
          // }, 3000);
        }
      })
    })

    // socket.on('disconnect', () => {
    //   console.log(`🔴 Usuario desconectado: ${socket.id}`)
    // })
  })
}

export default socketHandlers
