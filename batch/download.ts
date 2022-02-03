import * as fs from 'fs'
import * as path from 'path'
import { PrismaClient } from '@prisma/client'
import {
  download,
  fileListOnS3,
  listFiles,
  makeS3Url,
  upload
} from './libraries'
const prisma = new PrismaClient()

const main = async () => {
  const id = process.argv[2]
  const minSize = Number(process.argv[3] || '400')

  if (!id) throw new Error('pass product record id for args')
  if (!(minSize > 0)) throw new Error('pass min file size number for args')

  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) throw new Error(`No record id: ${id}`)
  if (!product.downloadUrl || product.isProcessing)
    throw new Error(`The product is not ready for downloading`)
  await prisma.product.update({ where: { id }, data: { isProcessing: true } })

  const [bucket, prefix, code] = [
    process.env.BUCKET ?? '',
    process.env.KEY_PREFIX ?? '',
    product.code
  ]

  try {
    await download(product.downloadUrl, '/downloads')

    const fileNames = listFiles('/downloads').filter(
      (filePath) => fs.statSync(filePath).size > minSize * 1024 * 1024
    )
    // FIXME: It overwrites files that already exist.
    await Promise.all(
      fileNames.map((src, index) => {
        const key = `${prefix}/${code}/${index + 1}${path.extname(src)}`
        return upload(src, bucket, key)
      })
    )
    const filesOnS3 = await fileListOnS3(bucket, prefix, code)
    const mediaUrls = filesOnS3.map((f) =>
      makeS3Url(bucket, `${prefix}/${code}/${f}`)
    )

    await prisma.product.update({
      where: { id },
      data: { mediaUrls, isDownloaded: true, isProcessing: false }
    })
    console.log('Download complete ', code)
  } catch (e) {
    if (e instanceof Error) console.error(e.message)
    await prisma.product.update({
      where: { id },
      data: { isProcessing: false }
    })
    throw e
  }
}

main()
