import { productsSearchFromF } from '~/utils/f.server'
import { db, sb } from '~/utils/prisma.server'

export type ProductListItem = {
  sku: string
  image_path: string
  name: string
  casts?: string[]
  isDownloaded?: boolean
  isProcessing?: boolean
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
    sort: 'asc' | 'desc' | null
  },
  filter?: {
    keyword?: string | null
    isDownloaded: string | null
  }
) => {
  try {
    const data = await sb(
      db().product.findMany({
        select: {
          code: true,
          title: true,
          mainImageUrl: true,
          isDownloaded: true,
          isProcessing: true,
          casts: true,
          maker: true,
          series: true
        },
        orderBy: { createdAt: order.sort ?? 'desc' },
        take: 100,
        skip: (page - 1) * 100,
        where: {
          ...(filter?.keyword
            ? {
                OR: [
                  { maker: filter.keyword },
                  { series: filter.keyword },
                  { casts: { has: filter.keyword } }
                ]
              }
            : {}),
          ...(filter?.isDownloaded
            ? { isDownloaded: filter.isDownloaded === '1' }
            : {})
        }
      })
    )
    return data.map(
      ({ code: sku, title: name, mainImageUrl: image_path, ...rest }) => ({
        sku,
        name,
        image_path,
        ...rest
      })
    )
  } catch (e) {
    console.log(e)
    return []
  }
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
