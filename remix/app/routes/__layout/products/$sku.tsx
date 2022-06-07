import { useFetcher, useLoaderData, Link } from '@remix-run/react'
import { LoaderFunction, redirect } from '@remix-run/cloudflare'
import {
  ChangeEvent,
  ChangeEventHandler,
  RefObject,
  useCallback,
  useEffect,
  useReducer,
  useRef,
  MouseEvent,
  VFC
} from 'react'
import { TorrentsData } from './$sku/torrent'
import {
  ProductFromSite,
  productFromDB,
  DBData,
  searchProductFromSite
} from '~/utils/product.server'
import { CastsData } from '~/routes/__layout/products/$sku/casts'
import { cacheable } from '~/utils/kv.server'
import { JobListData } from '~/routes/__layout/products/$sku/job'
import { MediaData } from '~/routes/__layout/products/$sku/media'
import { SwipeToRandom } from '~/components/SwipeToRandom'
import {
  LoaderData as StealthData,
  loaderHandler as stealthLoader
} from '~/forms/StealthModeToggle'

type Data = ProductFromSite & DBData & StealthData

export const loader: LoaderFunction = async ({
  request,
  params: { sku = '' }
}) => {
  const db = productFromDB(sku)
  const data = await cacheable(
    `searchProductFromSite-${sku}`,
    searchProductFromSite(sku),
    (res) => ({
      expirationTtl: res.code.length > 0 ? 3600 * 24 * 3 : 60
    })
  )
  if (data.code && data.code !== sku) return redirect(`/products/${data.code}`)
  const dbData = await db

  return {
    ...dbData,
    ...Object.fromEntries(Object.entries(data).filter(([, v]) => v)),
    ...(await stealthLoader({ request }))
  }
}

const Product = () => {
  const {
    title,
    mainImageUrl,
    subImageUrls,
    sample,
    isSaved,
    isProcessing,
    isDownloaded,
    casts,
    mediaUrls,
    stealthMode,
    ...data
  } = useLoaderData<Data>()

  const dbFetcher = useFetcher<DBData>()

  const stock = useCallback(() => {
    if (isSaved && !confirm('Is it okay if I delete the stock?')) return
    dbFetcher.submit(null, {
      method: isSaved ? 'delete' : 'post',
      action: `/products/${data.code}/db`
    })
  }, [dbFetcher.submit, isSaved, data.code])

  const [truncate, toggleTruncate] = useReducer((s) => !s, true)
  const [castFormOpen, openCastForm] = useReducer(() => true, casts.length < 1)
  const [mediaDownloadOpen, openMediaForm] = useReducer(() => true, false)

  return (
    <SwipeToRandom disabled={!data.id}>
      <div className="grid grid-cols-8">
        <h1
          className={`px-1 col-span-7 ${truncate ? 'truncate' : ''}`}
          onClick={toggleTruncate}
        >
          {isSaved && (
            <span
              className={`text-sm pr-1 ${
                isProcessing
                  ? 'text-yellow-600'
                  : isDownloaded
                  ? 'text-green-500'
                  : 'text-gray-400'
              }`}
            >
              {isDownloaded || isProcessing ? '●' : '○'}
            </span>
          )}
          {title}
        </h1>
        <button onClick={stock} className="text-yellow-600 text-2xl">
          {isSaved ? '★' : '☆'}
        </button>
      </div>

      <div className="mb-4 px-1">
        {casts.map(({ count, name }) => (
          <CastLink cast={name} count={count} key={name} />
        ))}
        {!castFormOpen ? (
          <span
            onClick={openCastForm}
            className="text-xs font-semibold inline-block py-1 px-2 rounded-full text-indigo-200 active:text-indigo-100 last:mr-0 mr-1 mb-1"
          >
            edit
          </span>
        ) : (
          <CastsForm />
        )}
      </div>

      {mainImageUrl && (
        <img
          src={stealthMode ? 'https://picsum.photos/200/300' : mainImageUrl}
          className="w-full mb-2"
        />
      )}

      <dl className="mb-4">
        {Object.entries(data)
          .filter(([key]) =>
            [
              'actor',
              'maker',
              'series',
              'releasedAt',
              'code',
              'genres'
            ].includes(key)
          )
          .map(([key, val], index) => (
            <div
              key={key}
              className={`${
                index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-700'
              }  px-4 py-5 grid grid-cols-3 gap-4`}
            >
              <dt className="text-sm font-medium">{key}</dt>
              <dd className="text-sm mt-0 col-span-2">
                {['maker', 'series'].includes(key) ? (
                  <Link
                    to={`/products?keyword=${val}`}
                    className="text-indigo-400 active:text-indigo-300 w-full block"
                  >
                    {val}
                  </Link>
                ) : Array.isArray(val) ? (
                  val.map((v) => <p key={v}>{v}</p>)
                ) : (
                  val
                )}
              </dd>
            </div>
          ))}
      </dl>

      {isSaved && <JobStatus />}

      {mediaUrls.map((url) => (
        <Media url={url} key={url} />
      ))}

      {!mediaDownloadOpen ? (
        <p
          onClick={openMediaForm}
          className="px-1 py-2 text-indigo-500 active:text-indigo-400 active:bg-gray-800 mb-4"
        >
          Media Download Form
        </p>
      ) : (
        <MediaDownloadForm dbFetcher={dbFetcher} />
      )}

      <hr className="mb-4" />

      {sample && <video src={sample} controls className="w-full" />}

      {subImageUrls.map((src) => (
        <img src={src} loading="lazy" className="w-full mb-2" key={src} />
      ))}
    </SwipeToRandom>
  )
}

