import { PrismaClient } from '@prisma/client'
import { Request, Response } from 'express'

const prisma = new PrismaClient()

export const createOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { isShared, storeId, userOrders, paymentType } = req.body

  try {
    // Verificar que la tienda exista
    const store = await prisma.store.findUnique({ where: { id: storeId } })
    if (!store) {
      res.status(404).json({ message: 'Store not found' })
      return
    }

    // Calcular el total sumando los cartPrice de cada userOrder
    const total = userOrders.reduce(
      (sum: number, userOrder: { cartPrice: number }) =>
        sum + userOrder.cartPrice,
      0
    )

    // Crear la orden
    const order = await prisma.order.create({
      data: {
        isShared,
        total, // Total calculado en el backend
        paymentType,
        store: {
          connect: { id: storeId }
        },
        userOrders: {
          create: userOrders.map((userOrder: any) => ({
            username: userOrder.username,
            cartPrice: userOrder.cartPrice,
            cartList: {
              create: userOrder.cartList.map((cartItem: any) => ({
                productId: cartItem.productId,
                quantity: cartItem.quantity
                // Aquí podrías agregar lógica para verificar stock y precios actuales, si es necesario
              }))
            }
          }))
        }
      },
      include: {
        userOrders: {
          include: {
            cartList: {
              include: {
                product: true // Incluir los detalles del producto para cada cartItem
              }
            }
          }
        }
      }
    })

    res.status(201).json(order)
  } catch (error: any) {
    console.error('Error creating order: ', error)
    res.status(500).json({
      error: 'There was an error creating the order, please try again later'
    })
  }
}

export const getOrderById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const orderId = parseInt(req.params.id) // Asegúrate de que 'id' es el nombre correcto del parámetro

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        userOrders: {
          include: {
            cartList: {
              include: {
                product: true // Incluir detalles del producto
              }
            }
          }
        }
      }
    })

    if (order) {
      res.status(200).json(order)
    } else {
      res.status(404).json({ message: 'Order not found' })
    }
  } catch (error: any) {
    console.error('Error retrieving order: ', error)
    res.status(500).json({
      error: 'There was an error retrieving the order, please try again later'
    })
  }
}

export const getAllOrdersByStore = async (
  req: Request,
  res: Response
): Promise<void> => {
  const page = parseInt(req.query.page as string, 10) || 1
  const resultsPerPage = parseInt(req.query.resultsPerPage as string, 10) || 10
  const offset = (page - 1) * resultsPerPage
  const storeId = parseInt(req.query.store as string)

  try {
    if (isNaN(storeId)) {
      res.status(400).json({ message: 'Invalid store ID' })
      return
    }

    const orders = await prisma.order.findMany({
      where: { storeId },
      include: {
        userOrders: {
          include: {
            cartList: {
              include: {
                product: true
              }
            }
          }
        }
      },
      take: resultsPerPage,
      skip: offset,
      orderBy: {
        createdAt: 'desc' // 'desc' for descending order, 'asc' for ascending order
      }
    })

    const totalOrders = await prisma.order.count({
      where: { storeId }
    })

    // Calcular URLs de paginación
    const baseUrl = `${req.protocol}://${req.get('host')}${req.path}`
    const next =
      page * resultsPerPage < totalOrders
        ? `${baseUrl}?store=${storeId}&page=${
            page + 1
          }&resultsPerPage=${resultsPerPage}`
        : null
    const previous =
      page > 1
        ? `${baseUrl}?store=${storeId}&page=${
            page - 1
          }&resultsPerPage=${resultsPerPage}`
        : null

    res.status(200).json({
      count: totalOrders,
      next,
      previous,
      currentPage: page,
      results: orders
    })
  } catch (error: any) {
    console.error('Error retrieving orders: ', error)
    res.status(500).json({
      error: 'There was an error retrieving the orders, please try again later'
    })
  }
}
