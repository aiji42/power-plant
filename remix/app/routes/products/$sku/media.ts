import { ActionFunction, json, LoaderFunction } from '@remix-run/cloudflare'
import { getMediaMeta, MediaMetaData } from '~/utils/media.server'
import { productFromDB } from '~/utils/product.server'
import { deleteMedia, submitCompressionJob } from '~/utils/aws.server'
import { getBucketAndKeyFromURL } from '~/utils/aws'
import { supabaseClient } from '~/utils/supabase.server'

export type MediaData = MediaMetaData | null

export const loader: LoaderFunction = async ({ request }) => {
  const params = new URL(request.url)
  const url = params.searchParams.get('mediaURL')
  if (!url || !url.includes('s3')) return {}

  return await getMediaMeta(url)
}

export const action: ActionFunction = async ({ request, params }) => {
  const code = params.sku as string
  const formData = await request.formData()
  const url = formData.get('mediaUrl')
  if (typeof url !== 'string') return json(null, { status: 400 })
  const { mediaUrls, id } = await productFromDB(code)

  if (request.method === 'DELETE') {
    const newMediaUrls = mediaUrls.filter((src) => src !== url)
    await supabaseClient
      .from('Product')
      .update({
        mediaUrls: newMediaUrls,
        isDownloaded: newMediaUrls.length > 0,
        updatedAt: new Date().toISOString()
      })
      .match({ code })
    await deleteMedia(...getBucketAndKeyFromURL(url))
    return null
  }

  await submitCompressionJob(id, url)
  return await getMediaMeta(url)
}
