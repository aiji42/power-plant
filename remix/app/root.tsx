import {
  Link,
  Links,
  LiveReload,
  LoaderFunction,
  Meta,
  Outlet,
  redirect,
  Scripts,
  ScrollRestoration,
  useCatch,
  useLoaderData,
  useLocation
} from 'remix'
import type { LinksFunction } from 'remix'
import style from '~/tailwind.css'
import {
  ChangeEvent,
  FC,
  FormEventHandler,
  useCallback,
  useEffect,
  useReducer,
  VFC
} from 'react'
import { supabaseClient } from '~/utils/supabase.server'
import { getSession } from '~/utils/session.server'
import { getJsonObject } from '~/utils/aws.server'

export let links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: style }]
}

type Data = { transmissionIP?: string | null }

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url)
  const session = await getSession(request.headers.get('Cookie'))
  const { user } = await supabaseClient.auth.api.getUser(
    session.get('access_token')
  )
  if (url.pathname !== '/' && !user && process.env.NODE_ENV === 'production')
    return redirect('/')
  if (url.pathname === '/' && user) return redirect('/products')

  const { outputs } = (await getJsonObject(
    'power-plant-terraform',
    'global/s3/transmission/terraform.tfstate'
  )) as { outputs: { 'transmission-ec2-ip'?: { value: string } } }

  return { user, transmissionIP: outputs['transmission-ec2-ip']?.value ?? null }
}

export default function App() {
  return (
    <Document>
      <Layout>
        <Outlet />
      </Layout>
    </Document>
  )
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error)
  return (
    <Document title="Error!">
      <Layout>
        <div>
          <h1>There was an error</h1>
          <p>{error.message}</p>
          <hr />
          <p>
            Hey, developer, you should replace this with what you want your
            users to see.
          </p>
        </div>
      </Layout>
    </Document>
  )
}

export function CatchBoundary() {
  let caught = useCatch()

  let message
  switch (caught.status) {
    case 401:
      message = (
        <p>
          Oops! Looks like you tried to visit a page that you do not have access
          to.
        </p>
      )
      break
    case 404:
      message = (
        <p>Oops! Looks like you tried to visit a page that does not exist.</p>
      )
      break

    default:
      throw new Error(caught.data || caught.statusText)
  }

  return (
    <Document title={`${caught.status} ${caught.statusText}`}>
      <Layout>
        <h1>
          {caught.status}: {caught.statusText}
        </h1>
        {message}
      </Layout>
    </Document>
  )
}

function Document({
  children,
  title
}: {
  children: React.ReactNode
  title?: string
}) {
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width,initial-scale=1,maximum-scale=1.0"
        />
        <meta name="robots" content="noindex,nofollow" />
        {title ?? <title>{title}</title>}
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
        {process.env.NODE_ENV === 'development' && <LiveReload />}
      </body>
    </html>
  )
}

const Layout: FC = ({ children }) => {
  const { transmissionIP } = useLoaderData<Data>()
  const [open, toggle] = useReducer((s) => !s, false)
  const [value, onChange] = useReducer(
    (s: string, e: ChangeEvent<HTMLInputElement>) => {
      return e.target.value
    },
    ''
  )
  const onSubmit = useCallback<FormEventHandler<HTMLFormElement>>(
    (e) => {
      e.preventDefault()
      location.href = `/products/${value.trim()}`
    },
    [value]
  )
  const href = useLocation()
  useEffect(() => {
    open && toggle()
  }, [href.key])
  return (
    <div className="bg-gray-900 text-gray-200 min-h-screen">
      <header className="mb-2">
        <nav className="flex items-center justify-between flex-wrap p-2 px-4 border-b border-gray-500">
          <div className="flex items-center flex-shrink-0 text-white mr-6" />
          <div className="block">
            <button
              onClick={toggle}
              className="flex items-center px-3 py-2 border rounded border-gray-400 active:text-white active:border-white"
            >
              <svg
                className="fill-current h-3 w-3"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>Menu</title>
                <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z" />
              </svg>
            </button>
          </div>
          {open && (
            <div className="w-full block flex-grow lg:flex lg:items-center lg:w-auto">
              <div className="text-sm lg:flex-grow">
                <div className="mb-2">
                  <Link
                    to="/products?provider=m"
                    className="block py-2 active:text-white active:bg-gray-800"
                  >
                    Provider | M
                  </Link>
                  <Link
                    to="/products?provider=f"
                    className="block py-2 active:text-white active:bg-gray-800"
                  >
                    Provider | F
                  </Link>
                  <Link
                    to="/products"
                    className="block py-2 active:text-white active:bg-gray-800"
                  >
                    Stocks
                  </Link>
                  {transmissionIP && (
                    <a
                      href={`http://${transmissionIP}:9091`}
                      className="block py-2 active:text-white active:bg-gray-800"
                    >
                      Transmission
                    </a>
                  )}
                  <a href="https://github.com/aiji42/power-plant/actions/workflows/transmission-ec2.yml">
                    Transmission controller
                  </a>
                </div>
                <form className="w-full" onSubmit={onSubmit}>
                  <div className="flex items-center border-b border-indigo-500 py-2">
                    <input
                      className="appearance-none bg-transparent border-none w-full mr-3 py-2 px-2 leading-tight focus:outline-none"
                      type="text"
                      onChange={onChange}
                    />
                    <button className="flex-shrink-0 text-sm text-indigo-500 active:text-indigo-400 active:bg-gray-800 py-1 px-2">
                      Jump
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </nav>
      </header>
      <div className="p-1">
        <TransmissionSnackBar running={!!transmissionIP} />
        {children}
      </div>
    </div>
  )
}

const TransmissionSnackBar: VFC<{ running: boolean }> = ({ running }) => {
  const [show, hide] = useReducer(() => {
    sessionStorage.setItem('hideTransmissionSnackBar', 'true')
    return false
  }, running)
  useEffect(() => {
    sessionStorage.getItem('hideTransmissionSnackBar') && hide()
  }, [])
  if (!show) return null

  return (
    <div
      className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 mb-2 rounded relative"
      role="alert"
    >
      <strong className="font-bold">Transmission is launching.</strong>
      <span
        className="absolute top-0 bottom-0 right-0 px-4 py-3"
        onClick={hide}
      >
        <svg
          className="fill-current h-6 w-6 text-blue-500"
          role="button"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
        >
          <title>Close</title>
          <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
        </svg>
      </span>
    </div>
  )
}
