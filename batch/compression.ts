import * as path from 'path'
import { spawn } from 'child_process'
import {
  download,
  fileListOnS3,
  listFiles,
  makeS3Url,
  upload
} from './libraries'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const compression = async (target: string): Promise<string> => {
  const newFile = `${path.dirname(target)}/${path.basename(
    target,
    path.extname(target)
  )}.compressed.mp4`
  return new Promise((resolve, reject) => {
    console.log(
      `> ffmpeg -y -i ${target} -s 856:480 -b:v 1.2m -r 30 -vcodec libx264 ${newFile}`
    )

    const ffmpeg = spawn(
      'ffmpeg',
      [`-y -i ${target} -s 856:480 -b:v 1.2m -r 30 -vcodec libx264 ${newFile}`],
      {
        shell: true
      }
    )

    ffmpeg.stdout.on('data', (data) => {
      console.log(data.toString())
    })

    let counter = 0
    ffmpeg.stderr.on('data', (data) => {
      if (!data.toString().includes('frame=')) {
        console.log(data.toString())
        return
      }
      if (counter++ < 30) return
      console.log(data.toString())
      counter = 0
    })

    ffmpeg.on('close', (code) => {
      console.log(`ffmpeg exited with code ${code}`)
      if (code === 0) resolve(newFile)
      else reject(null)
    })
  })
}

const main = async () => {
  const id = process.argv[2]
  const targetUrl = process.argv[3]

  if (!id) throw new Error('pass product record id for args')
  if (!targetUrl) throw new Error('pass target file url')

  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) throw new Error(`No record id: ${id}`)

  const [bucket, prefix, code] = [
    process.env.BUCKET ?? '',
    process.env.KEY_PREFIX ?? '',
    product.code
  ]

  try {
    await download(targetUrl, '/downloads')
    const [file] = listFiles('/downloads')
    const src = await compression(file)

    await upload(src, bucket, `${prefix}/${code}/${path.basename(src)}`)

    const filesOnS3 = await fileListOnS3(bucket, prefix, code)
    const mediaUrls = filesOnS3.map((f) =>
      makeS3Url(bucket, `${prefix}/${code}/${f}`)
    )
    await prisma.product.update({
      where: { id },
      data: { mediaUrls }
    })

    console.log('Compression complete ', targetUrl)
  } catch (e) {
    if (e instanceof Error) console.error(e.message)
    throw e
  }
}

main()
