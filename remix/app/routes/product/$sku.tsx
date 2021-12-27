import {
  ActionFunction,
  LoaderFunction,
  useFetcher,
  useLoaderData
} from 'remix'
import parse, { HTMLElement } from 'node-html-parser'
import chunk from 'chunk'
import { useCallback, useEffect } from 'react'
import { Data as FetcherData } from './$sku/torrent'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

const HOST = 'https://sp.mgstage.com'

type Data = {
  [k: string]: string | string[]
} & {
  images: string[]
  title: string
  sample?: string | undefined
  code: string
  releasedAt: string
  series?: string
  maker?: string
  actor?: string
  length: string
  genres?: string[]
  stored: boolean
  mediaUrls?: string[]
  torrentUrl?: string
  isDownloaded: boolean
  isProcessing: boolean
}

const mapping: Record<string, string> = {
  出演: 'actor',
  シリーズ: 'series',
  メーカー: 'maker',
  ジャンル: 'genres',
  配信開始日: 'releasedAt',
  品番: 'code',
  収録時間: 'length'
}

export const loader: LoaderFunction = async ({ params: { sku = '' } }) => {
  const res = await fetch(HOST + `/product/product_detail/${sku}/`, {
    headers: {
      Cookie: 'adc=1',
      'User-Agent':
        'Mozilla/5.0 (Linux; Android 6.0.1; Moto G (4)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.93 Mobile Safari/537.36'
    }
  })
  const html = await res.text()
  const root = parse(html)
  const infoList = root.querySelector('.info dl')?.childNodes ?? []
  const info = Object.fromEntries(
    chunk(
      infoList.reduce<(string | string[])[]>((res, node) => {
        if (
          !(node instanceof HTMLElement) ||
          !['dd', 'dt'].includes(node.rawTagName)
        )
          return res
        if (node.rawTagName === 'dt')
          return [...res, mapping[node.innerText] ?? node.innerText]
        if (node.childNodes.length === 1)
          return [...res, node.childNodes[0].innerText]
        return [
          ...res,
          node.childNodes
            .filter((n) => n instanceof HTMLElement)
            .map((n) => n.innerText)
        ]
      }, [])
    )
  )
  const title = root.querySelector('title')?.innerText.match(/「(.+)」/)?.[1]
  const images = root
    .querySelectorAll('.sample-image-wrap > img')
    .map((img) => img.getAttribute('src'))
    .filter((src) => /\.jpg$/.test(src ?? ''))
  const sample = root.querySelector('#sample-movie')?.getAttribute('src')

  const supabase = createClient(
    process.env.SUPABASE_URL ?? '',
    process.env.SUPABASE_API_KEY ?? '',
    { fetch: (...args) => fetch(...args) }
  )
  const { data } = await supabase
    .from('Product')
    .select('mediaUrls, torrentUrl, isProcessing, isDownloaded')
    .match({ code: info.code })
  return {
    ...info,
    title,
    images,
    sample,
    stored: (data?.length ?? 0) > 0,
    ...data?.[0]
  }
}

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData()
  const supabase = createClient(
    process.env.SUPABASE_URL ?? '',
    process.env.SUPABASE_API_KEY ?? '',
    { fetch: (...args) => fetch(...args) }
  )
  const record = Array.from(formData).reduce<
    Record<string, null | string | string[]>
  >(
    (res, [name, value]) =>
      typeof value === 'string'
        ? {
            ...res,
            [name]:
              value === ''
                ? null
                : /^\[.+]$/.test(value)
                ? JSON.parse(value)
                : /^\d+$/.test(value)
                ? Number(value)
                : value
          }
        : res,
    {}
  )
  const { data } = await supabase
    .from('Product')
    .select('id')
    .match({ code: record.code })
  if (data?.length)
    await supabase.from('Product').delete().match({ code: record.code })
  else await supabase.from('Product').insert([{ id: uuidv4(), ...record }])
  return null
}

const Product = () => {
  const {
    title,
    images,
    sample,
    stored,
    mediaUrls,
    torrentUrl,
    isDownloaded,
    isProcessing,
    ...data
  } = useLoaderData<Data>()
  const torrentsFetcher = useFetcher<{ data: FetcherData }>()
  const stockFetcher = useFetcher()
  const torrentUrlFetcher = useFetcher()

  const stock = useCallback(() => {
    stockFetcher.submit(
      {
        title,
        code: data.code,
        series: data.series ?? '',
        releasedAt: data.releasedAt ?? '',
        genres: JSON.stringify(data.genres ?? []),
        maker: data.maker ?? '',
        mainActor: data.actor ?? '',
        mainImageUrl: images.slice(0, 1)[0] ?? '',
        subImageUrls: JSON.stringify(images.slice(1) ?? []),
        length: data.length.match(/\d+/)?.[0] ?? ''
      },
      { method: 'post' }
    )
  }, [stockFetcher.submit])

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
          {stored ? '★' : '☆'}
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
                  ) : stored ? (
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

      {images.map((src) => (
        <img src={src} loading="lazy" className="w-full mb-2" key={src} />
      ))}
    </>
  )
}

export default Product
