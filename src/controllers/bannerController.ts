import { PrismaClient } from '@prisma/client'
import { Request, Response } from 'express'

const prisma = new PrismaClient()

export const createBanner = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { title, subtitle, description, image, storeId } = req.body

  // Verificación básica de los datos de entrada
  if (!image || !storeId) {
    res
      .status(400)
      .json({ message: 'La imagen y la tienda id son obligatorios' })
    return
  }

  try {
    // Asegurándose de que la tienda exista
    const store = await prisma.store.findUnique({ where: { id: storeId } })
    if (!store) {
      res.status(404).json({ message: 'Tienda no encontrada' })
      return
    }

    // Creación de el banner
    const banner = await prisma.banner.create({
      data: {
        title,
        subtitle,
        description,
        image,
        store: {
          connect: { id: storeId }
        }
      }
    })

    res.status(201).json(banner)
  } catch (error: any) {
    console.error('Error al crear el banner: ', error)
    res
      .status(500)
      .json({ error: 'Hubo un error al crear el banner, pruebe más tarde' })
  }
}

export const getAllBanners = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const banners = await prisma.banner.findMany({
      include: {
        store: true // Incluye detalles de la tienda
      }
    })
    res.status(200).json(banners)
  } catch (error: any) {
    console.error('Error al obtener los banners: ', error)
    res.status(500).json({
      error: 'Hubo un error al obtener los banners, pruebe más tarde'
    })
  }
}

export const getBannerById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params
    const banner = await prisma.banner.findUnique({
      where: { id: Number(id) },
      include: {
        store: true // Incluye detalles de la tienda
        // products: true, // Descomenta si también deseas incluir los productos asociados a el banner
      }
    })

    if (banner) {
      res.status(200).json(banner)
    } else {
      res.status(404).json({ message: 'Banner no encontrado' })
    }
  } catch (error: any) {
    console.error('Error al obtener el banner: ', error)
    res
      .status(500)
      .json({ error: 'Hubo un error al obtener el banner, pruebe más tarde' })
  }
}

export const updateBanner = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params
  const { title, subtitle, description, image, storeId } = req.body

  try {
    // Verificar si el banner existe
    const existingBanner = await prisma.banner.findUnique({
      where: { id: Number(id) }
    })
    if (!existingBanner) {
      res.status(404).json({ message: 'Banner no encontrado' })
      return
    }

    // Actualizar el banner
    const updatedBanner = await prisma.banner.update({
      where: { id: Number(id) },
      data: {
        title,
        subtitle,
        description,
        image,
        ...(storeId && {
          store: {
            connect: { id: storeId }
          }
        })
      }
    })

    res.status(200).json(updatedBanner)
  } catch (error: any) {
    console.error('Error al actualizar el banner: ', error)
    res.status(500).json({
      error: 'Hubo un error al actualizar el banner, pruebe más tarde'
    })
  }
}

export const deleteBanner = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params

  try {
    // Verificar si el banner existe
    const existingBanner = await prisma.banner.findUnique({
      where: { id: Number(id) }
    })
    if (!existingBanner) {
      res.status(404).json({ message: 'Banner no encontrado' })
      return
    }

    // Eliminar el banner
    await prisma.banner.delete({
      where: { id: Number(id) }
    })

    res.status(204).send() // No Content
  } catch (error: any) {
    console.error('Error al eliminar el banner: ', error)
    res
      .status(500)
      .json({ error: 'Hubo un error al eliminar el banner, pruebe más tarde' })
  }
}
