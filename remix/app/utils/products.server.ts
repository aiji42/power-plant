export type ProductListItem = {
  pid: string
  sku: string
  image_path: string
  name: string
  sample_movie_path: string
  suggest_actor: string
}

const HOST = 'https://sp.mgstage.com'
const IMAGE_HOST = 'https://image.mgstage.com'

export const productsFromSite = async (
  page: number
): Promise<ProductListItem[]> => {
  const res = await fetch(
    HOST + `/api/n/search/index.php?sort=new&page=${page}`,
    {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Linux; Android 6.0.1; Moto G (4)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.93 Mobile Safari/537.36',
        'Content-Type': 'application/json'
      }
    }
  )
  const result: { search_result: ProductListItem[] } = await res.json()
  const items = result.search_result.map((item) => ({
    ...item,
    image_path: `${IMAGE_HOST}${item.image_path}`
  }))

  return items
}
