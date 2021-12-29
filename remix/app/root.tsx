import {
  ActionFunction,
  Form,
  Link,
  Links,
  LiveReload,
  LoaderFunction,
  Meta,
  Outlet,
  redirect,
  Scripts,
  ScrollRestoration,
  useActionData,
  useCatch,
  useLoaderData
} from 'remix'
import type { LinksFunction } from 'remix'
import style from '~/tailwind.css'
import { useReducer } from 'react'
import { supabaseClient } from '~/utils/supabase.server'
import { getSession } from '~/utils/session.server'

export let links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: style }]
}

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url)
  const session = await getSession(request.headers.get('Cookie'))
  const { user } = await supabaseClient.auth.api.getUser(
    session.get('access_token')
  )
  if (url.pathname !== '/' && !user) return redirect('/')
  if (url.pathname === '/' && user) return redirect('/news')

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

// https://remix.run/docs/en/v1/api/conventions#errorboundary
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

// https://remix.run/docs/en/v1/api/conventions#catchboundary
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
        <meta name="viewport" content="width=device-width,initial-scale=1" />
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

function Layout({ children }: { children: React.ReactNode }) {
  const [open, toggle] = useReducer((s) => !s, false)
  return (
    <div className="bg-gray-900">
      <header className="mb-2">
        <nav className="flex items-center justify-between flex-wrap p-4 border-b border-gray-500">
          <div className="flex items-center flex-shrink-0 text-white mr-6" />
          <div className="block lg:hidden">
            <button
              onClick={toggle}
              className="flex items-center px-3 py-2 border rounded text-gray-200 border-gray-400 hover:text-white hover:border-white"
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
                <Link
                  to="/news"
                  className="block mt-4 lg:inline-block lg:mt-0 text-gray-200 hover:text-white mr-4"
                >
                  news
                </Link>
                <Link
                  to="/stocks"
                  className="block mt-4 lg:inline-block lg:mt-0 text-gray-200 hover:text-white mr-4"
                >
                  stocks
                </Link>
                <Link
                  to="/stocks?isDownloaded=1"
                  className="block mt-4 lg:inline-block lg:mt-0 text-gray-200 hover:text-white"
                >
                  downloaded
                </Link>
                <Link
                  to="/stocks?isDownloaded=0"
                  className="block mt-4 lg:inline-block lg:mt-0 text-gray-200 hover:text-white"
                >
                  not downloaded
                </Link>
              </div>
            </div>
          )}
        </nav>
      </header>
      <div className="p-1">{children}</div>
    </div>
  )
}
