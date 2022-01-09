type OriginalFunction<T> = (...[]: unknown[]) => T

type KVOptions = {
  cacheable?: boolean
} & KVNamespacePutOptions

export const cacheable = async <T>(
  org: OriginalFunction<T> | Promise<T>,
  key: string,
  controller?: KVOptions | ((arg: Awaited<T>) => KVOptions | Promise<KVOptions>)
): Promise<T> => {
  const cache = await CACHE.get<T>(key, 'json')
  if (cache) {
    console.log('cache hit: ', key)
    return cache
  }

  const result = typeof org === 'function' ? await org() : await org
  const { cacheable = true, ...option } =
    typeof controller === 'function'
      ? await controller(result)
      : controller ?? {}
  if (cacheable) {
    await CACHE.put(key, JSON.stringify(result), option)
    console.log('cache set: ', key)
  }
  return result
}
