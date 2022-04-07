import { createCookieSessionStorage } from '@remix-run/cloudflare'

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage({
    cookie: {
      name: 'sb:token',
      httpOnly: true,
      maxAge: 60 ** 2 * 24 * 14,
      path: '/',
      secrets: ['s3cret1'],
      secure: true
    }
  })

export { getSession, commitSession, destroySession }
