export const stripSKU = (sku: string): string => {
  return sku.replace(/^SP-/, '')
}

export const shortSKU = (sku: string): string => {
  const code = stripSKU(sku)
  const [, short1, short2] = code.match(/\d+([a-z]+)-(\d+)/i) ?? []
  return short1 && short2 ? `${short1}-${short2}` : ''
}
