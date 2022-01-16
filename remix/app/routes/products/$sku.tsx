import {
  LoaderFunction,
  useFetcher,
  useLoaderData,
  redirect,
  Link
} from 'remix'
import {
  ChangeEvent,
  useCallback,
  useEffect,
  useReducer,
  useRef,
  VFC
} from 'react'
import { TorrentsData } from './$sku/torrent'
import {
  ProductFromSite,
  productFromDB,
  DBData,
  searchProductFromSite
} from '~/utils/product.server'
import { CastsData } from '~/routes/products/$sku/casts'
import { cacheable } from '~/utils/kv.server'
import { JobListData } from '~/routes/products/$sku/job'
import { MediaData } from '~/routes/products/$sku/media'

type Data = ProductFromSite & DBData

export const loader: LoaderFunction = async ({ params: { sku = '' } }) => {
  const db = productFromDB(sku)
  const data = await cacheable(
    searchProductFromSite(sku),
    `searchProductFromSite-${sku}`,
    (res) => ({
      expirationTtl: res.code.length > 0 ? 3600 * 24 * 3 : 3600 * 24
    })
  )
  if (data.code !== sku) return redirect(`/products/${data.code}`)
  const dbData = await db

  return { ...data, ...dbData }
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
    <>
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
        {casts.map((cast) => (
          <Link
            to={`/products?casts=${cast}`}
            key={cast}
            className="text-xs font-semibold inline-block py-1 px-2 rounded-full text-indigo-600 bg-indigo-200  hover:text-indigo-500 hover:bg-indigo-100 last:mr-0 mr-1 mb-1"
          >
            {cast}
          </Link>
        ))}
        {!castFormOpen ? (
          <span
            onClick={openCastForm}
            className="text-xs font-semibold inline-block py-1 px-2 rounded-full text-indigo-200 hover:text-indigo-100 last:mr-0 mr-1 mb-1"
          >
            edit
          </span>
        ) : (
          <CastsForm dbFetcher={dbFetcher} />
        )}
      </div>

      <dl className="mb-4">
        {Object.entries(data)
          .filter(([key]) =>
            [
              'actor',
              'maker',
              'series',
              'releasedAt',
              'code',
              'genre'
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
                    to={`/products?${key}=${val}`}
                    className="text-indigo-400 hover:text-indigo-300 w-full block"
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
          className="px-1 py-2 text-indigo-500 hover:text-indigo-400 hover:bg-gray-800 mb-4"
        >
          Media Download Form
        </p>
      ) : (
        <MediaDownloadForm dbFetcher={dbFetcher} />
      )}

      <hr className="mb-4" />

      {sample && <video src={sample} controls className="w-full" />}

      {mainImageUrl && (
        <img src={mainImageUrl} loading="lazy" className="w-full mb-2" />
      )}
      {subImageUrls.map((src) => (
        <img src={src} loading="lazy" className="w-full mb-2" key={src} />
      ))}
    </>
  )
}

export default Product

const CastsForm: VFC<{
  dbFetcher: ReturnType<typeof useFetcher>
}> = ({ dbFetcher }) => {
  const { casts, isSaved, code } = useLoaderData<Data>()
  const Form = dbFetcher.Form
  const castFetcher = useFetcher<CastsData>()
  useEffect(() => {
    castFetcher.load(`/products/${code}/casts`)
  }, [castFetcher.load])
  const refSelected = useRef(casts)

  return (
    <Form
      className="flex flex-col"
      action={`/products/${code}/db`}
      method="patch"
    >
      {castFetcher.data?.data?.map(({ name, link }) => (
        <div key={name} className="inline-flex items-center mt-3">
          <label className="py-1 mb-1">
            <input type="hidden" name="casts" value="" />
            <input
              type="checkbox"
              name="casts"
              className="form-checkbox h-5 w-5"
              disabled={!isSaved}
              value={name}
              defaultChecked={refSelected.current.includes(name)}
            />
            <span className="ml-2">{name}</span>
          </label>
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="pl-4 text-indigo-500"
          >
            &rarr;
          </a>
        </div>
      ))}
      <button
        className="text-indigo-500 disabled:opacity-50 hover:text-indigo-400 hover:bg-gray-800 mt-3"
        disabled={!isSaved || castFetcher.state === 'loading'}
      >
        {castFetcher.state === 'loading' ? 'Searching...' : 'Save'}
      </button>
      <span>{castFetcher.data?.error}</span>
    </Form>
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
          {torrentsFetcher.data?.map(
            ({ title, link, completed, size, registeredAt }, index) => (
              <div
                key={index}
                className={`${
                  index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-700'
                }  px-4 py-5 text-sm`}
                onClick={() => handleInputValue(link)}
              >
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
        className="p-1 text-sm text-indigo-500 hover:text-indigo-400 hover:bg-gray-800 block w-full"
      >
        {meta.size}/{meta.resolution}/{meta.bitRate}/{meta.frameRate}/
        {meta.duration}/{meta.codec}
      </a>
      <button
        className="p-1 text-sm text-indigo-500 hover:text-indigo-400 hover:bg-gray-800"
        onClick={compression}
      >
        compress
      </button>
      <button
        className="p-1 text-sm text-red-500 hover:text-red-400 hover:bg-gray-800"
        onClick={remove}
      >
        remove
      </button>
    </div>
  )
}