export default Product

const CastsForm: VFC = () => {
  const { casts, isSaved, code } = useLoaderData<Data>()
  const castFetcher = useFetcher<CastsData>()
  useEffect(() => {
    castFetcher.load(`/products/${code}/casts`)
  }, [castFetcher.load])
  const refSelected = useRef<string[]>(casts.map(({ name }) => name))
  const handler = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (e) => {
      castFetcher.submit(
        { cast: e.target.value },
        {
          method: e.target.checked ? 'post' : 'delete',
          action: `/products/${code}/casts`
        }
      )
    },
    [castFetcher.submit, code]
  )

  const textInput = useRef<HTMLInputElement>(null)
  const textInputHandler = useCallback(() => {
    if (!textInput.current?.value) return
    refSelected.current = [...refSelected.current, textInput.current.value]

    castFetcher.submit(
      { cast: textInput.current.value },
      {
        method: 'post',
        action: `/products/${code}/casts`
      }
    )
  }, [castFetcher.submit, code])

  const selectableCasts = [
    ...(castFetcher.data?.data ?? []),
    ...casts.map(({ name, count }) => ({ name, count, link: '' }))
  ].reduce<CastsData['data']>((res, item) => {
    if (res.some(({ name }) => name === item.name)) return res
    return [...res, item]
  }, [])

  return (
    <form className="flex flex-col">
      {selectableCasts.map(({ name, link, count }) => (
        <div key={name} className="inline-flex items-center mt-3">
          <label className="py-1 mb-1">
            <input
              type="checkbox"
              name="casts"
              className="form-checkbox h-5 w-5"
              disabled={!isSaved}
              value={name}
              defaultChecked={refSelected.current.includes(name)}
              onChange={handler}
            />
            <span className="ml-2">
              {name} ({count})
            </span>
          </label>
          {link && (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="pl-4 text-indigo-500"
            >
              &rarr;
            </a>
          )}
        </div>
      ))}
      <div className="flex border-b border-indigo-500 py-2">
        <input
          ref={textInput}
          type="text"
          className="appearance-none bg-transparent border-none w-full mr-3 py-1 px-4 leading-tight focus:outline-none"
          name="casts"
        />
        <button
          onClick={textInputHandler}
          type="button"
          className="flex-shrink-0 text-sm text-indigo-500 active:text-indigo-400 active:bg-gray-800 py-1 px-2"
        >
          Add
        </button>
      </div>
      {castFetcher.state === 'loading' && (
        <p className="text-indigo-500 mt-3">Loading...</p>
      )}
      <span>{castFetcher.data?.error}</span>
    </form>
  )
}

