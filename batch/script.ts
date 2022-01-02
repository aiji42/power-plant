import * as fs from 'fs'
import * as path from 'path'
import { spawn } from 'child_process'
import { S3Client } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const s3 = new S3Client({
  region: process.env.AWS_DEFAULT_REGION
})

const download = async (target: string, dir: string) =>
  new Promise((resolve, reject) => {
    console.log(
      `> aria2c -d ${dir} --seed-time=0 --max-overall-upload-limit=1K --bt-stop-timeout=300 --lowest-speed-limit=500K ${target}`
    )
    const aria2c = spawn(
      'aria2c',
      [
        `-d ${dir} --seed-time=0 --max-overall-upload-limit=1K --bt-stop-timeout=300 --lowest-speed-limit=500K ${target}`
      ],
      {
        shell: true
      }
    )
    aria2c.stdout.on('data', (data) => {
      console.log(data.toString())
    })

    aria2c.stderr.on('data', (data) => {
      console.error(data.toString())
    })

    // self time out
    setTimeout(() => {
      aria2c.kill(7)
    }, 1000 * 60 * 30) // 30min

    aria2c.on('close', (code) => {
      console.log(`aria2 exited with code ${code}`)
      if (code === 0) resolve(true)
      else reject(false)
    })
  })

const compression = async (target: string, index: number): Promise<string> => {
  const newFile = `${path.dirname(target)}/${index}.mp4`
  return new Promise((resolve, reject) => {
    console.log(
      `> ffmpeg -y -i ${target} -s 720:480 -b:v 2.5m -r 30 -vcodec libx264 ${newFile}`
    )

    const ffmpeg = spawn(
      'ffmpeg',
      [`-y -i ${target} -s 720:480 -b:v 2.5m -r 30 -vcodec libx264 ${newFile}`],
      {
        shell: true
      }
    )
    ffmpeg.stdout.on('data', (data) => {
      console.log(data.toString())
    })

    ffmpeg.stderr.on('data', (data) => {
      console.error(data.toString())
    })

    ffmpeg.on('close', (code) => {
      console.log(`ffmpeg exited with code ${code}`)
      if (code === 0) resolve(newFile)
      else reject(null)
    })
  })
}

const listFiles = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((dirent) => {
    return dirent.isFile()
      ? [`${dir}/${dirent.name}`]
      : listFiles(`${dir}/${dirent.name}`)
  })

const upload = async (files: string[], code: string) =>
  Promise.all(
    files.map((filePath, index) => {
      const key = `${process.env.KEY_PREFIX}/${code}/${index + 1}${path.extname(
        filePath
      )}`
      console.log('uploading: ', filePath, ' => ', key)

      const upload = new Upload({
        params: {
          Bucket: process.env.BUCKET,
          Key: key,
          Body: fs.createReadStream(filePath),
          ACL: 'public-read'
        },
        client: s3,
        partSize: 100 * 1024 * 1024 // 100mb chunks
      })
      upload.on('httpUploadProgress', console.log)
      return upload
        .done()
    })
  )

const main = async () => {
  const id = process.argv[2]
  const minSize = Number(process.argv[3] || '500')

  if (!id) throw new Error('pass product record id for args')
  if (!(minSize > 0)) throw new Error('pass min file size number for args')

  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) throw new Error(`No record id: ${id}`)
  if (!product.torrentUrl || product.isProcessing)
    throw new Error(`The product is not ready for downloading`)
  await prisma.product.update({ where: { id }, data: { isProcessing: true } })

  try {
    await download(product.torrentUrl, '/downloads')

    // const fileNames = await Promise.all(
    //   listFiles('/downloads')
    //     .filter(
    //       (filePath) => fs.statSync(filePath).size > minSize * 1024 * 1024
    //     )
    //     .map((name, index) => compression(name, index + 1))
    // )
    const fileNames = listFiles('/downloads').filter(
      (filePath) => fs.statSync(filePath).size > minSize * 1024 * 1024
    )
    const urls = await upload(fileNames, product.code)
    await prisma.product.update({
      where: { id },
      data: { mediaUrls: urls, isDownloaded: true, isProcessing: false }
    })
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
