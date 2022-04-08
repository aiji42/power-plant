import { ActionFunction, redirect } from '@remix-run/cloudflare'

export const action: ActionFunction = async ({ request }) => {
  const data = await request.formData()
  const code = (data.get('code') as string).trim()
  if (!code) return null
  return redirect(`/products/${code}`)
}
