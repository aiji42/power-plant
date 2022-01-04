import { supabaseClient } from '~/utils/supabase.server'

export type ProductListItem = {
  sku: string
  image_path: string
  name: string
  casts: string[]
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

export type Result = {
  status: number
  result_count: number
  total_count: number
  first_position: number
  items: {
    service_code: string
    service_name: string
    floor_code: string
    floor_name: string
    category_name: string
    content_id: string
    product_id: string
    title: string
    volume: string
    URL: string
    URLsp: string
    imageURL: {
      list: string
      small: string
      large: string
    }
    sampleImageURL?: {
      sample_s: { image: string[] }
      sample_l: { image: string[] }
    }
    sampleMovieURL?: {
      size_476_306: string
      size_560_360: string
      size_644_414: string
      size_720_480: string
      pc_flag: number
      sp_flag: number
    }
    date: string
    iteminfo: {
      genre: { id: number; name: string }[]
      maker: { id: number; name: string }[]
      label: { id: number; name: string }[]
    }
  }[]
}

export const productsFromF = async (
  page: number
): Promise<ProductListItem[]> => {
  const res: { result: Result } = await fetch(
    `https://api.dmm.com/affiliate/v3/ItemList?${new URLSearchParams({
      api_id: process.env.PROVIDER_F_API_ID ?? '',
      affiliate_id: process.env.PROVIDER_F_AFF_ID ?? '',
      site: 'FANZA',
      service: 'digital',
      floor: 'videoc',
      sort: 'date',
      offset: String((page - 1) * 20 + 1)
    }).toString()}`
  ).then((res) => res.json())

  return res.result.items.map<ProductListItem>(
    ({ title, content_id, imageURL }) => ({
      name: title,
      sku: content_id,
      image_path: imageURL.list,
      casts: []
    })
  )
}
