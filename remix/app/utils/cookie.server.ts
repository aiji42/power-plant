import { createCookie } from 'remix'

export const filterConditionStore = createCookie('filter-condition', {
  maxAge: 604_800, // one week
  path: '/'
})
