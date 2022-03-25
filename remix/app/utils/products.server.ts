import { supabaseClient } from '~/utils/supabase.server'
import { productsSearchFromF } from '~/utils/f.server'

export type ProductListItem = {
  sku: string
  image_path: string
  name: string
  casts?: string[]
  isDownloaded?: boolean
  isProcessing?: string
  maker?: string
  series?: string
}

const HOST = 'https://sp.mgstage.com'
const IMAGE_HOST = 'https://image.mgstage.com'

export const productsFromM = async (
  page: number,
  sort?: string,
  keyword?: string | null
): Promise<ProductListItem[]> => {
  const res = await fetch(
    HOST +
      `/api/n/search/index.php?${new URLSearchParams({
        page: String(page),
        sort: sort ?? 'new',
        ...(keyword ? { search_word: keyword } : {})
      }).toString()}`,
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
  filter?: {
    keyword?: string | null
    isDownloaded: string | null
  }
) => {
  let query = supabaseClient
    .from('Product')
    .select(
      'sku:code, name:title, image_path:mainImageUrl, isDownloaded, isProcessing, casts, maker, series'
    )
    .order(order.column ?? 'createdAt', { ascending: order.sort === 'asc' })
    .range((page - 1) * 100, page * 100 - 1)
  if (filter?.keyword)
    query = query.or(
      `maker.eq.${filter.keyword},series.eq.${filter.keyword},casts.cs.{${filter.keyword}}`
    )
  if (filter?.isDownloaded)
    query = query.is('isDownloaded', filter.isDownloaded === '1')

  const { data, error } = await query

  if (error) console.log(error)

  return data
}

export const productsFromF = async (
  page: number,
  sort = 'date',
  floor = 'videoc',
  keyword?: string | null
): Promise<ProductListItem[]> => {
  const res = await productsSearchFromF({
    offset: String((page - 1) * 100 + 1),
    floor,
    hits: 100,
    sort,
    lte_date: new Date().toISOString().slice(0, 19),
    keyword
  })
  return (
    res.items
      .filter(({ iteminfo: { genre } }) =>
        genre?.every(
          ({ id }) =>
            ![3036, 6793, 4060, 35, 6996, 1014, 1032, 4002].includes(id)
        )
      )
      .map<ProductListItem>(({ title, content_id, imageURL, iteminfo }) => ({
        name: title,
        sku: content_id,
        image_path: imageURL.large,
        casts: iteminfo.actress?.map(({ name }) => name),
        maker: iteminfo.maker?.[0].name,
        series: iteminfo.label?.[0].name
      })) ?? []
  )
}
