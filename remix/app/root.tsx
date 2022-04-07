import { LoaderFunction, MetaFunction, redirect } from '@remix-run/cloudflare'
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useCatch,
  useLocation
} from '@remix-run/react'

import { LinksFunction } from '@remix-run/react/routeModules'
import style from '~/tailwind.css'
import {
  ChangeEvent,
  FC,
  FormEventHandler,
  useCallback,
  useEffect,
  useReducer
} from 'react'
import { supabaseClient } from '~/utils/supabase.server'
import { getSession } from '~/utils/session.server'

export let links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: style }]
}

export const meta: MetaFunction = () => ({
  charset: 'utf-8',
  title: 'Frontend Performance Contest 2022',
  viewport: 'width=device-width,initial-scale=1',
  robots: 'noindex,nofollow'
})

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url)
  const session = await getSession(request.headers.get('Cookie'))
  const { user } = await supabaseClient.auth.api.getUser(
    session.get('access_token')
  )
  if (url.pathname !== '/' && !user && process.env.NODE_ENV === 'production')
    return redirect('/')
  if (url.pathname === '/' && user) return redirect('/products')

  return { user }
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
        {title ?? <title>{title}</title>}
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  )
}

const Layout: FC = ({ children }) => {
  const [open, handleOpen] = useReducer((s: boolean, a: boolean) => a, false)
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
    open && handleOpen(false)
  }, [href.key])
  return (
    <div className="bg-gray-900 text-gray-200 min-h-screen">
      <header
        className="sticky top-0 mb-2 bg-gray-900"
        onClick={() => handleOpen(true)}
      >
        <nav className="flex items-center justify-between flex-wrap p-2 px-4 border-b border-gray-500">
          <div className="flex items-center m-auto text-xl">POWER PLANT</div>
          {open && (
            <div className="w-full block flex-grow lg:flex lg:items-center lg:w-auto">
              <div className="text-sm lg:flex-grow">
                <div className="mb-2">
                  <a
                    href="/products?provider=m"
                    className="block py-2 active:text-white active:bg-gray-800"
                  >
                    Provider | M
                  </a>
                  <a
                    href="/products?provider=f"
                    className="block py-2 active:text-white active:bg-gray-800"
                  >
                    Provider | F
                  </a>
                  <a
                    href="/products"
                    className="block py-2 active:text-white active:bg-gray-800"
                  >
                    Stocks
                  </a>
                  <a
                    href="/transmission"
                    className="block py-2 active:text-white active:bg-gray-800"
                  >
                    Transmission
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
      <div className="p-1">{children}</div>
    </div>
  )
}
