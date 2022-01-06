import { LoaderFunction, useFetcher, useLoaderData, redirect } from 'remix'
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
  productFromF
} from '~/utils/product.server'
import { DBData } from '~/routes/products/$sku/db'
import { CastsData } from '~/routes/products/$sku/casts'

export const loader: LoaderFunction = async ({ params: { sku = '' } }) => {
  const f = productFromF(sku)
  const m = productFromM(sku)
  const data = sku.startsWith('SP-') ? await m : (await f) ?? (await m)
  if (data.code !== sku && data.code.includes(sku))
    return redirect(`/products/${data.code}`)
  return data
}

const Product = () => {
  const { title, mainImageUrl, subImageUrls, sample, ...data } =
    useLoaderData<ProductFromSite>()
  const torrentsFetcher = useFetcher<TorrentsData>()
  const dbFetcher = useFetcher<DBData>()

  useEffect(() => {
    dbFetcher.load(`/products/${data.code}/db`)
  }, [dbFetcher.load, data.code])
  const stock = useCallback(() => {
    if (
      dbFetcher.data?.isSaved &&
      (dbFetcher.data?.isProcessing || dbFetcher.data?.mediaUrls.length)
    ) {
      alert('The stock cannot be removed.')
      return
    }
    dbFetcher.submit(null, {
      method: dbFetcher.data?.isSaved ? 'delete' : 'post',
      action: `/products/${data.code}/db`
    })
  }, [
    dbFetcher.submit,
    dbFetcher.data?.isSaved,
    data.code,
    dbFetcher.data?.isProcessing,
    dbFetcher.data?.mediaUrls.length
  ])

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
  const [castFormOpen, openCastForm] = useReducer((s) => true, false)

  return (
    <>
      <div className="grid grid-cols-8">
        <h1
          className={`text-gray-200 col-span-7 ${truncate ? 'truncate' : ''}`}
          onClick={toggleTruncate}
        >
          {title}
        </h1>
        <button onClick={stock} className="text-yellow-600 text-2xl">
          {dbFetcher.data?.isSaved ? '★' : '☆'}
        </button>
      </div>

      <div className="mb-4 px-1">
        {dbFetcher.data?.casts.map((cast) => (
          <a
            href={`/products?casts=${cast}`}
            key={cast}
            className="text-xs font-semibold inline-block py-1 px-2 rounded-full text-indigo-600 bg-indigo-200 last:mr-0 mr-1 mb-1"
          >
            {cast}
          </a>
        ))}
        <span
          onClick={openCastForm}
          className="text-xs font-semibold inline-block py-1 px-2 rounded-full text-indigo-200 last:mr-0 mr-1 mb-1"
        >
          edit
        </span>
        {dbFetcher.data && castFormOpen && (
          <CastsForm
            disabled={!dbFetcher.data.isSaved}
            dbFetcher={dbFetcher}
            selected={dbFetcher.data.casts}
            code={data.code}
          />
        )}
      </div>
      {dbFetcher.data && dbFetcher.data.isSaved && (
        <dl className="text-gray-200 mb-4">
          <div className="bg-gray-800 px-4 py-5 grid grid-cols-3 gap-4">
            <dt className="text-sm font-medium text-gray-200">processing</dt>
            <dd
              className={`${
                dbFetcher.data.isProcessing
                  ? 'text-yellow-600'
                  : 'text-gray-400'
              } text-sm mt-0 col-span-2`}
            >
              ●
            </dd>
          </div>
          <div className="bg-gray-700 px-4 py-5 grid grid-cols-3 gap-4">
            <dt className="text-sm font-medium text-gray-200">downloaded</dt>
            <dd
              className={`${
                dbFetcher.data.isDownloaded ? 'text-green-500' : 'text-gray-400'
              } text-sm mt-0 col-span-2`}
            >
              ●
            </dd>
          </div>
        </dl>
      )}

      <dl className="text-gray-200 mb-4">
        {Object.entries(data).map(([key, val], index) => (
          <div
            key={key}
            className={`${
              index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-700'
            }  px-4 py-5 grid grid-cols-3 gap-4`}
          >
            <dt className="text-sm font-medium text-gray-200">{key}</dt>
            <dd className="text-sm text-gray-200 mt-0 col-span-2">
              {Array.isArray(val) ? val.map((v) => <p key={v}>{v}</p>) : val}
            </dd>
          </div>
        ))}
      </dl>

      {dbFetcher.data?.mediaUrls?.map((src) => (
        <div className="w-full mb-4">
          <video src={src} controls key={src} />
          <a href={src} className="text-gray-200">
            download
          </a>
        </div>
      ))}

      {torrentsFetcher.state === 'loading' ? (
        <div className="text-gray-200 text-center mb-4">Loading</div>
      ) : (
        torrentsFetcher.data && (
          <dl className="text-gray-200 mb-4">
            {dbFetcher.data?.isSaved && (
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
                    placeholder={dbFetcher.data.downloadUrl ?? ''}
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

      {sample &&
        (sample.endsWith('.mp4') ? (
          <video src={sample} controls />
        ) : (
          <iframe src={sample} loading="lazy" className="w-full" height={200} />
        ))}

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
  selected?: string[]
  disabled?: boolean
}> = ({ code, dbFetcher, disabled, selected = [] }) => {
  const Form = dbFetcher.Form
  const castFetcher = useFetcher<CastsData>()
  useEffect(() => {
    castFetcher.load(`/products/${code}/casts`)
  }, [castFetcher.load])
  const refSelected = useRef(selected)

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
              disabled={disabled}
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
        disabled={disabled || castFetcher.state === 'loading'}
      >
        {castFetcher.state === 'loading' ? 'Searching...' : 'Save'}
      </button>
      <span className="text-gray-200">{castFetcher.data?.error}</span>
    </Form>
  )
}
