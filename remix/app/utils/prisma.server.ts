import { makeMiddleware } from '@sb-prisma/client'
import { PrismaClient } from '@prisma/client'

const middleware = makeMiddleware(SUPABASE_URL, SUPABASE_API_KEY)
export const db = new PrismaClient()
db.$use(middleware)
