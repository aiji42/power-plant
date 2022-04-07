import { createCookie } from '@remix-run/cloudflare'

export const filterConditionStore = createCookie('filter-condition', {
  maxAge: 604_800, // one week
  path: '/'
})
