import { LoaderFunction } from 'remix'
import parse from 'node-html-parser'

export type Data = {
  title: string
  link: string
  size: string
  registeredAt: string
  seeder: string
  leech: string
  completed: string
}[]

const HOST = 'https://sukebei.nyaa.si'

export const loader: LoaderFunction = async ({ params }) => {
  const res = await fetch(
    `${HOST}/?q=${params.sku?.replace(/^SP-/, '')}&f=0&c=0_0`
  )
  const html = await res.text()
  const root = parse(html)
  const trs = root.querySelectorAll('tr.default')
  const data = trs
    .map((tr) => {
      return tr
        .querySelectorAll('td')
        .slice(1)
        .map((td) => {
          const a = td.querySelector('a')
          if (a) {
            const href = a.getAttribute('href')
            if (!href?.startsWith('/download')) return a.innerText
            return href
          }
          return td.innerText
        })
    })
    .reduce<Data>(
      (res, [title, link, size, registeredAt, seeder, leech, completed]) => [
        ...res,
        {
          title,
          link: `${HOST}${link}`,
          size,
          registeredAt,
          seeder,
          leech,
          completed
        }
      ],
      []
    )

  return { data }
}
