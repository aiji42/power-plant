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
      actress?: { id: number; name: string }[]
    }
  }[]
}

export const productsSearchFromF = async (params: {
  cid?: string
  offset?: string
  floor?: string
  hits?: number
  sort?: string
  lte_date?: string
  keyword?: string | null
}): Promise<Result> => {
  const res: { result: Result } = await fetch(
    `https://api.dmm.com/affiliate/v3/ItemList?${new URLSearchParams({
      api_id: PROVIDER_F_API_ID,
      affiliate_id: PROVIDER_F_AFF_ID,
      site: 'FANZA',
      service: 'digital',
      sort: 'date',
      ...Object.fromEntries(
        Object.entries(params)
          .filter(([, v]) => v)
          .map(([k, v]) => [k, String(v)])
      )
    }).toString()}`
  ).then((res) => res.json())

  return res.result
}
