import { LoaderFunction } from 'remix'
import { searchTorrents, SearchedResult } from '~/utils/torrents.server'
import { formatter } from '~/utils/sku'
import { cacheable } from '~/utils/kv.server'

export type TorrentsData = SearchedResult[]

export const loader: LoaderFunction = async ({ params: { sku = '' } }) => {
  const codes = formatter(sku)
  console.log('torrent search', 'original sku: ', sku, '; search by: ', codes)
  const dataList = await Promise.all(
    codes.map((q) =>
      cacheable(searchTorrents(q), `searchTorrents-${q}`, (res) => ({
        expirationTtl: res.length > 0 ? 3600 * 24 : 3600
      }))
    )
  )

  return Object.values(
    dataList.flat().reduce<Record<string, SearchedResult>>(
      (res, item) => ({
        ...res,
        [item.link]: item
      }),
      {}
    )
  )
}
