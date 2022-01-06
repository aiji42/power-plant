export const formatter = (sku: string): [string, ...string[]] => {
  let matched = sku.match(/SP-(\d+)([A-Z]+)-(\d+)/i)
  if (matched) {
    const [, first, second, third] = matched
    return [`${second}-${third}`, `${first}${second}-${third}`, sku]
  }
  matched = sku.match(/(\d*)([A-Z]+)(-*)(\d+)$/i)
  if (matched) {
    const [, first, second, , third] = matched
    return [
      `${second}-${numPad(third)}`,
      `${first}${second}-${numPad(third)}`,
      sku
    ]
  }
  return [sku]
}

const numPad = (num: string, len = 3) => String(Number(num)).padStart(len, '0')
