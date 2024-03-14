import { PrismaClient } from '@prisma/client'
import { Request, Response } from 'express'

const prisma = new PrismaClient()

export const createStore = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, description } = req.body

    // Validaciones básicas para name y description
    if (!name) {
      res.status(400).json({ message: 'El nombre es obligatorio' })
      return
    }
    if (!description) {
      res.status(400).json({ message: 'La descripción es obligatoria' })
      return
    }

    // Creación de la tienda en la base de datos
    const store = await prisma.store.create({
      data: {
        name,
        description
      }
    })

    res.status(201).json(store)
  } catch (error: any) {
    // Manejo de errores específicos de Prisma
    if (error.code === 'P2002' && error.meta.target.includes('name')) {
      res.status(400).json({ message: 'El nombre de la tienda ya existe' })
    } else {
      console.error(error)
      res
        .status(500)
        .json({ error: 'Hubo un error al crear la tienda, pruebe más tarde' })
    }
  }
}

export const getAllStores = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // const stores = await prisma.store.findMany()
    const stores = await prisma.store.findMany({
      include: {
        categories: true, // Incluye las categorías relacionadas
        users: {
          select: {
            id: true,
            email: true,
            storeId: true
          }
        }
        // products: true, // Incluye los productos si también deseas obtenerlos
      }
    })
    res.status(200).json(stores)
  } catch (error: any) {
    console.error('Error al obtener las tiendas: ', error)
    res
      .status(500)
      .json({ error: 'Hubo un error al obtener las tiendas, pruebe más tarde' })
  }
}

export const getStoreById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params
    const store = await prisma.store.findUnique({
      where: {
        id: Number(id)
      },
      include: {
        categories: true, // Incluye las categorías relacionadas
        users: {
          select: {
            id: true,
            email: true,
            storeId: true
            // No incluyes el password aquí, por lo que se excluye
          }
        }
        // products: true, // Incluye los productos si también deseas obtenerlos
      }
    })

    if (store) {
      res.status(200).json(store)
    } else {
      res.status(404).json({ message: 'Tienda no encontrada' })
    }
  } catch (error: any) {
    console.error('Error al obtener la tienda: ', error)
    res
      .status(500)
      .json({ error: 'Hubo un error al obtener la tienda, pruebe más tarde' })
  }
}

export const updateStore = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params
  const { name, description } = req.body

  try {
    const store = await prisma.store.update({
      where: { id: Number(id) },
      data: {
        name,
        description
      }
    })

    res.status(200).json(store)
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ message: 'Tienda no encontrada' })
    } else {
      console.error('Error al actualizar la tienda: ', error)
      res.status(500).json({
        error: 'Hubo un error al actualizar la tienda, pruebe más tarde'
      })
    }
  }
}

export const deleteStore = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params

  try {
    await prisma.store.delete({
      where: { id: Number(id) }
    })

    res.status(204).send() // No Content
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ message: 'Tienda no encontrada' })
    } else {
      console.error('Error al eliminar la tienda: ', error)
      res.status(500).json({
        error: 'Hubo un error al eliminar la tienda, pruebe más tarde'
      })
    }
  }
}
