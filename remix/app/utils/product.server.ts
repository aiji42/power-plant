import parse, { HTMLElement } from 'node-html-parser'
import chunk from 'chunk'
import { Result } from '~/utils/products.server'

const HOST = 'https://sp.mgstage.com'

const mapping: Record<string, string> = {
  出演: 'actor',
  シリーズ: 'series',
  メーカー: 'maker',
  ジャンル: 'genres',
  配信開始日: 'releasedAt',
  品番: 'code',
  収録時間: 'length'
}

export type ProductFromSite = {
  [k: string]: string | string[] | number
} & {
  mainImageUrl: string
  subImageUrls: string[]
  title: string
  sample: string
  code: string
  releasedAt: string
  series?: string
  maker?: string
  actor?: string
  length: number
  genres?: string[]
}

export const productFromM = async (code: string): Promise<ProductFromSite> => {
  const res = await fetch(HOST + `/product/product_detail/${code}/`, {
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
    ) as [string, string | string[]][]
  )
  const title =
    root.querySelector('title')?.innerText.match(/「(.+)」/)?.[1] ?? ''
  const [mainImageUrl, ...subImageUrls] = root
    .querySelectorAll('.sample-image-wrap > img')
    .map((img) => img.getAttribute('src'))
    .filter((src): src is string => /\.jpg$/.test(src ?? ''))
  const sample = root.querySelector('#sample-movie')?.getAttribute('src') ?? ''
  const length = typeof info.length === 'string' ? parseInt(info.length) : 0

  return {
    ...info,
    title,
    mainImageUrl,
    subImageUrls,
    sample,
    length
  } as ProductFromSite
}

export const productFromF = async (
  code: string
): Promise<ProductFromSite | null> => {
  const res: { result: Result } = await fetch(
    `https://api.dmm.com/affiliate/v3/ItemList?${new URLSearchParams({
      api_id: process.env.PROVIDER_F_API_ID ?? '',
      affiliate_id: process.env.PROVIDER_F_AFF_ID ?? '',
      site: 'FANZA',
      service: 'digital',
      floor: 'videoc',
      cid: code
    }).toString()}`
  ).then((res) => res.json())
  const [item] = res.result.items
  if (!item) return null

  return {
    title: item.title,
    mainImageUrl: item.imageURL.large,
    subImageUrls: item.sampleImageURL?.sample_l.image ?? [],
    sample: item.sampleMovieURL?.size_720_480 ?? '',
    code: item.content_id,
    releasedAt: item.date,
    series: item.iteminfo.label[0].name,
    maker: item.iteminfo.maker[0].name,
    actor: '',
    length: 100,
    genres: item.iteminfo.genre.map(({ name }) => name)
  }
}
