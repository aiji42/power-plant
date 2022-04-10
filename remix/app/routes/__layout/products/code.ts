import { ActionFunction } from '@remix-run/cloudflare'
import { handler } from '~/forms/SearchCode'

export const action: ActionFunction = async ({ request }) => {
  const data = await request.formData()
  handler(data)

  return null
}
