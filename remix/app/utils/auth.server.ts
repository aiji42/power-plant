import { createCookieSessionStorage } from '@remix-run/cloudflare'
import { Authenticator, AuthorizationError } from 'remix-auth'
import { SupabaseStrategy } from 'remix-auth-supabase'
import { supabaseClient } from '~/utils/supabase.server'
import type { Session } from '@supabase/supabase-js'

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: 'sb',
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    maxAge: 3600 * 24 * 7,
    secrets: ['s3cr3t'], // This should be an env variable
    secure: process.env.NODE_ENV === 'production'
  }
})

export const supabaseStrategy = new SupabaseStrategy(
  {
    supabaseClient,
    sessionStorage
  },
  async ({ req, supabaseClient }) => {
    const form = await req.formData()
    const email = form?.get('email')
    const password = form?.get('password')

    if (!email) throw new AuthorizationError('Email is required')
    if (typeof email !== 'string')
      throw new AuthorizationError('Email must be a string')

    if (!password) throw new AuthorizationError('Password is required')
    if (typeof password !== 'string')
      throw new AuthorizationError('Password must be a string')

    return supabaseClient.auth.api
      .signInWithEmail(email, password)
      .then(({ data, error }): Session => {
        if (error || !data) {
          throw new AuthorizationError(
            error?.message ?? 'No user session found'
          )
        }

        return data
      })
  }
)

export const authenticator = new Authenticator<Session>(sessionStorage, {
  sessionKey: supabaseStrategy.sessionKey, // keep in sync
  sessionErrorKey: supabaseStrategy.sessionErrorKey // keep in sync
})

authenticator.use(supabaseStrategy)