const JobStatus = () => {
  const { code } = useLoaderData<Data>()
  const jobFetcher = useFetcher<JobListData>()
  useEffect(() => {
    jobFetcher.load(`/products/${code}/job`)
  }, [jobFetcher.load, code])

  if (!jobFetcher.data) return null
  return (
    <dl className="mb-4">
      {jobFetcher.data.map(
        ({ type, jobId, status, createdAt, stoppedAt, duration }, index) => (
          <div
            key={jobId}
            className={`${
              index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-700'
            }  px-4 py-5 grid grid-cols-3 gap-4`}
          >
            <dt className="text-sm font-medium">{type}</dt>
            <dd className="text-sm mt-0 col-span-2">
              <p
                className={
                  status === 'FAILED'
                    ? 'text-red-500'
                    : status === 'SUCCEEDED'
                    ? 'text-green-500'
                    : 'text-yellow-600'
                }
              >
                {status}
              </p>
              {createdAt && (
                <p>created: {new Date(createdAt).toLocaleString()}</p>
              )}
              {stoppedAt && duration && (
                <p>
                  stopped: {new Date(stoppedAt).toLocaleString()} (
                  {Math.floor(duration / 60000)}m)
                </p>
              )}
            </dd>
          </div>
        )
      )}
    </dl>
  )
}

const MediaDownloadForm: VFC<{ dbFetcher: ReturnType<typeof useFetcher> }> = ({
  dbFetcher
}) => {
  const torrentsFetcher = useFetcher<TorrentsData>()
  const { code, isSaved, downloadUrl } = useLoaderData<Data>()
  useEffect(() => {
    torrentsFetcher.load(`/products/${code}/torrent`)
  }, [torrentsFetcher.load, code])
  const [inputValue, handleInputValue] = useReducer(
    (s: string, e: ChangeEvent<HTMLTextAreaElement> | string) => {
      return typeof e === 'string' ? e : e.target.value
    },
    ''
  )
  useEffect(() => {
    dbFetcher.state === 'idle' && handleInputValue('')
  }, [dbFetcher.state])
  const addToTransmission = useCallback(
    (url: string) => {
      if (torrentsFetcher.data?.transmissionEndpoint)
        navigator.clipboard.writeText(url).then(() => {
          torrentsFetcher.data?.transmissionEndpoint &&
            open(torrentsFetcher.data.transmissionEndpoint, '_blank')
        })
    },
    [torrentsFetcher.data?.transmissionEndpoint]
  )

  const Form = dbFetcher.Form

  return (
    <>
      {isSaved && (
        <Form
          action={`/products/${code}/db`}
          method="patch"
          className="w-full max-w-sm mb-2"
        >
          <div className="flex items-center border-b border-indigo-500 py-2">
            <input type="hidden" name="isProcessing" value="false" />
            <textarea
              className="appearance-none bg-transparent border-none w-full mr-3 py-1 px-2 leading-tight focus:outline-none"
              name="downloadUrl"
              value={inputValue}
              onChange={handleInputValue}
              placeholder={downloadUrl ?? ''}
              required
            />
            <button
              disabled={inputValue.trim().length < 1}
              className="flex-shrink-0 text-sm text-indigo-500 py-1 px-2 disabled:opacity-50"
            >
              Set download url
            </button>
          </div>
        </Form>
      )}
      {torrentsFetcher.state === 'loading' ? (
        <div className="text-center mb-4">Loading</div>
      ) : (
        <dl className="mb-4">
          {torrentsFetcher.data?.items?.map(
            ({ title, link, completed, size, registeredAt }, index) => (
              <div
                key={index}
                className={`${
                  index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-700'
                }  px-4 py-5 text-sm`}
              >
                <div onClick={() => handleInputValue(link)}>
                  <p className="truncate">
                    {link === inputValue ? (
                      <span className="text-indigo-500 pr-1">○</span>
                    ) : downloadUrl === link ? (
                      <span className="text-indigo-500 pr-1">●</span>
                    ) : null}
                    {title}
                  </p>
                  <p>completed: {completed}</p>
                  <p>size: {size}</p>
                  <p>registered: {registeredAt}</p>
                </div>
                {torrentsFetcher.data?.transmissionEndpoint && (
                  <button
                    className="mt-2 text-indigo-500 active:text-indigo-400"
                    type="button"
                    onClick={() => addToTransmission(link)}
                  >
                    Add to transmission
                  </button>
                )}
              </div>
            )
          )}
        </dl>
      )}
    </>
  )
}

