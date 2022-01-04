import { ActionFunction, LoaderFunction } from 'remix'
import { supabaseClient } from '~/utils/supabase.server'
import { productFromSite } from '~/utils/product.server'
import { v4 as uuidv4 } from 'uuid'

export type DBData = {
  isSaved: boolean
  isLiked: boolean
  mediaUrls: string[]
  casts: string[]
  downloadUrl: string | null
  isDownloaded: boolean
  isProcessing: boolean
}

export const loader: LoaderFunction = async ({ params }) => {
  const code = params.sku
  const { data } = await supabaseClient
    .from('Product')
    .select(
      'isLiked, isDownloaded, isProcessing, downloadUrl, mediaUrls, casts'
    )
    .match({ code })

  return {
    isSaved: (data?.length ?? 0) > 0,
    isLiked: data?.[0]?.isLiked ?? false,
    mediaUrls: data?.[0]?.mediaUrls ?? [],
    casts: data?.[0]?.casts ?? [],
    downloadUrl: data?.[0]?.downloadUrl ?? null,
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
      casts: [],
      downloadUrl: null,
      isDownloaded: false,
      isProcessing: false
    } as DBData
  }
  if (request.method === 'PATCH') {
    const formData = await getFormData(request)
    const { data } = await supabaseClient
      .from('Product')
      .update({
        ...formData,
        updatedAt: new Date().toISOString()
      })
      .match({ code })
    if (
      formData.downloadUrl &&
      data?.[0].id &&
      process.env.NODE_ENV === 'production'
    )
      await fetch(`${process.env.BATCH_JOB_SLS_ENDPOINT}${data[0].id}`)
    return {
      isSaved: true,
      isLiked: data?.[0].isLiked,
      mediaUrls: data?.[0].mediaUrls ?? [],
      casts: data?.[0].casts ?? [],
      downloadUrl: data?.[0].downloadUrl,
      isDownloaded: data?.[0].isDownloaded,
      isProcessing: data?.[0].isProcessing
    } as DBData
  }

  const {
    title,
    mainImageUrl,
    subImageUrls,
    casts,
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
      casts,
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
    casts: [],
    downloadUrl: null,
    isDownloaded: false,
    isProcessing: false
  } as DBData
}

const getFormData = async (req: Request): Promise<Record<string, unknown>> => {
  const parseValue = (v: string): string | number | boolean | null => {
    if (v === '') return null
    return v === 'false'
      ? false
      : v === 'true'
      ? true
      : Number.isNaN(Number(v))
      ? v
      : Number(v)
  }

  return Array.from((await req.formData()).entries()).reduce<
    Record<string, unknown>
  >((res, [k, v]) => {
    const parsedV = parseValue(v as string)
    if (k in res)
      return Array.isArray(res[k])
        ? {
            ...res,
            [k]: [...(res[k] as Array<unknown>), parsedV].filter(Boolean)
          }
        : { ...res, [k]: [res[k], parsedV].filter(Boolean) }

    return {
      ...res,
      [k]: parsedV
    }
  }, {})
}
