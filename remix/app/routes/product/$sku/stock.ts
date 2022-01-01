import { ActionFunction, LoaderFunction } from 'remix'
import { supabaseClient } from '~/utils/supabase.server'
import { productFromSite } from '~/utils/product.server'
import { v4 as uuidv4 } from 'uuid'

export type StockLoaderData = {
  isStocked: boolean
}

export const loader: LoaderFunction = async ({ params }) => {
  const code = params.sku
  const { data } = await supabaseClient
    .from('Product')
    .select('id')
    .match({ code })

  return { isStocked: (data?.length ?? 0) > 0 }
}

export const action: ActionFunction = async ({ request, params }) => {
  const code = params.sku as string
  if (request.method === 'DELETE') {
    await supabaseClient.from('Product').delete().match({ code })
    return { isStocked: false }
  }

  const {
    title,
    mainImageUrl,
    subImageUrls,
    mainActor,
    subActors,
    length,
    genres,
    series,
    releasedAt,
    maker
  } = await productFromSite(code)

  await supabaseClient.from('Product').insert([
    {
      id: uuidv4(),
      code,
      title,
      mainImageUrl,
      subImageUrls,
      mainActor,
      subActors,
      length,
      genres,
      series,
      releasedAt,
      maker
    }
  ])

  return { isStocked: true }
}
