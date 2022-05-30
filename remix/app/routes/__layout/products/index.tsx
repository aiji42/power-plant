import { ActionFunction, LoaderFunction } from '@remix-run/cloudflare'
import { Link, useLoaderData } from '@remix-run/react'
import { VFC } from 'react'
import {
  ProductListItem,
  productsFromDB,
  productsFromF,
  productsFromM
} from '~/utils/products.server'
import {
  handler,
  Data as ProductFilterFormData
} from '~/forms/ProductFilterForm'
import { ProductCard } from '~/components/ProductCard'
import { FilterModal } from '~/components/FilterModal'
import { Pageable } from '~/components/Pageable'
import {
  LoaderData as StealthData,
  loaderHandler as stealthLoader
} from '~/forms/StealthModeToggle'

type Data = {
  items: ProductListItem[]
  page: number
} & ProductFilterFormData &
  StealthData

export const loader: LoaderFunction = async ({ request }) => {
  const params = new URL(request.url).searchParams
  const page = Number(params.get('page') ?? 1)
  const provider = params.get('provider') ?? 'stock'
  const download = params.get('download') ?? 'any'
  const keyword = params.get('keyword')
  const sort = params.get('sort') ?? 'newer'
  const items = await (provider === 'm'
    ? productsFromM(page, undefined, keyword)
    : provider === 'fa'
    ? productsFromF(page, undefined, 'videoa', keyword)
    : provider === 'fc'
    ? productsFromF(page, undefined, 'videoc', keyword)
    : productsFromDB(
        page,
        { column: 'createdAt', sort: sort === 'newer' ? 'desc' : 'asc' },
        {
          isDownloaded:
            download === 'any' ? null : download === 'done' ? '1' : '0',
          keyword
        }
      ))
  return {
    items,
    filterFormData: {
      provider,
      sort,
      download,
      keyword
    },
    ...(await stealthLoader({ request }))
  } as Data
}

export const action: ActionFunction = async ({ request }) => {
  const data = await request.formData()
  handler(data)

  return null
}

const Products: VFC = () => {
  const { items, stealthMode } = useLoaderData<Data>()

  return (
    <Pageable>
      <FilterModal />
      {items.map((item) => (
        <Link to={`/products/${item.sku}`} key={item.sku}>
          <ProductCard {...item} stealthMode={stealthMode} />
        </Link>
      ))}
    </Pageable>
  )
}

export default Products
