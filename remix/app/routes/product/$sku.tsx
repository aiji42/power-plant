import { LoaderFunction, useFetcher, useLoaderData } from 'remix'
import parse, { HTMLElement } from 'node-html-parser'
import chunk from 'chunk'
import { useEffect } from 'react'
import { Data as FetcherData } from './$sku/torrent'

const HOST = 'https://sp.mgstage.com'

type Data = {
  [k: string]: string | string[]
} & {
  images: string[]
  title: string
  sample: string | undefined
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
        if (node.rawTagName === 'dt') return [...res, node.innerText]
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

  return { ...info, title, images, sample }
}

const Product = () => {
  const { title, images, sample, ...data } = useLoaderData<Data>()
  const fetcher = useFetcher<{ data: FetcherData }>()

  useEffect(() => {
    fetcher.load(`/product/${data['品番']}/torrent`)
  }, [fetcher.load])

  return (
    <>
      <h1 className="text-gray-200 mb-4">{title}</h1>
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
      {fetcher.state === 'loading' && (
        <div className="text-gray-200 text-center mb-4">Loading</div>
      )}
      {fetcher.data && (
        <dl className="text-gray-200 mb-4">
          {fetcher.data.data.map(({ title, link, completed }, index) => (
            <div
              key={index}
              className={`${
                index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-700'
              }  px-4 py-5 grid grid-cols-3 gap-4`}
            >
              <dt className="text-sm font-medium text-gray-200">
                <a href={link}>Download</a>
              </dt>
              <dd className="text-sm text-gray-200 mt-0 col-span-2">
                <p>{title}</p>
                <p>completed: {completed}</p>
              </dd>
            </div>
          ))}
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
