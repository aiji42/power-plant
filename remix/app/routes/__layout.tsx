import {
  ChangeEvent,
  FC,
  FormEventHandler,
  useCallback,
  useEffect,
  useReducer
} from 'react'
import { useLocation, Outlet } from '@remix-run/react'
import { LoaderFunction } from '@remix-run/cloudflare'
import { supabaseStrategy } from '~/utils/auth.server'

export const loader: LoaderFunction = async ({ request }) =>
  supabaseStrategy.checkSession(request, {
    failureRedirect: '/login'
  })

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
      <div className="p-1">
        <Outlet />
      </div>
    </div>
  )
}

export default Layout
