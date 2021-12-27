import { LoaderFunction, json, ActionFunction } from 'remix'
import parse from 'node-html-parser'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

export type Data = {
  title: string
  link: string
  size: string
  registeredAt: string
  seeder: string
  leech: string
  completed: string
}[]

const HOST = 'https://sukebei.nyaa.si'

export const loader: LoaderFunction = async ({ params }) => {
  const code = params.sku?.replace(/^SP-/, '') ?? ''
  const [, short1, short2] = code.match(/\d+([a-z]+)-(\d+)/i) ?? []
  const shortCode = short1 && short2 ? `${short1}-${short2}` : null
  const codes = [code, shortCode].filter((s): s is string => !!s)

  const dataList = await Promise.all(
    codes.map(async (q) => {
      try {
        const res = await fetch(`${HOST}/?q=${q}&f=0&c=0_0`)
        const html = await res.text()
        const root = parse(html)
        const trs = root.querySelectorAll('tr.default')
        return trs
          .map((tr) => {
            return tr
              .querySelectorAll('td')
              .slice(1)
              .map((td) => {
                const a = td.querySelector('a')
                if (a) {
                  const href = a.getAttribute('href')
                  if (!href?.startsWith('/download')) return a.innerText
                  return href
                }
                return td.innerText
              })
          })
          .reduce<Data>(
            (
              res,
              [title, link, size, registeredAt, seeder, leech, completed]
            ) => [
              ...res,
              {
                title,
                link: `${HOST}${link}`,
                size,
                registeredAt,
                seeder,
                leech,
                completed
              }
            ],
            []
          )
      } catch (e) {
        console.error(e)
        return []
      }
    })
  )

  return json(
    { data: dataList.flat() },
    {
      headers: {
        'cache-control': 'public, max-age=3600, stale-while-revalidate=3600'
      }
    }
  )
}

export const action: ActionFunction = async ({ request, params }) => {
  const formData = await request.formData()

  const supabase = createClient(
    process.env.SUPABASE_URL ?? '',
    process.env.SUPABASE_API_KEY ?? '',
    { fetch: (...args) => fetch(...args) }
  )

  const { data } = await supabase
    .from('Product')
    .update({
      torrentUrl: formData.get('torrentUrl'),
      isProcessing: false,
      updatedAt: new Date().toISOString()
    })
    .match({ code: params.sku })
  if (data?.[0].id && process.env.NODE_ENV === 'production')
    await fetch(`${process.env.BATCH_JOB_SLS_ENDPOINT}${data?.[0].id}`)

  return null
}
