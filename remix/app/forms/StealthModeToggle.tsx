import { ValidatedForm, validationError } from 'remix-validated-form'
import { withZod } from '@remix-validated-form/with-zod'
import { z } from 'zod'
import { Switch } from '@chakra-ui/react'
import { ActionFunction, json, redirect } from '@remix-run/cloudflare'
import { stealthModeCookie } from '~/utils/cookie.server'
import { useFetcher } from '@remix-run/react'

const model = z.object({
  stealthMode: z.string().regex(/on/).nullable()
})

const validator = withZod(model)

export type LoaderData = {
  stealthMode: boolean
}

export const loaderHandler = async ({
  request
}: {
  request: Request
}): Promise<LoaderData> => {
  const cookieHeader = request.headers.get('Cookie')
  const cookie = (await stealthModeCookie.parse(cookieHeader)) || {}

  return { stealthMode: !!cookie.stealthMode }
}

export const actionHandler: ActionFunction = async ({ request }) => {
  const cookieHeader = request.headers.get('Cookie')
  const cookie = (await stealthModeCookie.parse(cookieHeader)) || {}
  const result = await validator.validate(await request.formData())

  if (result.error) {
    return validationError(result.error)
  }

  const { stealthMode } = result.data
  cookie.stealthMode = !!stealthMode

  // FIXME
  return redirect('/products', {
    headers: {
      'Set-Cookie': await stealthModeCookie.serialize(cookie)
    }
  })
}

export default function Form({
  stealthMode,
  action
}: {
  stealthMode: boolean
  action?: string
}) {
  const fetcher = useFetcher()
  return (
    <ValidatedForm
      validator={validator}
      action={action}
      fetcher={fetcher}
      method="post"
      onChange={(e) => e.currentTarget.submit()}
    >
      <Switch value="on" name="stealthMode" isChecked={stealthMode} />
    </ValidatedForm>
  )
}
