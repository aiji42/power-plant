import { json, Link, LoaderFunction, useLoaderData } from 'remix'
import { useInView } from 'react-intersection-observer'
import { Ref, useEffect, useReducer, useRef, useState, VFC } from 'react'
import {
  ProductListItem,
  productsFromDB,
  productsFromF,
  productsFromM
} from '~/utils/products.server'
import { filterConditionStore } from '~/utils/cookie.server'
import { useSwipeable, SwipeDirections } from 'react-swipeable'

type Data = {
  items: ProductListItem[]
  page: number
  params: {
    provider: 'm' | 'f' | null
    order: string
    sort: string
    fSort: string
    mSort: string
    floor: string
    keyword: string | null
    isDownloaded: string
  }
}

export const loader: LoaderFunction = async ({ request }) => {
  const params = new URL(request.url).searchParams
  const page = Number(params.get('page') ?? 1)
  const provider = params.get('provider')

  const cookie =
    (await filterConditionStore.parse(request.headers.get('Cookie'))) || {}

  const isDownloaded = params.get('isDownloaded') ?? cookie.isDownloaded ?? ''
  const keyword = params.get('keyword')
  const order = params.get('order') ?? cookie.order ?? 'createdAt'
  const sort = params.get('sort') ?? cookie.sort ?? 'desc'
  const floor = params.get('floor') ?? 'videoc'
  const fSort = params.get('fSort') ?? 'date'
  const mSort = params.get('mSort') ?? 'new'
  const items = await (provider === 'm'
    ? productsFromM(page, mSort, keyword)
    : provider === 'f'
    ? productsFromF(page, fSort, floor, keyword)
    : productsFromDB(page, { column: order, sort }, { isDownloaded, keyword }))
  return json(
    {
      items,
      page,
      params: {
        provider,
        order,
        sort,
        fSort,
        mSort,
        isDownloaded,
        keyword,
        floor
      }
    } as Data,
    {
      headers: {
        'Set-Cookie': await filterConditionStore.serialize({
          isDownloaded,
          order,
          sort
        })
      }
    }
  )
}

const Products: VFC = () => {
  const { items } = useLoaderData<Data>()
  const prevRef = useRef<HTMLAnchorElement>(null)
  const nextRef = useRef<HTMLAnchorElement>(null)
  const [swipingDir, setSwipingDir] = useState<null | SwipeDirections>(null)
  const handler = useSwipeable({
    onSwipedLeft: () => {
      setSwipingDir(null)
      nextRef.current?.click()
    },
    onSwipedRight: () => {
      setSwipingDir(null)
      prevRef.current?.click()
    },
    onSwiping: ({ dir }) => {
      setSwipingDir(dir)
    },
    delta: 100
  })

  return (
    <div {...handler}>
      <Filter />
      <div className="min-h-screen">
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
              className="flex items-center flex-row mb-1 py-1 active:bg-gray-800"
            >
              <Thumbnail src={image_path} />
              <div className="flex flex-col justify-between px-2 leading-normal">
                <h2 className="mb-1 text-xs tracking-tight truncate w-56">
                  {isProcessing ? (
                    <span className="text-yellow-600 pr-1">●</span>
                  ) : isDownloaded ? (
                    <span className="text-green-500 pr-1">●</span>
                  ) : null}
                  {name}
                </h2>
                <p className="mb-1 text-xs tracking-tight text-gray-600">
                  {sku}
                </p>
                {maker && (
                  <p className="mb-1 text-xs tracking-tight text-gray-400">
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
                  <p className="mb-1 text-xs tracking-tight text-gray-400 truncate w-56">
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
      </div>
      <Pagination nextRef={nextRef} prevRef={prevRef} />
      {swipingDir === 'Right' ? (
        <div className="fixed top-1/2 left-0 p-4 rounded-lg bg-indigo-800 text-2xl">
          &larr;
        </div>
      ) : swipingDir === 'Left' ? (
        <div className="fixed top-1/2 right-0 p-4 rounded-lg bg-indigo-800 text-2xl">
          &rarr;
        </div>
      ) : null}
    </div>
  )
}

export default Products

const Thumbnail: VFC<{ src: string }> = ({ src }) => {
  const [isSquare, setIsSquare] = useState(false)
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: '100px'
  })
  const imgRef = useRef<HTMLImageElement>(null)
  useEffect(() => {
    if (imgRef.current)
      setIsSquare(imgRef.current.naturalHeight === imgRef.current.naturalWidth)
  }, [inView])

  return (
    <span ref={ref}>
      <img
        ref={imgRef}
        style={{
          objectFit: isSquare ? 'scale-down' : 'cover',
          objectPosition: '100% 100%'
        }}
        width={70 * 1.6}
        height={100 * 1.6}
        src={src}
        loading="lazy"
      />
    </span>
  )
}

