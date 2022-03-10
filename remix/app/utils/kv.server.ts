import kvCacheable from 'kv-cacheable'

export const cacheable = kvCacheable(CACHE, { debug: true })
