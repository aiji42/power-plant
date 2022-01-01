import parse, { HTMLElement } from 'node-html-parser'
import chunk from 'chunk'

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
  [k: string]: string | string[]
} & {
  mainImageUrl: string
  subImageUrls: string[]
  title: string
  sample: string
  code: string
  releasedAt: string
  series?: string
  maker?: string
  mainActor: string
  subActors: string[]
  length: number
  genres?: string[]
}

export const productFromSite = async (
  code: string
): Promise<ProductFromSite> => {
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
  const [mainActor, ...subActors] = !('actor' in info)
    ? ['']
    : Array.isArray(info.actor)
    ? info.actor
    : [info.actor]
  delete info.actor
  const length = info.length ? Number(info.length) : 0

  return {
    ...info,
    title,
    mainImageUrl,
    subImageUrls,
    mainActor,
    subActors,
    sample,
    length
  } as ProductFromSite
}
