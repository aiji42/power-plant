import { LoaderFunction, json, ActionFunction } from 'remix'
import { supabaseClient } from '~/utils/supabase.server'
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

export const action: ActionFunction = async ({ request, params }) => {
  const formData = await request.formData()

  const { data } = await supabaseClient
    .from('Product')
    .update({
      torrentUrl: formData.get('torrentUrl'),
      isProcessing: false,
      updatedAt: new Date().toISOString()
    })
    .match({ code: params.sku })

  if (data?.[0].id && process.env.NODE_ENV === 'production')
    await fetch(`${process.env.BATCH_JOB_SLS_ENDPOINT}${data?.[0].id}`)

  return null
}
