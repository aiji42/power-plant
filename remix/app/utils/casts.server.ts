import { parse } from 'node-html-parser'

type Cast = {
  link: string
  name: string
}

type CastHasCount = Cast & { count: number }

export type Casts = Cast[]

export type CastHasCounts = CastHasCount[]

export const searchFast = async (s: string): Promise<Casts> => {
  console.log('search cast: ', `https://shiroutoname.com/?s=${s}`)
  const res = await fetch(`https://shiroutoname.com/?s=${s}`)
  const html = await res.text()
  const root = parse(html)
  return root.querySelectorAll('div.actress-name .mlink').map<Cast>((el) => ({
    link: el.getAttribute('href') ?? '',
    name: el.innerText
  }))
}

export const searchMiddle = async (s: string): Promise<Casts> => {
  console.log('search cast: ', `https://av-wiki.net/?s=${s}&post_type=product`)
  let res = await fetch(`https://av-wiki.net/?s=${s}&post_type=product`)
  let html = await res.text()
  if (html.includes('Database Error')) {
    res = await fetch(`https://av-wiki.net/?s=${s}&post_type=product`)
    html = await res.text()
  }
  const root = parse(html)
  return root
    .querySelectorAll('.actress-name a')
    .map<Cast>((el) => ({
      link: el.getAttribute('href') ?? '',
      name: el.innerText
    }))
    .filter(({ name }) => name !== '(≥o≤)')
}

export const searchSlow = async (s: string): Promise<Casts> => {
  console.log('search cast: ', `https://av-actress-star.com/?s=${s}`)
  const res = await fetch(`https://av-actress-star.com/?s=${s}`)
  const html = await res.text()
  const root = parse(html)
  return root.querySelectorAll('a.actress').map<Cast>((el) => ({
    link: el.getAttribute('href') ?? '',
    name: el.innerText
  }))
}

export const mergeCasts = (casts1: Casts, casts2: Casts): Casts => {
  const casts1Names = casts1.map(({ name }) => name)
  return [
    ...casts1,
    ...casts2.filter(({ name }) => !casts1Names.includes(name))
  ]
}
