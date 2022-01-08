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
  productFromM,
  productFromF,
  productFromDB,
  DBData
} from '~/utils/product.server'
import { CastsData } from '~/routes/products/$sku/casts'
import { getBucketAndKeyFromURL, getMediaMeta } from '~/utils/aws.server'

type Data = ProductFromSite &
  DBData & {
    medias: { url: string; size: string; type: string }[]
  }

export const loader: LoaderFunction = async ({ params: { sku = '' } }) => {
  const db = productFromDB(sku)
  const f = productFromF(sku)
  const m = productFromM(sku)
  const data = sku.startsWith('SP-') ? await m : (await f) ?? (await m)
  if (data.code !== sku && data.code.includes(sku))
    return redirect(`/products/${data.code}`)
  const dbData = await db

  const medias = await Promise.all(
    dbData.mediaUrls.map(async (url) => {
      return { url, ...(await getMediaMeta(...getBucketAndKeyFromURL(url))) }
    })
  )

  return { ...data, ...dbData, medias }
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
    downloadUrl,
    casts,
    medias,
    ...data
  } = useLoaderData<Data>()

  const torrentsFetcher = useFetcher<TorrentsData>()
  const dbFetcher = useFetcher<DBData>()

  const stock = useCallback(() => {
    if (isSaved && !confirm('Is it okay if I delete the stock?')) return
    dbFetcher.submit(null, {
      method: isSaved ? 'delete' : 'post',
      action: `/products/${data.code}/db`
    })
  }, [dbFetcher.submit, isSaved, data.code])

  useEffect(() => {
    torrentsFetcher.load(`/products/${data.code}/torrent`)
  }, [torrentsFetcher.load])
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

  const [truncate, toggleTruncate] = useReducer((s) => !s, true)
  const [castFormOpen, openCastForm] = useReducer(() => true, casts.length < 1)

  return (
    <>
      <div className="grid grid-cols-8">
        <h1
          className={`px-1 text-gray-200 col-span-7 ${
            truncate ? 'truncate' : ''
          }`}
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
            className="text-xs font-semibold inline-block py-1 px-2 rounded-full text-indigo-600 bg-indigo-200 last:mr-0 mr-1 mb-1"
          >
            {cast}
          </Link>
        ))}
        <span
          onClick={openCastForm}
          className="text-xs font-semibold inline-block py-1 px-2 rounded-full text-indigo-200 last:mr-0 mr-1 mb-1"
        >
          edit
        </span>
        {castFormOpen && <CastsForm dbFetcher={dbFetcher} code={data.code} />}
      </div>

      <dl className="text-gray-200 mb-4">
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
              <dt className="text-sm font-medium text-gray-200">{key}</dt>
              <dd className="text-sm text-gray-200 mt-0 col-span-2">
                {['maker', 'series'].includes(key) ? (
                  <Link
                    to={`/products?${key}=${val}`}
                    className="text-indigo-400"
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

      {medias.map(({ url, size, type }) => (
        <div className="w-full mb-4" key={url}>
          <video src={url} controls key={url} className="w-full" />
          <a href={url} className="text-gray-200 px-1 text-indigo-500">
            download {size}({type})
          </a>
        </div>
      ))}

      {torrentsFetcher.state === 'loading' ? (
        <div className="text-gray-200 text-center mb-4">Loading</div>
      ) : (
        torrentsFetcher.data && (
          <dl className="text-gray-200 mb-4">
            {isSaved && (
              <Form
                action={`/products/${data.code}/db`}
                method="patch"
                className="w-full max-w-sm"
              >
                <div className="flex items-center border-b border-indigo-500 py-2">
                  <input type="hidden" name="isProcessing" value="false" />
                  <textarea
                    className="appearance-none bg-transparent border-none w-full text-gray-200 mr-3 py-1 px-2 leading-tight focus:outline-none"
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
            {torrentsFetcher.data.map(
              ({ title, link, completed, size, registeredAt }, index) => (
                <div
                  key={index}
                  className={`${
                    index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-700'
                  }  px-4 py-5 text-sm text-gray-200`}
                  onClick={() => handleInputValue(link)}
                >
                  <p className="truncate">
                    {link === inputValue ? (
                      <span className="text-indigo-500 pr-1">○</span>
                    ) : dbFetcher.data?.downloadUrl === link ? (
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
        )
      )}

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
  code: string
  dbFetcher: ReturnType<typeof useFetcher>
}> = ({ code, dbFetcher }) => {
  const { casts, isSaved } = useLoaderData<Data>()
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
          <label>
            <input type="hidden" name="casts" value="" />
            <input
              type="checkbox"
              name="casts"
              className="form-checkbox h-5 w-5"
              disabled={!isSaved}
              value={name}
              defaultChecked={refSelected.current.includes(name)}
            />
            <span className="ml-2 text-gray-200">{name}</span>
          </label>
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="pl-2 text-indigo-500"
          >
            →
          </a>
        </div>
      ))}
      <button
        className="text-indigo-500 disabled:opacity-50"
        disabled={!isSaved || castFetcher.state === 'loading'}
      >
        {castFetcher.state === 'loading' ? 'Searching...' : 'Save'}
      </button>
      <span className="text-gray-200">{castFetcher.data?.error}</span>
    </Form>
  )
}
