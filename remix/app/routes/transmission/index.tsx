import { LoaderFunction, useLoaderData } from 'remix'
import { listMedias } from '~/utils/aws.server'
import { getURLFromBucketAndKey } from '~/utils/aws'

type Data = {
  Key: string
  LastModified: string
  ETag: string
  Size: number
  StorageClass: string
}[]

export const loader: LoaderFunction = async () => {
  const list = await listMedias('transmission-project', 'downloads/complete/')
  return Array.isArray(list) ? list : []
}

const Transmission = () => {
  const data = useLoaderData<Data>()

  return (
    <>
      {data.map(({ Key, Size }) => (
        <a
          href={getURLFromBucketAndKey('transmission-project', Key)}
          key={Key}
          className="flex items-center flex-row mb-1 py-1 active:bg-gray-800"
        >
          <div className="flex flex-col justify-between px-2 leading-normal">
            <h2 className="mb-1 text-xs tracking-tight truncate w-56">{Key}</h2>
            <p className="mb-1 text-xs tracking-tight text-gray-400 truncate w-56">
              {Math.round(Size / 1024 ** 2).toLocaleString()}MB
            </p>
          </div>
        </a>
      ))}
    </>
  )
}

export default Transmission
