import { LoaderFunction } from 'remix'
import { formatter } from '~/utils/sku'
import {
  Casts,
  mergeCasts,
  searchFast,
  searchMiddle,
  searchSlow
} from '~/utils/casts.server'
import { cacheable } from '~/utils/kv.server'

export type CastsData = {
  error?: string
  data: Casts
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
      cacheable(castFastPromise, `castSearchFast-${code}`, cacheController),
      cacheable(castMiddlePromise, `castSearchMiddle-${code}`, cacheController),
      cacheable(castSlowPromise, `castSearchSlow-${code}`, cacheController)
    ])

    return {
      data: mergeCasts(
        mergeCasts(searchResults[0], searchResults[1]),
        searchResults[2]
      )
    }
  } catch (e) {
    console.error(e)
    return {
      data: [],
      error: e instanceof Error ? e.message : 'occurred unexpected error'
    }
  }
}
