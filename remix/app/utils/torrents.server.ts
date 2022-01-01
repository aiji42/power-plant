import parse from 'node-html-parser'

const HOST = 'https://sukebei.nyaa.si'

export type SearchedResult = {
  title: string
  link: string
  size: string
  registeredAt: string
  seeder: string
  leech: string
  completed: string
}

export const searchTorrents = async (
  keyword: string
): Promise<SearchedResult[]> => {
  const res = await fetch(`${HOST}/?q=${keyword}&f=0&c=0_0`)
  const html = await res.text()
  const root = parse(html)
  const trs = root.querySelectorAll('tr.default')
  return trs
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
    .reduce<SearchedResult[]>(
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
}
