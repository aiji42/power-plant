import * as fs from 'fs'
import * as path from 'path'
import { spawn } from 'child_process'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

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
        shell: true,
        timeout: 1000 * 60 * 30
      }
    )
    aria2c.stdout.on('data', (data) => {
      if (!data.toString().includes('Summary')) return
      console.log(data.toString())
    })

    let stderr = ''
    aria2c.stderr.on('data', (data) => {
      if (stderr === data.toString()) return
      stderr = data.toString()
      console.error(stderr)
    })

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
    let stdout = ''
    ffmpeg.stdout.on('data', (data) => {
      if (stdout === data.toString()) return
      stdout = data.toString()
      console.log(stdout)
    })

    let stderr = ''
    ffmpeg.stderr.on('data', (data) => {
      if (stderr === data.toString()) return
      stderr = data.toString()
      console.error(stderr)
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

const upload = async (files: string[], code: string): Promise<string[]> =>
  Promise.all(
    files.map((filePath, index) => {
      const key = `${process.env.KEY_PREFIX}/${code}/${index + 1}${path.extname(
        filePath
      )}`
      return new Promise<string>((resolve, reject) => {
        console.log(
          `> aws s3 mv ${filePath} s3://${process.env.BUCKET}/${key} --acl public-read`
        )
        const aws = spawn(
          'aws',
          [
            `s3 mv ${filePath} s3://${process.env.BUCKET}/${key} --acl public-read`
          ],
          { shell: true }
        )

        let stdout = ''
        aws.stdout.on('data', (data) => {
          if (stdout === data.toString()) return
          stdout = data.toString()
          console.log(stdout)
        })

        let stderr = ''
        aws.stderr.on('data', (data) => {
          if (stderr === data.toString()) return
          stderr = data.toString()
          console.error(stderr)
        })

        aws.on('close', (code) => {
          console.log(`aws s3 exited with code ${code}`)
          if (code === 0)
            resolve(
              `https://${process.env.BUCKET}.s3.${process.env.AWS_DEFAULT_REGION}.amazonaws.com/${key}`
            )
          else reject(null)
        })
      })
    })
  )

const main = async () => {
  const id = process.argv[2]
  const minSize = Number(process.argv[3] || '500')

  if (!id) throw new Error('pass product record id for args')
  if (!(minSize > 0)) throw new Error('pass min file size number for args')

  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) throw new Error(`No record id: ${id}`)
  if (!product.downloadUrl || product.isProcessing)
    throw new Error(`The product is not ready for downloading`)
  await prisma.product.update({ where: { id }, data: { isProcessing: true } })

  try {
    await download(product.downloadUrl, '/downloads')

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
