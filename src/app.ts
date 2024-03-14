import dotenv from 'dotenv'
import http, { createServer } from 'http'
import { Server as SocketServer } from 'socket.io'
import cors from 'cors'

dotenv.config()
import express from 'express'
import authRoutes from './routes/authRoutes'
import usersRoutes from './routes/userRoutes'
import storesRoutes from './routes/storeRoutes'
import categoryRoutes from './routes/categoryRoutes'
import productRoutes from './routes/productRoutes'
import socketHandlers from './sockets/socketHandlers'

const app = express()
app.use(cors())

app.use(express.json())

// Routes
app.use('/auth', authRoutes)
app.use('/users', usersRoutes)
app.use('/stores', storesRoutes)
app.use('/categories', categoryRoutes)
app.use('/products', productRoutes)

// socket.io
const server = http.createServer(app)
// const io = new SocketServer(httpServer)
const io = new SocketServer(server, {
  cors: {
    origin: '*'
  }
})

socketHandlers(io)

export default server
