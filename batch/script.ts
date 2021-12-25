import * as fs from 'fs'
import * as path from 'path'
import { spawn } from 'child_process'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const s3 = new S3Client({
  region: process.env.AWS_DEFAULT_REGION
})

const download = async (target: string, dir: string) =>
  new Promise((resolve, reject) => {
    console.log(
      `> aria2c -d ${dir} --seed-time=0 --max-overall-upload-limit=1K ${target}`
    )
    const aria2c = spawn(
      'aria2c',
      [`-d ${dir} --seed-time=0 --max-overall-upload-limit=1K ${target}`],
      {
        shell: true
      }
    )
    aria2c.stdout.on('data', (data) => {
      console.log(data.toString())
    })

    aria2c.stderr.on('data', (data) => {
      console.error(data.toString())
      reject(false)
    })

    aria2c.on('close', (code) => {
      console.log(`aria2 exited with code ${code}`)
      resolve(true)
    })
  })

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
      const command = new PutObjectCommand({
        Bucket: process.env.BUCKET,
        Key: key,
        Body: fs.createReadStream(filePath),
        ACL: 'public-read'
      })
      return s3
        .send(command)
        .then(
          () =>
            `https://${process.env.BUCKET}.s3.${process.env.AWS_DEFAULT_REGION}.amazonaws.com/${key}`
        )
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
    const urls = await upload(
      listFiles('/downloads').filter(
        (filePath) => fs.statSync(filePath).size > minSize * 1000000
      ),
      product.code
    )
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
