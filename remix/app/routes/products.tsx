import { Link, LoaderFunction, useLoaderData } from 'remix'
import { VFC } from 'react'
import {
  ProductListItem,
  productsFromDB,
  productsFromSite
} from '~/utils/products.server'

type Data = {
  items: ProductListItem[]
  page: number
  mode: 'news' | 'stocked'
}

export const loader: LoaderFunction = async ({ request }) => {
  const params = new URL(request.url).searchParams
  const page = Number(params.get('page') ?? 1)
  const mode = params.get('mode') ?? 'news'
  const items = await (mode === 'news'
    ? productsFromSite(page)
    : productsFromDB(page))
  return {
    items,
    page,
    mode
  }
}

const Products: VFC = () => {
  const data = useLoaderData<Data>()

  return (
    <>
      {data.items.map(
        ({ sku, image_path, name, isProcessing, isDownloaded }) => (
          <Link to={`/product/${sku}`} className="w-full flex mb-2" key={sku}>
            <div
              className="h-48 w-36 flex-none bg-contain bg-no-repeat text-center overflow-hidden"
              style={{
                backgroundImage: `url("${image_path}")`
              }}
            />
            <div className="flex flex-col justify-between leading-normal">
              <div className="mb-8">
                <p className="text-gray-200 block text-sm mb-2">
                  {isProcessing ? (
                    <span className="text-yellow-600 pr-1">●</span>
                  ) : isDownloaded ? (
                    <span className="text-green-500 pr-1">●</span>
                  ) : null}
                  {name.slice(0, 70)}
                </p>
              </div>
            </div>
          </Link>
        )
      )}
      <div className="px-4 py-3 flex items-center justify-between border-t border-gray-300">
        <div className="flex-1 flex justify-between">
          <Link
            to={`/products?page=${Math.max(data.page - 1, 1)}&mode=${
              data.mode
            }`}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-200"
          >
            Previous
          </Link>
          <Link
            to={`/products?page=${data.page + 1}&mode=${data.mode}`}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-200"
          >
            Next
          </Link>
        </div>
      </div>
    </>
  )
}

export default Products
