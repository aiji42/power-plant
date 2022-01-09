import { Link, LoaderFunction, useLoaderData } from 'remix'
import { RefObject, useReducer, useRef, VFC } from 'react'
import {
  ProductListItem,
  productsFromDB,
  productsFromF,
  productsFromM
} from '~/utils/products.server'

type Data = {
  items: ProductListItem[]
  page: number
  params: {
    provider: 'm' | 'f' | null
    order: string
    sort: string
    casts: string | null
    maker: string | null
    series: string | null
    isDownloaded: string
  }
}

export const loader: LoaderFunction = async ({ request }) => {
  const params = new URL(request.url).searchParams
  const page = Number(params.get('page') ?? 1)
  const provider = params.get('provider')
  const isDownloaded = params.get('isDownloaded') ?? ''
  const casts = params.get('casts')
  const maker = params.get('maker')
  const series = params.get('series')
  const order = params.get('order') ?? 'createdAt'
  const sort = params.get('sort') ?? 'desc'
  const items = await (provider === 'm'
    ? productsFromM(page)
    : provider === 'f'
    ? productsFromF(page)
    : productsFromDB(
        page,
        { column: order, sort },
        { casts, isDownloaded, maker, series }
      ))
  return {
    items,
    page,
    params: {
      provider,
      order,
      sort,
      casts,
      isDownloaded,
      maker,
      series
    }
  } as Data
}

const Products: VFC = () => {
  const { items } = useLoaderData<Data>()

  return (
    <>
      <Filter />
      {items.map(
        ({
          sku,
          image_path,
          name,
          isProcessing,
          isDownloaded,
          casts,
          maker,
          series
        }) => (
          <Link
            to={`/products/${sku}`}
            key={sku}
            className="flex items-center flex-row mb-1 py-1 hover:bg-gray-800"
          >
            <img
              className="object-cover w-full h-96 h-auto w-32"
              src={image_path}
            />
            <div className="flex flex-col justify-between px-2 leading-normal">
              <h2 className="mb-1 text-xs tracking-tight truncate w-52">
                {isProcessing ? (
                  <span className="text-yellow-600 pr-1">●</span>
                ) : isDownloaded ? (
                  <span className="text-green-500 pr-1">●</span>
                ) : null}
                {name}
              </h2>
              <p className="mb-1 text-xs text-gray-600">{sku}</p>
              {maker && (
                <p className="mb-1 text-xs text-gray-400">
                  {
                    <>
                      {maker}
                      {series && maker !== series && (
                        <>
                          <br />
                          {series}
                        </>
                      )}
                    </>
                  }
                </p>
              )}
              {!!casts?.length && (
                <p className="mb-1 text-xs text-gray-400">
                  {casts.map((cast) => (
                    <span key={cast} className="pr-1">
                      {cast}
                    </span>
                  ))}
                </p>
              )}
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
  const {
    params: { order, sort, casts, isDownloaded, provider, maker, series }
  } = useLoaderData<Data>()
  const [open, toggle] = useReducer((s) => !s, false)
  const form = useRef<HTMLFormElement>(null)
  if (provider) return null
  return !open ? (
    <p className="text-indigo-500 mb-4" onClick={toggle}>
      <span className="px-1">{order}</span>
      <span className="px-1">{sort}</span>
      <span className="px-1">
        {downloadedOptions[isDownloaded as keyof typeof downloadedOptions]}
      </span>
      {casts && <span className="px-1">{casts}</span>}
      {maker && <span className="px-1">{maker}</span>}
      {series && <span className="px-1">{series}</span>}
    </p>
  ) : (
    <form
      ref={form}
      className="w-full max-w-lg mb-8"
      onChange={(e) => e.currentTarget.submit()}
    >
      <div className="flex flex-wrap mb-4">
        <div className="w-full w-1/2 px-3">
          <label className="block text-xs">Order</label>
          <select
            className="appearance-none bg-transparent w-full border-b border-indigo-500 py-2 px-4 focus:outline-none"
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
          <label className="block text-xs">Sort</label>
          <select
            className="appearance-none bg-transparent w-full border-b border-indigo-500 py-2 px-4 focus:outline-none"
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
          <label className="block text-xs">downloaded</label>
          <select
            className="appearance-none bg-transparent w-full border-b border-indigo-500 py-2 px-4 focus:outline-none"
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

      {[
        { type: 'cast', value: casts },
        { type: 'maker', value: maker },
        { type: 'series', value: series }
      ]
        .filter(
          (
            item
          ): item is {
            type: string
            value: string
          } => !!item.value
        )
        .map(({ type, value }) => (
          <div className="flex flex-wrap mb-4" key={type}>
            <div className="w-full px-3">
              <label className="block text-xs">{type}</label>
              <div className="flex border-b border-indigo-500 py-2">
                <input
                  type="text"
                  defaultValue={value}
                  className="appearance-none bg-transparent border-none w-full mr-3 py-2 px-4 leading-tight focus:outline-none"
                  name="casts"
                  readOnly
                />
                <button
                  type="button"
                  className="flex-shrink-0 text-sm text-indigo-500 hover:text-indigo-400 hover:bg-gray-800 py-2 px-2"
                  onClick={(e) => {
                    if (
                      e.currentTarget.previousElementSibling instanceof
                      HTMLInputElement
                    )
                      e.currentTarget.previousElementSibling.value = ''
                    form.current?.submit()
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        ))}
    </form>
  )
}

const Pagination: VFC = () => {
  const { page, params } = useLoaderData<Data>()
  const filter = Object.entries(params).reduce(
    (res, [key, val]) => (!val ? res : { ...res, [key]: val }),
    {}
  )

  return (
    <div className="bg-gray-900 flex items-center justify-between border-t border-gray-500 sticky bottom-0 w-full">
      <div className="flex-1 flex justify-between">
        <Link
          to={`/products?${new URLSearchParams({
            page: String(Math.max(page - 1, 1)),
            ...filter
          }).toString()}`}
          className="relative inline-flex items-center py-2 px-8 text-xl font-medium hover:bg-gray-800"
        >
          &larr;
        </Link>

        <p className="py-2">{page}</p>

        <Link
          to={`/products?${new URLSearchParams({
            page: String(page + 1),
            ...filter
          }).toString()}`}
          className="relative inline-flex items-center py-2 px-8 text-xl font-medium hover:bg-gray-800"
        >
          &rarr;
        </Link>
      </div>
    </div>
  )
}
