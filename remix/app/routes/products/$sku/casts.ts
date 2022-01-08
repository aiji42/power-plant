import { json, LoaderFunction } from 'remix'
import { formatter } from '~/utils/sku'
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
  const castFastPromise = searchFast(formatter(sku)[0])
  const castMiddlePromise = searchMiddle(formatter(sku)[0])

  const castSlowPromise = Promise.race<Casts>([
    searchSlow(formatter(sku)[0]),
    new Promise<Casts>((s) => setTimeout(() => s([]), 20 * 1000))
  ])

  const searchResults = await Promise.all([
    castFastPromise,
    castMiddlePromise,
    castSlowPromise
  ])

  return json(
    {
      data: mergeCasts(
        mergeCasts(searchResults[0], searchResults[1]),
        searchResults[2]
      )
    },
    {
      headers: {
        'cache-control': 'public, max-age=3600, stale-while-revalidate=3600'
      }
    }
  )
}

const searchFast = async (s: string): Promise<Casts> => {
  console.log('search cast: ', `https://shiroutoname.com/?s=${s}`)
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

const searchMiddle = async (s: string): Promise<Casts> => {
  console.log('search cast: ', `https://av-wiki.net/?s=${s}&post_type=product`)
  let res = await fetch(`https://av-wiki.net/?s=${s}&post_type=product`)
  let html = await res.text()
  if (html.includes('Database Error')) {
    res = await fetch(`https://av-wiki.net/?s=${s}&post_type=product`)
    html = await res.text()
  }
  const root = parse(html)
  return root.querySelectorAll('.actress-name a').map<Casts[number]>((el) => ({
    link: el.getAttribute('href') ?? '',
    name: el.innerText
  }))
}

const searchSlow = async (s: string): Promise<Casts> => {
  console.log('search cast: ', `https://av-actress-star.com/?s=${s}`)
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
