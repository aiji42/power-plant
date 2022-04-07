import { ActionFunction, redirect } from '@remix-run/cloudflare'
import { useActionData, Form } from '@remix-run/react'
import { supabaseClient } from '~/utils/supabase.server'
import { commitSession, getSession } from '~/utils/session.server'

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData()
  let token: string | null = null
  if (form.has('email') && form.has('password')) {
    const email = form.get('email') as string
    const password = form.get('password') as string

    const { session: user, error } = await supabaseClient.auth.signIn({
      email,
      password
    })

    if (!user || error) return { user, error: error?.message }
    token = user.access_token
  }

  const session = await getSession(request.headers.get('Cookie'))
  session.set('access_token', token)
  return redirect('/products', {
    headers: {
      'Set-Cookie': await commitSession(session)
    }
  })
}

export default function Login() {
  const actionData = useActionData()

  return (
    <div className="bg-gray-800 w-full h-hull">
      <div className="flex items-center justify-center min-h-screen">
        <div className="px-8 py-6 mt-4 text-left bg-gray-800 shadow-lg text-gray-200">
          <h3 className="text-2xl font-bold text-center">
            Login to your account
          </h3>
          <Form method="post">
            <div className="mt-4">
              <div>
                <label className="block" htmlFor="email">
                  Email
                </label>
                <input
                  name="email"
                  type="text"
                  placeholder="Email"
                  className="w-full px-4 py-2 mt-2 border rounded-md text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
              <div className="mt-4">
                <label className="block">Password</label>
                <input
                  name="password"
                  type="password"
                  placeholder="Password"
                  className="w-full px-4 py-2 mt-2 border rounded-md text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
              <button className="px-6 py-2 mt-4 text-white bg-blue-600 rounded-lg active:bg-blue-900 w-full">
                Login
              </button>
            </div>
            <p className="text-gray-200">{actionData?.error}</p>
          </Form>
        </div>
      </div>
    </div>
  )
}
