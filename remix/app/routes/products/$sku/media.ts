import { ActionFunction, json, LoaderFunction } from 'remix'
import { getMediaMeta } from '~/utils/media.server'
import { productFromDB } from '~/utils/product.server'
import { submitCompressionJob } from '~/utils/aws.server'

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

  const { id } = await productFromDB(code)

  await submitCompressionJob(id, url)

  return null
}
