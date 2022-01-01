import { LoaderFunction, useFetcher, useLoaderData } from 'remix'
import { useCallback, useEffect } from 'react'
import { Data as FetcherData } from './$sku/torrent'
import { supabaseClient } from '~/utils/supabase.server'
import { ProductFromSite, productFromSite } from '~/utils/product.server'
import { StockLoaderData } from '~/routes/product/$sku/stock'

type Data = ProductFromSite & {
  stored: boolean
  mediaUrls?: string[]
  torrentUrl?: string
  isDownloaded: boolean
  isProcessing: boolean
}

export const loader: LoaderFunction = async ({ params: { sku = '' } }) => {
  const product = await productFromSite(sku)

  const { data } = await supabaseClient
    .from('Product')
    .select('mediaUrls, torrentUrl, isProcessing, isDownloaded')
    .match({ code: product.code })
  return {
    ...product,
    ...data?.[0]
  }
}

const Product = () => {
  const {
    title,
    mainImageUrl,
    subImageUrls,
    sample,
    mediaUrls,
    torrentUrl,
    isDownloaded,
    isProcessing,
    ...data
  } = useLoaderData<Data>()
  const torrentsFetcher = useFetcher<{ data: FetcherData }>()
  const stockFetcher = useFetcher<StockLoaderData>()
  const torrentUrlFetcher = useFetcher()

  useEffect(() => {
    stockFetcher.load(`/product/${data.code}/stock`)
  }, [stockFetcher.load, data.code])
  const stock = useCallback(() => {
    stockFetcher.submit(null, {
      method: stockFetcher.data?.isStocked ? 'delete' : 'post',
      action: `/product/${data.code}/stock`
    })
  }, [stockFetcher.submit, stockFetcher.data, data.code])

  const setTorrent = useCallback(
    (url: string) => {
      torrentUrlFetcher.submit(
        { torrentUrl: url },
        { method: 'post', action: `/product/${data.code}/torrent` }
      )
    },
    [torrentUrlFetcher.submit, data.code]
  )

  useEffect(() => {
    torrentsFetcher.load(`/product/${data.code}/torrent`)
  }, [torrentsFetcher.load])

  return (
    <>
      <div className="grid grid-cols-8">
        <h1 className="text-gray-200 mb-4  col-span-7">{title}</h1>
        <button onClick={stock} className="text-yellow-600 text-2xl">
          {stockFetcher.data?.isStocked ? '★' : '☆'}
        </button>
      </div>
      <dl className="text-gray-200 mb-4">
        <div className="bg-gray-800 px-4 py-5 grid grid-cols-3 gap-4">
          <dt className="text-sm font-medium text-gray-200">isProcessing</dt>
          <dd className="text-sm text-yellow-600 mt-0 col-span-2">
            {isProcessing && '●'}
          </dd>
        </div>
        <div className="bg-gray-700 px-4 py-5 grid grid-cols-3 gap-4">
          <dt className="text-sm font-medium text-gray-200">isDownloaded</dt>
          <dd className="text-sm text-green-500 mt-0 col-span-2">
            {isDownloaded && '●'}
          </dd>
        </div>
      </dl>
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

      {mediaUrls?.map((src) => (
        <video src={src} controls key={src} className="mb-4" />
      ))}

      {torrentsFetcher.state === 'loading' && (
        <div className="text-gray-200 text-center mb-4">Loading</div>
      )}
      {torrentsFetcher.data && (
        <dl className="text-gray-200 mb-4">
          {torrentsFetcher.data.data.map(
            ({ title, link, completed, size, registeredAt }, index) => (
              <div
                key={index}
                className={`${
                  index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-700'
                }  px-4 py-5 grid grid-cols-3 gap-4`}
              >
                <dt className="text-sm font-medium text-gray-200">
                  {torrentUrl === link ? (
                    <button
                      onClick={() => setTorrent(link)}
                      className="text-red-500"
                    >
                      Restart
                    </button>
                  ) : stockFetcher.data?.isStocked ? (
                    <button onClick={() => setTorrent(link)}>Set</button>
                  ) : null}
                </dt>
                <dd className="text-sm text-gray-200 mt-0 col-span-2">
                  <p>{title}</p>
                  <p>completed: {completed}</p>
                  <p>size: {size}</p>
                  <p>registered: {registeredAt}</p>
                </dd>
              </div>
            )
          )}
        </dl>
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
