import { Request, Response } from 'express'
import { comparePasswords, hashPassword } from '../services/password.service'
import prisma from '../models/user'
import { generateToken } from '../services/auth.service'

export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password, storeId } = req.body

  try {
    if (!email) {
      res.status(400).json({ message: 'El email es obligatorio' })
      return
    }
    if (!password) {
      res.status(400).json({ message: 'El password es obligatorio' })
      return
    }

    // Opcional: validar que el storeId proporcionado exista en la base de datos

    const hashedPassword = await hashPassword(password)

    // La propiedad storeId es opcional. Si se proporciona, se establecerá la relación
    const userData = {
      email,
      password: hashedPassword,
      ...(storeId && { storeId }) // Condicionalemente añade storeId si se proporciona
    }

    const user = await prisma.create({
      data: userData
    })

    const token = generateToken(user)
    res.status(201).json({ token })
  } catch (error: any) {
    if (error?.code === 'P2002' && error?.meta?.target?.includes('email')) {
      res.status(400).json({ message: 'El mail ingresado ya existe' })
    } else {
      console.log(error)
      res.status(500).json({ error: 'Hubo un error en el registro' })
    }
  }
}

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body

  try {
    if (!email) {
      res.status(400).json({ message: 'El email es obligatorio' })
      return
    }
    if (!password) {
      res.status(400).json({ message: 'El password es obligatorio' })
      return
    }

    const user = await prisma.findUnique({ where: { email } })
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' })
      return
    }

    const passwordMatch = await comparePasswords(password, user.password)
    if (!passwordMatch) {
      res.status(401).json({ error: 'Usuario y contraseñas no coinciden' })
      return
    }

    const token = generateToken(user)
    // Crear un objeto user para la respuesta, excluyendo la contraseña
    const userResponse = {
      id: user.id,
      email: user.email,
      storeId: user.storeId // Asegúrate de que 'storeId' está definido en tu modelo User
    }
    res.status(200).json({ token, user: userResponse })
  } catch (error: any) {
    console.error('Error: ', error)
    res.status(500).json({ error: 'Hubo un error en el proceso de login' })
  }
}
