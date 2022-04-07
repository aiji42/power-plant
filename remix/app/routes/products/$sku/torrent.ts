import { LoaderFunction } from '@remix-run/cloudflare'
import { searchTorrents, SearchedResult } from '~/utils/torrents.server'
import { formatter } from '~/utils/sku'
import { cacheable } from '~/utils/kv.server'
import { getTransmissionEndpoint } from '~/utils/transmission.server'

export type TorrentsData = {
  transmissionEndpoint: string | null
  items: SearchedResult[]
}

export const loader: LoaderFunction = async ({ params: { sku = '' } }) => {
  const codes = formatter(sku)
  const transmissionEndpoint = await getTransmissionEndpoint()
  console.log('torrent search', 'original sku: ', sku, '; search by: ', codes)
  const dataList = await Promise.all(
    codes.map((q) =>
      cacheable(`searchTorrents-${q}`, searchTorrents(q), (res) => ({
        expirationTtl: res.length > 0 ? 3600 * 24 : 3600
      }))
    )
  )

  return {
    transmissionEndpoint,
    items: Object.values(
      dataList.flat().reduce<Record<string, SearchedResult>>(
        (res, item) => ({
          ...res,
          [item.link]: item
        }),
        {}
      )
    )
  } as TorrentsData
}
