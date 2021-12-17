import { LoaderFunction, useLoaderData } from 'remix'
import { VFC } from 'react'
import { parse } from 'node-html-parser'

type Data = {
  url: string
  title: string
  image: string
  sample: string
  actor: string
}[]

export const loader: LoaderFunction = async () => {
  const res = await fetch(
    'https://www.mgstage.com/search/cSearch.php?sort=new',
    {
      headers: {
        Cookie: 'adc=1'
      }
    }
  )
  const text = await res.text()
  const root = parse(text)

  const lists = root.querySelectorAll('.rank_list li')

  return lists.map<Data[number]>((node) => ({
    url: node.querySelector('a')?.getAttribute('href') ?? '',
    title: node.querySelector('.title')?.innerText ?? '',
    image: node.querySelector('img')?.getAttribute('src') ?? '',
    sample: node.querySelector('.button_sample')?.getAttribute('href') ?? '',
    actor: node.querySelector('.name a')?.innerText ?? ''
  }))
}

const News: VFC = () => {
  const data = useLoaderData<Data>()

  return (
    <>
      {data.map(({ url, title, image }) => (
        <a href={url} key={url}>
          <p>{title}</p>
          <img
            loading="lazy"
            src={image.replace('pf_t1', 'pf_e')}
            width="50%"
          />
        </a>
      ))}
    </>
  )
}

export default News
