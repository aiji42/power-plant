import {
  FormControl,
  FormLabel,
  Input,
  Select,
  SimpleGrid
} from '@chakra-ui/react'
import { useLoaderData, Form as RemixForm } from '@remix-run/react'
import { redirect } from '@remix-run/cloudflare'
import { forwardRef } from 'react'

export const handler = (data: FormData) => {
  if (!data.has('provider')) return
  const provider = data.get('provider') as string
  const download = data.get('download') as string
  const sort = data.get('sort') as 'newer' | 'older'
  const keyword = data.get('keyword') as string

  throw redirect(
    `/products?${new URLSearchParams({
      provider,
      download,
      sort,
      keyword
    }).toString()}`
  )
}

export type Data = {
  filterFormData: {
    provider: string
    download: string
    sort: string
    keyword: string
  }
}

const Form = forwardRef<HTMLFormElement>(({}, ref) => {
  const {
    filterFormData: { provider, download, sort, keyword }
  } = useLoaderData<Data>()

  return (
    <RemixForm method="post" ref={ref}>
      <SimpleGrid columns={2} spacing={4}>
        <FormControl>
          <FormLabel>Provider</FormLabel>
          <Select name="provider" defaultValue={provider}>
            {['stock', 'm', 'fa', 'fc'].map((opt) => (
              <option value={opt} key={opt}>
                {opt}
              </option>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel>Downloaded</FormLabel>
          <Select name="download" defaultValue={download}>
            {['any', 'done', 'yet'].map((opt) => (
              <option value={opt} key={opt}>
                {opt}
              </option>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel>Order</FormLabel>
          <Select name="sort" defaultValue={sort}>
            {['newer', 'older'].map((opt) => (
              <option value={opt} key={opt}>
                {opt}
              </option>
            ))}
          </Select>
        </FormControl>
      </SimpleGrid>

      <FormControl mt={2}>
        <FormLabel>Keyword</FormLabel>
        <Input
          name="keyword"
          placeholder="search keyword"
          defaultValue={keyword}
        />
      </FormControl>
    </RemixForm>
  )
})

export default Form
