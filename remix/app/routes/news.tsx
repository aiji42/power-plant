import { LoaderFunction } from 'remix'
import { VFC } from 'react'
import { parse } from 'node-html-parser'

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

  console.log(
    lists.map((node) => [
      node.querySelector('a')?.getAttribute('href'),
      node.querySelector('.title')?.innerText,
      node.querySelector('img')?.getAttribute('src'),
      node.querySelector('.button_sample')?.getAttribute('href'),
      node.querySelector('.name a')?.innerText
    ])
  )

  return null
}

const News: VFC = () => {
  return null
}

export default News
