import { json, LoaderFunction } from 'remix'
import { shortSKU, stripSKU } from '~/utils/sku'
import parse from 'node-html-parser'

type Casts = {
  link: string
  name: string
}[]

export type CastsData = {
  error?: string
  data: Casts
}

export const loader: LoaderFunction = async ({ params: { sku = '' } }) => {
  const castFastPromise = searchFast(shortSKU(sku, true) || stripSKU(sku, true))

  const casts = await Promise.race<Casts>([
    searchSlow(shortSKU(sku, true) || stripSKU(sku, true)),
    new Promise<Casts>((s) => setTimeout(() => s([]), 20 * 1000))
  ])

  return json(
    { data: mergeCasts(casts, await castFastPromise) },
    {
      headers: {
        'cache-control': 'public, max-age=3600, stale-while-revalidate=3600'
      }
    }
  )
}

const searchFast = async (s: string): Promise<Casts> => {
  const res = await fetch(`https://shiroutoname.com/?s=${s}`)
  const html = await res.text()
  const root = parse(html)
  return root
    .querySelectorAll('div.actress-name .mlink')
    .map<Casts[number]>((el) => ({
      link: el.getAttribute('href') ?? '',
      name: el.innerText
    }))
}

const searchSlow = async (s: string): Promise<Casts> => {
  const res = await fetch(`https://av-actress-star.com/?s=${s}`)
  const html = await res.text()
  const root = parse(html)
  return root.querySelectorAll('a.actress').map<Casts[number]>((el) => ({
    link: el.getAttribute('href') ?? '',
    name: el.innerText
  }))
}

const mergeCasts = (casts1: Casts, casts2: Casts): Casts => {
  const casts1Names = casts1.map(({ name }) => name)
  return [
    ...casts1,
    ...casts2.filter(({ name }) => !casts1Names.includes(name))
  ]
}