const downloadedOptions = {
  '': 'any',
  '1': 'done',
  '0': 'not yet'
}

const Filter: VFC = () => {
  const {
    params: {
      order,
      floor,
      fSort,
      mSort,
      sort,
      isDownloaded,
      provider,
      keyword
    }
  } = useLoaderData<Data>()
  const [open, toggle] = useReducer((s) => !s, false)
  const form = useRef<HTMLFormElement>(null)
  return !open ? (
    <p className="text-indigo-500 mb-4" onClick={toggle}>
      {provider === 'f' ? (
        <>
          <span className="px-1">{fSort}</span>
          <span className="px-1">{floor}</span>
        </>
      ) : provider === 'm' ? (
        <span className="px-1">{mSort}</span>
      ) : (
        <>
          <span className="px-1">{order}</span>
          <span className="px-1">{sort}</span>
          <span className="px-1">
            {downloadedOptions[isDownloaded as keyof typeof downloadedOptions]}
          </span>
        </>
      )}
      <span className="px-1">{keyword}</span>
    </p>
  ) : (
    <form ref={form} className="w-full max-w-lg mb-8">
      {provider === 'f' && (
        <div className="flex flex-wrap mb-4">
          <div className="w-full w-1/2 px-3">
            <label className="block text-xs">Order</label>
            <select
              className="appearance-none bg-transparent w-full border-b border-indigo-500 py-2 px-4 focus:outline-none"
              name="fSort"
              defaultValue={fSort}
            >
              {['date', 'rank'].map((opt) => (
                <option value={opt} key={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <input type="hidden" name="provider" value="f" />
          </div>
          <div className="w-full w-1/2 px-3">
            <label className="block text-xs">Floor</label>
            <select
              className="appearance-none bg-transparent w-full border-b border-indigo-500 py-2 px-4 focus:outline-none"
              name="floor"
              defaultValue={floor}
            >
              {['videoc', 'videoa'].map((opt) => (
                <option value={opt} key={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
      {provider === 'm' && (
        <div className="flex flex-wrap mb-4">
          <div className="w-full w-1/2 px-3">
            <label className="block text-xs">Order</label>
            <select
              className="appearance-none bg-transparent w-full border-b border-indigo-500 py-2 px-4 focus:outline-none"
              name="mSort"
              defaultValue={mSort}
            >
              {['new', 'popular'].map((opt) => (
                <option value={opt} key={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <input type="hidden" name="provider" value="m" />
          </div>
        </div>
      )}
      {!provider && (
        <>
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
        </>
      )}
      <div className="flex flex-wrap mb-4">
        <div className="w-full px-3">
          <label className="block text-xs">keyword</label>
          <div className="flex border-b border-indigo-500 py-2">
            <input
              type="text"
              defaultValue={keyword ?? ''}
              className="appearance-none bg-transparent border-none w-full mr-3 py-2 px-4 leading-tight focus:outline-none"
              name="keyword"
            />
            <button
              type="submit"
              className="flex-shrink-0 text-sm text-indigo-500 active:text-indigo-400 active:bg-gray-800 py-2 px-2"
            >
              Search
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}

const Pagination: VFC<{
  prevRef?: Ref<HTMLAnchorElement>
  nextRef?: Ref<HTMLAnchorElement>
}> = ({ nextRef, prevRef }) => {
  const { page, params } = useLoaderData<Data>()
  const filter = Object.entries(params).reduce(
    (res, [key, val]) => (!val ? res : { ...res, [key]: val }),
    {}
  )

  return (
    <div className="bg-gray-900 flex items-center justify-between border-t border-gray-500 sticky bottom-0 w-full">
      <div className="flex-1 flex justify-between">
        <Link
          ref={prevRef}
          to={`/products?${new URLSearchParams({
            page: String(Math.max(page - 1, 1)),
            ...filter
          }).toString()}`}
          className="relative inline-flex items-center py-2 px-8 text-xl font-medium active:bg-gray-800"
        >
          &larr;
        </Link>

        <p className="py-2">{page}</p>

        <Link
          ref={nextRef}
          to={`/products?${new URLSearchParams({
            page: String(page + 1),
            ...filter
          }).toString()}`}
          className="relative inline-flex items-center py-2 px-8 text-xl font-medium active:bg-gray-800"
        >
          &rarr;
        </Link>
      </div>
    </div>
  )
}
