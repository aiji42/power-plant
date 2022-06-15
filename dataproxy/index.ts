import { PrismaClient, Prisma } from '@prisma/client'
import express from 'express'
import { ApolloServer } from 'apollo-server-express'
import {
  beforeMiddleware,
  afterMiddleware,
  makeServerConfig
} from 'prisma-data-proxy-alt'

const db = new PrismaClient()

const port = process.env.PORT || '3000'
const apiKey = process.env.DATA_PROXY_API_KEY || 'foo'

;(async () => {
  const app = express()
  const server = new ApolloServer(makeServerConfig(Prisma, db))

  await Promise.all([db.$connect(), server.start()])
  app.use(beforeMiddleware({ apiKey }))
  app.use(afterMiddleware())
  app.use((req, _, next) => {
    if (req.method === 'POST') req.headers['content-type'] = 'application/json'
    next()
  })
  server.applyMiddleware({
    app,
    path: '/*'
  })
  app.listen({ port }, () =>
    console.log(
      `🚀 Server ready at http://localhost:${port}${server.graphqlPath}`
    )
  )
})()
