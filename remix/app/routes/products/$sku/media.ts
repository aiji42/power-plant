import { LoaderFunction } from 'remix'
import { getMediaMeta } from '~/utils/media.server'

export const loader: LoaderFunction = async ({ request }) => {
  const params = new URL(request.url)
  const url = params.searchParams.get('mediaURL')
  if (!url || !url.includes('s3')) return {}

  return await getMediaMeta(url)
}
