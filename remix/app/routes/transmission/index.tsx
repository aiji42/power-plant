import {
  ActionFunction,
  LoaderFunction,
  useFetcher,
  useLoaderData
} from 'remix'
import { deleteMedia, getJsonObject, listMedias } from '~/utils/aws.server'
import { getURLFromBucketAndKey } from '~/utils/aws'

type Data = {
  medias: {
    Key: string
    LastModified: string
    ETag: string
    Size: number
    StorageClass: string
  }[]
  transmissionIP: string | null
}

export const loader: LoaderFunction = async () => {
  const list = await listMedias('transmission-project', 'downloads/complete/')

  const { outputs } = (await getJsonObject(
    'power-plant-terraform',
    'global/s3/transmission/terraform.tfstate'
  )) as { outputs: { 'transmission-ec2-ip'?: { value: string } } }

  return {
    medias: Array.isArray(list) ? list : [],
    transmissionIP: outputs['transmission-ec2-ip']?.value ?? null
  }
}

export const action: ActionFunction = async ({ request }) => {
  if (request.method === 'DELETE') {
    const formData = await request.formData()
    await Promise.all(
      Array.from(formData).map(([, val]) =>
        deleteMedia('transmission-project', val as string)
      )
    )
  }

  return null
}

const Transmission = () => {
  const { medias, transmissionIP } = useLoaderData<Data>()
  const { Form } = useFetcher()

  return (
    <>
      <Form method="delete">
        {!!medias.length && (
          <button
            className="block m-auto mr-1 active:bg-gray-800 text-indigo-500"
            type="submit"
          >
            DELETE
          </button>
        )}
        {medias
          .filter(({ Key }) => Key !== 'downloads/complete/')
          .map(({ Key, Size }) => (
            <div
              key={Key}
              className="flex justify-between px-2 leading-normal w-full mb-1 py-1"
            >
              <div className="text-xs tracking-tight truncate w-80">
                <a
                  href={getURLFromBucketAndKey('transmission-project', Key)}
                  className="mb-1active:bg-gray-800"
                >
                  {Key}
                </a>
                <p className="mb-1 text-gray-400">
                  {Math.round(Size / 1024 ** 2).toLocaleString()}MB
                </p>
              </div>
              <input
                className="m-auto mr-1"
                type="checkbox"
                value={Key}
                name="key"
              />
            </div>
          ))}
      </Form>
      <div className="sticky bottom-3 mt-5 text-right">
        {transmissionIP ? (
          <>
            <div className="mb-2">
              <a
                target="_blank"
                rel="noopener noreferrer"
                href="https://github.com/aiji42/power-plant/actions/workflows/transmission-ec2.yml"
                className="text-indigo-500 active:text-indigo-300 pr-2"
              >
                Tutn off
              </a>
            </div>
            <a
              target="_blank"
              rel="noopener noreferrer"
              href={`http://${transmissionIP}:9091`}
              className="p-2 bg-indigo-800 active:bg-indigo-600 items-center text-indigo-100 leading-none rounded-full flex inline-flex"
            >
              <span className="flex rounded-full bg-red-500 uppercase px-2 py-1 text-xs font-bold mr-3">
                Running
              </span>
              <span className="font-semibold mr-2 text-left flex-auto">
                Go transmission client
              </span>
              <svg
                className="fill-current opacity-75 h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <path d="M12.95 10.707l.707-.707L8 4.343 6.586 5.757 10.828 10l-4.242 4.243L8 15.657l4.95-4.95z" />
              </svg>
            </a>
          </>
        ) : (
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://github.com/aiji42/power-plant/actions/workflows/transmission-ec2.yml"
            className="p-2 bg-indigo-800  active:bg-indigo-600 items-center text-indigo-100 leading-none rounded-full flex inline-flex"
          >
            <span className="flex rounded-full bg-indigo-500 uppercase px-2 py-1 text-xs font-bold mr-3">
              Stopped
            </span>
            <span className="font-semibold mr-2 text-left flex-auto">
              Do you want to turn on?
            </span>
            <svg
              className="fill-current opacity-75 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <path d="M12.95 10.707l.707-.707L8 4.343 6.586 5.757 10.828 10l-4.242 4.243L8 15.657l4.95-4.95z" />
            </svg>
          </a>
        )}
      </div>
    </>
  )
}

export default Transmission
