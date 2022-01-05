import { Link, LoaderFunction, useLoaderData } from 'remix'
import { useReducer, useRef, VFC } from 'react'
import {
  ProductListItem,
  productsFromDB,
  productsFromF,
  productsFromM
} from '~/utils/products.server'

type Data = {
  items: ProductListItem[]
  page: number
  provider: 'm' | 'f' | null
  order: string
  sort: string
  casts: string | null
  isDownloaded: string
}

export const loader: LoaderFunction = async ({ request }) => {
  const params = new URL(request.url).searchParams
  const page = Number(params.get('page') ?? 1)
  const provider = params.get('provider')
  const isDownloaded = params.get('isDownloaded') ?? ''
  const casts = params.get('casts')
  const order = params.get('order') ?? 'updatedAt'
  const sort = params.get('sort') ?? 'desc'
  const items = await (provider === 'm'
    ? productsFromM(page)
    : provider === 'f'
    ? productsFromF(page)
    : productsFromDB(page, { column: order, sort }, { casts, isDownloaded }))
  return {
    items,
    page,
    provider,
    order,
    sort,
    casts,
    isDownloaded
  }
}

const Products: VFC = () => {
  const { items, page, provider, order, sort, casts, isDownloaded } =
    useLoaderData<Data>()

  return (
    <>
      <Filter />
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
      <Pagination />
    </>
  )
}

export default Products

const downloadedOptions = {
  '': 'any',
  '1': 'done',
  '0': 'not yet'
}

const Filter: VFC = () => {
  const { order, sort, casts, isDownloaded, provider, page } =
    useLoaderData<Data>()
  const [open, toggle] = useReducer((s) => !s, false)
  const castInput = useRef<HTMLInputElement>(null)
  const form = useRef<HTMLFormElement>(null)
  if (provider) return null
  return !open ? (
    <p className="text-indigo-500">
      <span className="px-1">{order}</span>
      <span className="px-1">{sort}</span>
      <span className="px-1">
        {downloadedOptions[isDownloaded as keyof typeof downloadedOptions]}
      </span>
      <span className="px-1">{casts}</span>
      <img
        style={{
          filter:
            'invert(50%) sepia(0%) saturate(11%) hue-rotate(143deg) brightness(150%) contrast(93%);'
        }}
        src="https://img.icons8.com/ios/30/000000/sorting-options--v1.png"
        onClick={toggle}
        className="mb-2 mx-4 float-right"
      />
      <span className="px-1 float-right">Page {page}</span>
    </p>
  ) : (
    <form
      ref={form}
      className="w-full max-w-lg mb-8"
      onChange={(e) => e.currentTarget.submit()}
    >
      <div className="flex flex-wrap mb-4">
        <div className="w-full w-1/2 px-3">
          <label className="block text-gray-200 text-xs">Order</label>
          <select
            className="appearance-none bg-transparent w-full border-b border-indigo-500 text-gray-200 py-2 px-4 focus:outline-none"
            name="order"
            defaultValue={order}
          >
            {['createdAt', 'releasedAt'].map((opt) => (
              <option value={opt} key={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full w-1/2 px-3">
          <label className="block text-gray-200 text-xs">Sort</label>
          <select
            className="appearance-none bg-transparent w-full border-b border-indigo-500 text-gray-200 py-2 px-4 focus:outline-none"
            name="sort"
            defaultValue={sort}
          >
            {['asc', 'desc'].map((opt) => (
              <option value={opt} key={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap mb-4">
        <div className="w-full px-3">
          <label className="block text-gray-200 text-xs">downloaded</label>
          <select
            className="appearance-none bg-transparent w-full border-b border-indigo-500 text-gray-200 py-2 px-4 focus:outline-none"
            name="isDownloaded"
            defaultValue={isDownloaded}
          >
            {Object.entries(downloadedOptions).map(([value, name]) => (
              <option value={value} key={value}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {casts && (
        <div className="flex flex-wrap mb-4">
          <div className="w-full px-3">
            <label className="block text-gray-200 text-xs">cast</label>
            <div className="flex border-b border-indigo-500 py-2">
              <input
                ref={castInput}
                type="text"
                defaultValue={casts}
                className="appearance-none bg-transparent border-none w-full text-gray-200 mr-3 py-1 px-4 leading-tight focus:outline-none"
                name="casts"
                readOnly
              />
              <button
                type="button"
                className="flex-shrink-0 text-sm text-indigo-500 py-1 px-2"
                onClick={(e) => {
                  castInput.current && (castInput.current.value = '')
                  form.current?.submit()
                }}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  )
}

const Pagination: VFC = () => {
  const { page, provider, order, sort, casts, isDownloaded } =
    useLoaderData<Data>()
  const filter = {
    ...(provider && { provider }),
    ...(sort && { sort }),
    ...(order && { order }),
    ...(isDownloaded && { isDownloaded }),
    ...(casts && { casts })
  }

  return (
    <div className="px-4 py-3 flex items-center justify-between border-t border-gray-300">
      <div className="flex-1 flex justify-between">
        <Link
          to={`/products?${new URLSearchParams({
            page: String(Math.max(page - 1, 1)),
            ...filter
          }).toString()}`}
          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-200"
        >
          Previous
        </Link>
        <Link
          to={`/products?${new URLSearchParams({
            page: String(page + 1),
            ...filter
          }).toString()}`}
          className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-200"
        >
          Next
        </Link>
      </div>
    </div>
  )
}
