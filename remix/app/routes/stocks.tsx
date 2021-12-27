import { VFC } from 'react'
import { Link, LoaderFunction, useLoaderData } from 'remix'
import { createClient } from '@supabase/supabase-js'

type Data = {
  items: {
    id: string
    code: string
    isDownloaded: boolean
    isLiked: boolean
    title: string
    mainImageUrl: string
    idDownloaded: boolean
    isProcessing: boolean
  }[]
  page: number
}

export const loader: LoaderFunction = async ({ request }) => {
  const params = new URL(request.url).searchParams
  const page = Number(params.get('page') ?? 1)
  const supabase = createClient(
    process.env.SUPABASE_URL ?? '',
    process.env.SUPABASE_API_KEY ?? '',
    { fetch: (...args) => fetch(...args) }
  )

  const { data } = await supabase
    .from('Product')
    .select('*')
    .order('createdAt', { ascending: false })
    .range((page - 1) * 20, page * 20 - 1)

  return { items: data, page }
}

const Stocks: VFC = () => {
  const data = useLoaderData<Data>()

  return (
    <>
      {data.items.map(
        ({ code, mainImageUrl, title, isProcessing, isDownloaded }) => (
          <div className="w-full flex mb-2" key={code}>
            <Link
              to={`/product/${code}`}
              className="h-48 w-36 flex-none bg-contain bg-no-repeat text-center overflow-hidden"
              style={{
                backgroundImage: `url("${mainImageUrl}")`
              }}
            />
            <div className="flex flex-col justify-between leading-normal">
              <div className="mb-8">
                <Link
                  to={`/product/${code}`}
                  className="text-gray-200 block text-sm mb-2"
                >
                  {isProcessing ? (
                    <span className="text-yellow-600 pr-1">●</span>
                  ) : isDownloaded ? (
                    <span className="text-green-500 pr-1">●</span>
                  ) : (
                    <span className="text-gray-500 pr-1">●</span>
                  )}
                  {title.slice(0, 70)}
                </Link>
              </div>
            </div>
          </div>
        )
      )}
      <div className="px-4 py-3 flex items-center justify-between border-t border-gray-300">
        <div className="flex-1 flex justify-between">
          <Link
            to={`/stocks?page=${Math.max(data.page - 1, 1)}`}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-200"
          >
            Previous
          </Link>
          <Link
            to={`/stocks?page=${data.page + 1}`}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-200"
          >
            Next
          </Link>
        </div>
      </div>
    </>
  )
}

export default Stocks
