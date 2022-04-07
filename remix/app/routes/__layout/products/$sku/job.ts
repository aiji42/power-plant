import { LoaderFunction } from '@remix-run/cloudflare'
import { productFromDB } from '~/utils/product.server'
import {
  JobSummary,
  listCompressionJobs,
  listDownloadJobs
} from '~/utils/aws.server'

export type JobListData = JobSummary[]

export const loader: LoaderFunction = async ({ request, params }) => {
  const code = params.sku as string
  const { id } = await productFromDB(code)

  const res = await Promise.all([listDownloadJobs(id), listCompressionJobs(id)])

  return res.flat()
}
