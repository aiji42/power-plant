import { createClient } from '~/sb-prisma'
import { PrismaClient } from '@prisma/client'

export { sb } from '~/sb-prisma'

export const db = () => createClient<PrismaClient>(PrismaClient)
