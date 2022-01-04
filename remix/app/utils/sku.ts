export const stripSKU = (sku: string, skipFormat = false): string => {
  return _sku(sku, skipFormat).replace(/^SP-/, '')
}

export const shortSKU = (sku: string, skipFormat = false): string => {
  const code = stripSKU(sku, skipFormat)
  const [, short1, short2] = code.match(/\d+([a-z]+)-(\d+)/i) ?? []
  return short1 && short2 ? `${short1}-${short2}` : ''
}

const _sku = (sku: string, skipFormat: boolean): string => {
  if (skipFormat) return sku
  const [, first, second] = sku.toUpperCase().match(/^([A-Z]+)(\d+)$/) ?? []
  if (first && second) return `${first}-${second}`
  return sku
}
