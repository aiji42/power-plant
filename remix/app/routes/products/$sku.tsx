import { LoaderFunction, useFetcher, useLoaderData } from 'remix'
import { ChangeEvent, useCallback, useEffect, useReducer } from 'react'
import { TorrentsData } from './$sku/torrent'
import { ProductFromSite, productFromSite } from '~/utils/product.server'
import { DBData } from '~/routes/products/$sku/db'

export const loader: LoaderFunction = async ({ params: { sku = '' } }) => {
  return await productFromSite(sku)
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

  return (
    <>
      <div className="grid grid-cols-8">
        <h1 className="text-gray-200 mb-4  col-span-7">{title}</h1>
        <button onClick={stock} className="text-yellow-600 text-2xl">
          {dbFetcher.data?.isSaved ? '★' : '☆'}
        </button>
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
                  <p>
                    {link === inputValue ? (
                      <span className="text-indigo-500 pr-1">○</span>
                    ) : dbFetcher.data?.downloadUrl === link ? (
                      <span className="text-indigo-500 pr-1">●</span>
                    ) : null}
                    {title.slice(0, 50)}
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

      {sample && <video src={sample} controls />}

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
