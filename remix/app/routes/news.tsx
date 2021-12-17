import { LoaderFunction, useLoaderData } from 'remix'
import { VFC } from 'react'

type Data = {
  pid: string
  sku: string
  image_path: string
  name: string
  sample_movie_path: string
  suggest_actor: string
}[]

const HOST = 'https://sp.mgstage.com'
const IMAGE_HOST = 'https://image.mgstage.com'

export const loader: LoaderFunction = async () => {
  const res = await fetch(HOST + '/api/n/search/index.php?sort=new', {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Linux; Android 6.0.1; Moto G (4)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.93 Mobile Safari/537.36'
    }
  })
  return JSON.parse(await res.text()).search_result
}

const News: VFC = () => {
  const data = useLoaderData<Data>()

  return (
    <>
      {data.map(({ sku, image_path, name, sample_movie_path }) => (
        <div className="w-full flex mb-2" key={sku}>
          <a
            href={HOST + `/product/product_detail/${sku}`}
            className="h-48 w-36 flex-none bg-contain bg-no-repeat text-center overflow-hidden"
            style={{
              backgroundImage: `url("${IMAGE_HOST + image_path}")`
            }}
          />
          <div className="flex flex-col justify-between leading-normal">
            <div className="mb-8">
              <a
                href={HOST + `/product/product_detail/${sku}`}
                className="text-gray-200 block text-sm mb-2"
              >
                {name.slice(0, 70)}
              </a>
              <a
                className="text-gray-200 py-2 px-4 border border-gray-200 rounded"
                href={sample_movie_path}
              >
                Sample
              </a>
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

export default News
