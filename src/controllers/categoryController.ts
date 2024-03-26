import { PrismaClient } from '@prisma/client'
import { Request, Response } from 'express'

const prisma = new PrismaClient()

export const createCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { name, storeId } = req.body

  // Verificación básica de los datos de entrada
  if (!name || !storeId) {
    res.status(400).json({ message: 'El nombre y la tienda son obligatorios' })
    return
  }

  try {
    // Asegurándose de que la tienda exista
    const store = await prisma.store.findUnique({ where: { id: storeId } })
    if (!store) {
      res.status(404).json({ message: 'Tienda no encontrada' })
      return
    }

    // Creación de la categoría
    const category = await prisma.category.create({
      data: {
        name,
        store: {
          connect: { id: storeId }
        }
      }
    })

    res.status(201).json(category)
  } catch (error: any) {
    console.error('Error al crear la categoría: ', error)
    res
      .status(500)
      .json({ error: 'Hubo un error al crear la categoría, pruebe más tarde' })
  }
}

export const getAllCategories = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        store: true // Incluye detalles de la tienda
        // products: true, // Descomenta si también deseas incluir los productos asociados a cada categoría
      }
    })
    res.status(200).json(categories)
  } catch (error: any) {
    console.error('Error al obtener las categorías: ', error)
    res.status(500).json({
      error: 'Hubo un error al obtener las categorías, pruebe más tarde'
    })
  }
}

export const getCategoryById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params
    const category = await prisma.category.findUnique({
      where: { id: Number(id) },
      include: {
        store: true // Incluye detalles de la tienda
        // products: true, // Descomenta si también deseas incluir los productos asociados a la categoría
      }
    })

    if (category) {
      res.status(200).json(category)
    } else {
      res.status(404).json({ message: 'Categoría no encontrada' })
    }
  } catch (error: any) {
    console.error('Error al obtener la categoría: ', error)
    res.status(500).json({
      error: 'Hubo un error al obtener la categoría, pruebe más tarde'
    })
  }
}

export const updateCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params
  const { name, storeId } = req.body

  try {
    // Verificar si la categoría existe
    const existingCategory = await prisma.category.findUnique({
      where: { id: Number(id) }
    })
    if (!existingCategory) {
      res.status(404).json({ message: 'Categoría no encontrada' })
      return
    }

    // Actualizar la categoría
    const updatedCategory = await prisma.category.update({
      where: { id: Number(id) },
      data: {
        name,
        ...(storeId && {
          store: {
            connect: { id: storeId }
          }
        })
      }
    })

    res.status(200).json(updatedCategory)
  } catch (error: any) {
    console.error('Error al actualizar la categoría: ', error)
    res.status(500).json({
      error: 'Hubo un error al actualizar la categoría, pruebe más tarde'
    })
  }
}

export const deleteCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params

  try {
    const categoryId = Number(id)

    // Verificar si la categoría existe
    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId }
    })
    if (!existingCategory) {
      res.status(404).json({ message: 'Categoría no encontrada' })
      return
    }

    // Primero, eliminar todos los productos asociados a la categoría
    await prisma.product.deleteMany({
      where: { categoryId: categoryId }
    })

    // Luego, eliminar la categoría
    await prisma.category.delete({
      where: { id: categoryId }
    })

    res.status(204).send() // No Content
  } catch (error: any) {
    console.error('Error al eliminar la categoría: ', error)
    res.status(500).json({
      error: 'Hubo un error al eliminar la categoría, pruebe más tarde'
    })
  }
}
