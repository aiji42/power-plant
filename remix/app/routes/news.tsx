import { Link, LoaderFunction, useLoaderData } from 'remix'
import { VFC } from 'react'

type Data = {
  items: {
    pid: string
    sku: string
    image_path: string
    name: string
    sample_movie_path: string
    suggest_actor: string
  }[]
  page: number
}

const HOST = 'https://sp.mgstage.com'
const IMAGE_HOST = 'https://image.mgstage.com'

export const loader: LoaderFunction = async ({ request }) => {
  const params = new URL(request.url).searchParams
  const page = Number(params.get('page') ?? 1)
  const res = await fetch(
    HOST + `/api/n/search/index.php?sort=new&page=${page}`,
    {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Linux; Android 6.0.1; Moto G (4)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.93 Mobile Safari/537.36',
        'Content-Type': 'application/json'
      }
    }
  )
  return {
    items: ((await res.json()) as { search_result: Data['items'] })
      .search_result,
    page
  }
}

const News: VFC = () => {
  const data = useLoaderData<Data>()

  return (
    <>
      {data.items.map(({ sku, image_path, name, sample_movie_path }) => (
        <div className="w-full flex mb-2" key={sku}>
          <Link
            to={`/product/${sku}`}
            className="h-48 w-36 flex-none bg-contain bg-no-repeat text-center overflow-hidden"
            style={{
              backgroundImage: `url("${IMAGE_HOST + image_path}")`
            }}
          />
          <div className="flex flex-col justify-between leading-normal">
            <div className="mb-8">
              <Link
                to={`/product/${sku}`}
                className="text-gray-200 block text-sm mb-2"
              >
                {name.slice(0, 70)}
              </Link>
            </div>
          </div>
        </div>
      ))}
      <div className="px-4 py-3 flex items-center justify-between border-t border-gray-300">
        <div className="flex-1 flex justify-between">
          <Link
            to={`/news?page=${Math.max(data.page - 1, 1)}`}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-200"
          >
            Previous
          </Link>
          <Link
            to={`/news?page=${data.page + 1}`}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-200"
          >
            Next
          </Link>
        </div>
      </div>
    </>
  )
}

export default News
