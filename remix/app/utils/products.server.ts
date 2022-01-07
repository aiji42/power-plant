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

export const productsFromDB = async (
  page: number,
  order: {
    column: 'releasedAt' | 'createdAt' | string | null
    sort: 'asc' | 'desc' | string | null
  },
  filter?: { casts?: string | null; isDownloaded: string | null }
) => {
  let query = supabaseClient
    .from('Product')
    .select(
      'sku:code, name:title, image_path:mainImageUrl, isDownloaded, isProcessing, casts'
    )
    .order(order.column ?? 'createdAt', { ascending: order.sort === 'asc' })
    .range((page - 1) * 20, page * 20 - 1)
  if (filter?.casts) query = query.contains('casts', `{${filter.casts}}`)
  if (filter?.isDownloaded)
    query = query.is('isDownloaded', filter.isDownloaded === '1')

  const { data, error } = await query

  console.log(error)

  return data
}

export const productsFromF = async (
  page: number
): Promise<ProductListItem[]> => {
  const res = await productsSearchFromF({
    offset: String((page - 1) * 100 + 1),
    floor: 'videoc',
    hits: 100
  })

  return res.items
    .filter(({ iteminfo: { maker } }) =>
      /ホイホイ|ION|AREA/.test(maker[0].name)
    )
    .map<ProductListItem>(({ title, content_id, imageURL }) => ({
      name: title,
      sku: content_id,
      image_path: imageURL.large,
      casts: []
    }))
}
