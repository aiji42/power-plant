import { db } from '~/utils/prisma.server'
import { redirect } from '@remix-run/cloudflare'

export const loader = async () => {
  const limit = await db.product.count()
  const p = await db.product.findFirst({
    skip: Math.floor(Math.random() * limit)
  })
  return redirect('/products/' + p?.code ?? '')
}
