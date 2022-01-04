import { supabaseClient } from '~/utils/supabase.server'
import { productsSearchFromF } from '~/utils/f.server'

export type ProductListItem = {
  sku: string
  image_path: string
  name: string
  casts?: string[]
  isDownloaded?: boolean
  isProcessing?: string
}

const HOST = 'https://sp.mgstage.com'
const IMAGE_HOST = 'https://image.mgstage.com'

export const productsFromM = async (
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
  return result.search_result.map((item) => ({
    ...item,
    image_path: `${IMAGE_HOST}${item.image_path}`,
    casts: []
  }))
}

export const productsFromDB = async (page: number) => {
  const { data } = await supabaseClient
    .from('Product')
    .select(
      'sku:code, name:title, image_path:mainImageUrl, isDownloaded, isProcessing, casts'
    )
    .order('createdAt', { ascending: false })
    .range((page - 1) * 20, page * 20 - 1)

  return data
}

export const productsFromF = async (
  page: number
): Promise<ProductListItem[]> => {
  const res = await productsSearchFromF({ offset: String((page - 1) * 20 + 1) })

  return res.items.map<ProductListItem>(({ title, content_id, imageURL }) => ({
    name: title,
    sku: content_id,
    image_path: imageURL.list,
    casts: []
  }))
}
