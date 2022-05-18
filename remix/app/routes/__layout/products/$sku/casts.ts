import { ActionFunction, LoaderFunction } from '@remix-run/cloudflare'
import { formatter } from '~/utils/sku'
import {
  CastHasCounts,
  Casts,
  mergeCasts,
  searchFast,
  searchMiddle,
  searchSlow
} from '~/utils/casts.server'
import { cacheable } from '~/utils/kv.server'
import { productFromDB } from '~/utils/product.server'
import { db } from '~/utils/prisma.server'

export type CastsData = {
  error?: string
  data: CastHasCounts
}

export const loader: LoaderFunction = async ({ params: { sku = '' } }) => {
  const code = formatter(sku)[0]
  const castFastPromise = searchFast(code)
  const castMiddlePromise = searchMiddle(code)

  const castSlowPromise = Promise.race<Casts>([
    searchSlow(code),
    new Promise<Casts>((s) => setTimeout(() => s([]), 20 * 1000))
  ])

  try {
    const cacheController = (res: Casts) => ({
      expirationTtl: res.length > 0 ? 3600 * 24 * 3 : 3600
    })
    const searchResults = await Promise.all([
      cacheable(`castSearchFast-${code}`, castFastPromise, cacheController),
      cacheable(`castSearchMiddle-${code}`, castMiddlePromise, cacheController),
      cacheable(`castSearchSlow-${code}`, castSlowPromise, cacheController)
    ])

    return {
      data: (await Promise.all(
        mergeCasts(
          mergeCasts(searchResults[2], searchResults[1]),
          searchResults[0]
        ).map(async (cast) => ({
          ...cast,
          count: await db.product.count({
            where: { casts: { has: cast.name } }
          })
        }))
      )) as CastHasCounts
    }
  } catch (e) {
    console.error(e)
    return {
      data: [],
      error: e instanceof Error ? e.message : 'occurred unexpected error'
    }
  }
}

export const action: ActionFunction = async ({ request, params, context }) => {
  const code = params.sku as string
  const formData = await request.formData()
  const cast = formData.get('cast')
  const { casts } = await productFromDB(code)

  if (cast && typeof cast === 'string') {
    const newCasts =
      request.method === 'DELETE'
        ? casts.filter(({ name }) => name !== cast).map(({ name }) => name)
        : [...new Set([...casts.map(({ name }) => name), cast])]

    await db.product.update({ where: { code }, data: { casts: newCasts } })
  }

  return loader({ request, params, context })
}
