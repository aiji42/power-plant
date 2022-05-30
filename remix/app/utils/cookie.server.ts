import { createCookie } from '@remix-run/cloudflare'

export const stealthModeCookie = createCookie('stealth', {
  path: '/',
  sameSite: 'lax',
  httpOnly: true,
  secure: true,
  maxAge: 60 * 60 * 24 * 365
})
