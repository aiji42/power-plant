import { LoaderFunction, json } from 'remix'
import { searchTorrents, SearchedResult } from '~/utils/torrents.server'
import { shortSKU, stripSKU } from '~/utils/sku'

export type TorrentsData = SearchedResult[]

export const loader: LoaderFunction = async ({ params: { sku = '' } }) => {
  const codes = [stripSKU(sku), shortSKU(sku)].filter(Boolean)

  const dataList = await Promise.all(
    codes.map(async (q) => {
      try {
        return searchTorrents(q)
      } catch (e) {
        console.error(e)
        return []
      }
    })
  )

  return json(dataList.flat(), {
    headers: {
      'cache-control': 'public, max-age=3600, stale-while-revalidate=3600'
    }
  })
}
