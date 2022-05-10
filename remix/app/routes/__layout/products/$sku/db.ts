import { ActionFunction } from '@remix-run/cloudflare'
import { DBData, searchProductFromSite } from '~/utils/product.server'
import { deleteMedia, submitDownloadJob } from '~/utils/aws.server'
import { getBucketAndKeyFromURL } from '~/utils/aws'
import { cacheable } from '~/utils/kv.server'
import { db } from '~/utils/prisma.server'

export const action: ActionFunction = async ({ request, params }) => {
  const code = params.sku as string
  if (request.method === 'DELETE') {
    const data = await db.product.delete({ where: { code } })
    if (process.env.NODE_ENV === 'production')
      await Promise.all(
        data.mediaUrls.map((url: string) =>
          deleteMedia(...getBucketAndKeyFromURL(url))
        ) ?? []
      )
    return {
      isSaved: false,
      isLiked: false,
      mediaUrls: [],
      casts: [],
      downloadUrl: null,
      isDownloaded: false,
      isProcessing: false,
      genres: []
    } as DBData
  }
  if (request.method === 'PATCH') {
    const formData = await getFormData(request)
    const {
      isLiked,
      mediaUrls,
      casts,
      downloadUrl,
      isDownloaded,
      isProcessing,
      id
    } = await db.product.update({ where: { code }, data: formData })
    if (formData.downloadUrl && process.env.NODE_ENV === 'production')
      await submitDownloadJob(id)
    return {
      isSaved: true,
      isLiked,
      mediaUrls,
      casts,
      downloadUrl,
      isDownloaded,
      isProcessing
    } as DBData
  }

  const {
    title,
    mainImageUrl,
    subImageUrls,
    length,
    genres,
    series,
    releasedAt,
    maker
  } = await cacheable(
    `searchProductFromSite-${code}`,
    searchProductFromSite(code),
    { cacheable: false } // FIXME: I dont know why cacheable is false
  )

  await db.product.create({
    data: {
      code,
      title,
      mainImageUrl,
      subImageUrls,
      casts: [],
      length,
      genres,
      series,
      releasedAt: releasedAt ? new Date(releasedAt) : releasedAt,
      maker
    }
  })

  return {
    isSaved: true,
    isLiked: false,
    mediaUrls: [],
    casts: [],
    downloadUrl: null,
    isDownloaded: false,
    isProcessing: false,
    genres: []
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
