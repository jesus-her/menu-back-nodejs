import app from './app'
import server from './app'

const PORT = process.env.PORT
server.listen(PORT, () => {
  console.log(`Servidor escuchando en el puertooo ${PORT}`)
})

// app.listen(PORT, () => {
//   console.log(`Server is running on PORT: ${PORT}`)
// })
