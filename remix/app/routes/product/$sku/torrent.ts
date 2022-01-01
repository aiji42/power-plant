import { LoaderFunction, json } from 'remix'
import { searchTorrents, SearchedResult } from '~/utils/torrents.server'

export type TorrentsData = SearchedResult[]

export const loader: LoaderFunction = async ({ params }) => {
  const code = params.sku?.replace(/^SP-/, '') ?? ''
  const [, short1, short2] = code.match(/\d+([a-z]+)-(\d+)/i) ?? []
  const shortCode = short1 && short2 ? `${short1}-${short2}` : null
  const codes = [code, shortCode].filter((s): s is string => !!s)

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
