import { ActionFunction, LoaderFunction } from 'remix'
import { supabaseClient } from '~/utils/supabase.server'
import { productFromSite } from '~/utils/product.server'
import { v4 as uuidv4 } from 'uuid'

export type DBData = {
  isSaved: boolean
  isLiked: boolean
  mediaUrls: string[]
  torrentUrl: string | null
  isDownloaded: boolean
  isProcessing: boolean
}

export const loader: LoaderFunction = async ({ params }) => {
  const code = params.sku
  const { data } = await supabaseClient
    .from('Product')
    .select('isLiked, isDownloaded, isProcessing, torrentUrl, mediaUrls')
    .match({ code })

  return {
    isSaved: (data?.length ?? 0) > 0,
    isLiked: data?.[0]?.isLiked ?? false,
    mediaUrls: data?.[0]?.mediaUrls ?? [],
    torrentUrl: data?.[0]?.torrentUrl ?? null,
    isDownloaded: data?.[0]?.isDownloaded ?? false,
    isProcessing: data?.[0]?.isProcessing ?? false
  } as DBData
}

export const action: ActionFunction = async ({ request, params }) => {
  const code = params.sku as string
  if (request.method === 'DELETE') {
    await supabaseClient.from('Product').delete().match({ code })
    return {
      isSaved: false,
      isLiked: false,
      mediaUrls: [],
      torrentUrl: null,
      isDownloaded: false,
      isProcessing: false
    } as DBData
  }

  const {
    title,
    mainImageUrl,
    subImageUrls,
    mainActor,
    subActors,
    length,
    genres,
    series,
    releasedAt,
    maker
  } = await productFromSite(code)

  await supabaseClient.from('Product').insert([
    {
      id: uuidv4(),
      code,
      title,
      mainImageUrl,
      subImageUrls,
      mainActor,
      subActors,
      length,
      genres,
      series,
      releasedAt,
      maker
    }
  ])

  return {
    isSaved: true,
    isLiked: false,
    mediaUrls: [],
    torrentUrl: null,
    isDownloaded: false,
    isProcessing: false
  } as DBData
}
