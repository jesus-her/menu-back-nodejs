import { PrismaClient } from '@prisma/client'
import { Request, Response } from 'express'

const prisma = new PrismaClient()

export const createProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { name, description, price, storeId, categoryId, image } = req.body

  // Agrega aquí validaciones para los datos de entrada
  if (!name || !storeId || !categoryId || !price || !description) {
    res.status(400).json({
      message:
        'El nombre, la tienda, precio, categoría y descripción son obligatorios'
    })
    return
  }

  try {
    const store = await prisma.store.findUnique({ where: { id: storeId } })
    if (!store) {
      res.status(404).json({ message: 'Tienda no encontrada' })
      return
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        image,
        store: {
          connect: { id: storeId }
        },
        category: {
          connect: { id: categoryId }
        }
      }
    })

    res.status(201).json(product)
  } catch (error: any) {
    console.error('Error al crear el product: ', error)
    res
      .status(500)
      .json({ error: 'Hubo un error al crear el product, pruebe más tarde' })
  }
}

export const getAllProducts = async (
  req: Request,
  res: Response
): Promise<void> => {
  const page = parseInt(req.query.page as string, 10) || 1
  const resultsPerPage = parseInt(req.query.resultsPerPage as string, 10) || 10
  const offset = (page - 1) * resultsPerPage
  const storeId = parseInt(req.query.store as string, 10)
  const categoryId = req.query.categoryId
    ? parseInt(req.query.categoryId as string, 10)
    : null

  try {
    const whereClause = {
      storeId: storeId,
      ...(categoryId && { categoryId: categoryId }) // Include categoryId only if it is provided
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: true // Incluye las categorías relacionadas
      },

      take: resultsPerPage,
      skip: offset
    })

    const totalProducts = await prisma.product.count({
      where: whereClause
    })

    // Update buildUrl to conditionally include categoryId query parameter
    const buildUrl = (newPage: number) => {
      let baseUrl = `${req.protocol}://${req.get('host')}${
        req.originalUrl.split('?')[0]
      }`
      let query = `page=${newPage}&resultsPerPage=${resultsPerPage}&store=${storeId}`
      query += categoryId ? `&categoryId=${categoryId}` : '' // Add categoryId to the query if it exists
      return `${baseUrl}?${query}`
    }

    res.status(200).json({
      count: totalProducts,
      next: page * resultsPerPage < totalProducts ? buildUrl(page + 1) : null,
      previous: page > 1 ? buildUrl(page - 1) : null,
      results: products
    })
  } catch (error: any) {
    console.error('Error al obtener los productos: ', error)
    res.status(500).json({
      error: 'Hubo un error al obtener los productos, pruebe más tarde'
    })
  }
}

// en tu archivo productsController.ts

// export const getProductsByStore = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   const storeId = parseInt(req.params.storeId)

//   try {
//     const products = await prisma.product.findMany({
//       where: {
//         storeId: storeId
//       }
//       // Puedes omitir take y skip para retornar todos los productos de una vez
//     })

//     res.status(200).json(products)
//   } catch (error: any) {
//     console.error('Error al obtener los productos: ', error)
//     res
//       .status(500)
//       .json({
//         error: 'Hubo un error al obtener los productos, pruebe más tarde'
//       })
//   }
// }

export const updateProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params
  const { name, description, price, categoryId, image } = req.body

  try {
    const updatedProduct = await prisma.product.update({
      where: { id: Number(id) },
      data: {
        name,
        description,
        price,
        image,
        category: {
          connect: { id: categoryId }
        }
      }
    })

    res.status(200).json(updatedProduct)
  } catch (error: any) {
    console.error('Error al UPDATE los productos filtrados: ', error)
    res.status(500).json({
      error: 'Hubo un error al UPDATE los productos filtrados, pruebe más tarde'
    })
  }
}

export const deleteProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params

  try {
    await prisma.product.delete({
      where: { id: Number(id) }
    })

    res.status(204).send() // No Content
  } catch (error: any) {
    console.error('Error al ELIMINAR los productos filtrados: ', error)
    res.status(500).json({
      error:
        'Hubo un error al ELIMINAR los productos filtrados, pruebe más tarde'
    })
  }
}
