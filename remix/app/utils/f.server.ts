type Result = {
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

export const productsSearchFromF = async (params: {
  cid?: string
  offset?: string
  floor?: 'videoc' | 'video'
}): Promise<Result> => {
  const res: { result: Result } = await fetch(
    `https://api.dmm.com/affiliate/v3/ItemList?${new URLSearchParams({
      api_id: process.env.PROVIDER_F_API_ID ?? '',
      affiliate_id: process.env.PROVIDER_F_AFF_ID ?? '',
      site: 'FANZA',
      service: 'digital',
      sort: 'date',
      ...params
    }).toString()}`
  ).then((res) => res.json())

  return res.result
}

export const sampleMovieUrl = (code: string): string | null => {
  const initial = code.slice(0, 1)
  const [, prefix] = code.match(/^([a-z]+)/) ?? []
  if (!prefix) return null
  return `https://cc3001.dmm.co.jp/litevideo/freepv/${initial}/${prefix}/${code}/${code}_dmb_w.mp4`
}
