import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import authRoutes from './routes/authRoutes'
import usersRoutes from './routes/userRoutes'
import storesRoutes from './routes/storeRoutes'
import categoryRoutes from './routes/categoryRoutes'
import productRoutes from './routes/productRoutes'

const app = express()

app.use(express.json())

// Routes
app.use('/auth', authRoutes)
app.use('/users', usersRoutes)
app.use('/stores', storesRoutes)
app.use('/categories', categoryRoutes)
app.use('/products', productRoutes)

export default app
