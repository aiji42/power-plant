import { Link, LoaderFunction, useLoaderData } from 'remix'
import { VFC } from 'react'
import {
  ProductListItem,
  productsFromDB,
  productsFromF,
  productsFromM
} from '~/utils/products.server'

type Data = {
  items: ProductListItem[]
  page: number
  provider: 'm' | 'f'
}

export const loader: LoaderFunction = async ({ request }) => {
  const params = new URL(request.url).searchParams
  const page = Number(params.get('page') ?? 1)
  const provider = params.get('provider')
  const items = await (provider === 'm'
    ? productsFromM(page)
    : provider === 'f'
    ? productsFromF(page)
    : productsFromDB(page))
  return {
    items,
    page,
    provider
  }
}

const Products: VFC = () => {
  const { items, page, provider } = useLoaderData<Data>()

  return (
    <>
      {items.map(
        ({ sku, image_path, name, isProcessing, isDownloaded, casts }) => (
          <Link to={`/products/${sku}`} className="w-full flex mb-2" key={sku}>
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
                <p className="text-indigo-500 block text-sm mb-2">
                  {casts?.join(', ')}
                </p>
              </div>
            </div>
          </Link>
        )
      )}
      <div className="px-4 py-3 flex items-center justify-between border-t border-gray-300">
        <div className="flex-1 flex justify-between">
          <Link
            to={`/products?${new URLSearchParams({
              page: String(Math.max(page - 1, 1)),
              provider: provider ?? ''
            }).toString()}`}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-200"
          >
            Previous
          </Link>
          <Link
            to={`/products?${new URLSearchParams({
              page: String(page + 1),
              provider: provider ?? ''
            }).toString()}`}
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
