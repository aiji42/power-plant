import { createEventHandler } from '@remix-run/cloudflare-workers'
import * as build from '@remix-run/dev/server-build'

addEventListener(
  'fetch',
  createEventHandler({
    build,
    mode: process.env.NODE_ENV,
    getLoadContext: (event) => {
      const cache = caches.default

      return { event, cache }
    }
  })
)