const Media: VFC<{ url: string }> = ({ url }) => {
  const { code } = useLoaderData<Data>()
  const fetcher = useFetcher<MediaData>()
  useEffect(() => {
    fetcher.load(`/products/${code}/media?mediaURL=${url}`)
  }, [fetcher.load, code])
  const meta = fetcher.data

  const compression = useCallback(() => {
    if (!confirm(`Do you want to compress this file? (${meta?.size})`)) return
    fetcher.submit(
      { mediaUrl: url },
      { action: `/products/${code}/media`, method: 'post' }
    )
  }, [fetcher.submit, code, url, meta?.size])
  const remove = useCallback(() => {
    if (!confirm(`Do you want to remove this file? (${meta?.size})`)) return
    fetcher.submit(
      { mediaUrl: url },
      { action: `/products/${code}/media`, method: 'delete' }
    )
  }, [fetcher.submit, code, url, meta?.size])
  if (!meta) return null
  if (fetcher.submission?.method === 'DELETE') return null

  return (
    <div className="w-full mb-4">
      <video src={url} controls key={url} className="w-full mb-1" />
      <a
        href={url}
        className="p-1 text-sm text-indigo-500 active:text-indigo-400 active:bg-gray-800 block w-full"
      >
        {meta.size}/{meta.resolution}/{meta.bitRate}/{meta.frameRate}/
        {meta.duration}/{meta.codec}
      </a>
      <button
        className="p-1 text-sm text-indigo-500 active:text-indigo-400 active:bg-gray-800"
        onClick={compression}
      >
        compress
      </button>
      <button
        className="p-1 text-sm text-red-500 active:text-red-400 active:bg-gray-800"
        onClick={remove}
      >
        remove
      </button>
    </div>
  )
}

const CastLink: VFC<{ cast: string; count: number }> = ({ cast, count }) => {
  const ref = useRef<HTMLParagraphElement>(null)
  const [clickedPosition, handleClick] = useReducer(
    (s: { x: number; y: number } | null, e: MouseEvent<HTMLElement> | null) => {
      if (!e) return null
      return { x: e.pageX, y: e.pageY }
    },
    null
  )
  useClickOutside(ref, () => handleClick(null))
  return (
    <>
      <p
        onClick={handleClick}
        ref={ref}
        key={cast}
        className="text-xs font-semibold inline-block py-1 px-2 rounded-full text-indigo-600 bg-indigo-200  active:text-indigo-500 active:bg-indigo-100 last:mr-0 mr-1 mb-1"
      >
        {cast} ({count})
      </p>
      <div
        className="absolute left-0 w-40 py-2 mt-1 bg-indigo-200 rounded-md shadow-xl text-xs"
        style={{
          display: !clickedPosition ? 'none' : 'block',
          left: Math.min(clickedPosition?.x ?? 0, 220)
        }}
      >
        <Link
          to={`/products?keyword=${cast}`}
          className="block px-4 py-2 text-indigo-600 active:text-indigo-300"
        >
          Power Plant
        </Link>
        <a
          href={`https://av-wiki.net/?s=${cast}&post_type=product`}
          className="block px-4 py-2 text-indigo-600 active:text-indigo-300"
          target="_blank"
          rel="noopener noreferrer"
        >
          av-wiki.net
        </a>
        <a
          href={`https://shiroutoname.com/?s=${cast}`}
          className="block px-4 py-2 text-indigo-600 active:text-indigo-300"
          target="_blank"
          rel="noopener noreferrer"
        >
          shiroutoname.com
        </a>
        <a
          href={`https://av-actress-star.com/?s=${cast}`}
          className="block px-4 py-2 text-indigo-600 active:text-indigo-300"
          target="_blank"
          rel="noopener noreferrer"
        >
          av-actress-star.com
        </a>
      </div>
    </>
  )
}

const useClickOutside = (
  ref: RefObject<HTMLElement>,
  callback: (...args: unknown[]) => void
) => {
  const handleClick: EventListenerOrEventListenerObject = (e) => {
    if (
      ref.current &&
      e.target instanceof Node &&
      !ref.current.contains(e.target)
    ) {
      callback()
    }
  }
  useEffect(() => {
    document.addEventListener('click', handleClick)
    return () => {
      document.removeEventListener('click', handleClick)
    }
  })
}
