import { prepare } from '@sb-prisma/client'

export { createClient, sb } from '@sb-prisma/client'

const operationMapping = {
  aggregateProduct: {
    model: 'Product',
    method: 'aggregate'
  },
  createManyProduct: {
    model: 'Product',
    method: 'createMany'
  },
  createOneProduct: {
    model: 'Product',
    method: 'createOne'
  },
  deleteManyProduct: {
    model: 'Product',
    method: 'deleteMany'
  },
  deleteOneProduct: {
    model: 'Product',
    method: 'deleteOne'
  },
  findFirstProduct: {
    model: 'Product',
    method: 'findFirst'
  },
  findManyProduct: {
    model: 'Product',
    method: 'findMany'
  },
  findUniqueProduct: {
    model: 'Product',
    method: 'findUnique'
  },
  groupByProduct: {
    model: 'Product',
    method: 'groupBy'
  },
  updateManyProduct: {
    model: 'Product',
    method: 'updateMany'
  },
  updateOneProduct: {
    model: 'Product',
    method: 'updateOne'
  },
  upsertOneProduct: {
    model: 'Product',
    method: 'upsertOne'
  }
}
const relationMapping = {
  Product: {}
}
const tableMapping = {
  Product: 'Product'
}
prepare({
  endpoint: process.env.SUPABASE_URL,
  apikey: process.env.SUPABASE_API_KEY,
  //@ts-ignore
  fetch,
  modelMap: {
    operationMapping,
    relationMapping,
    tableMapping
  }
})
