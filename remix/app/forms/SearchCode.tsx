import { FormProps } from '@remix-run/react'
import { Button, FormControl, Input } from '@chakra-ui/react'
import { redirect } from '@remix-run/cloudflare'

export const handler = (data: FormData) => {
  if (!data.has('code')) return
  const code = (data.get('code') as string).trim()
  if (!code) return null
  throw redirect(`/products/${code}`)
}

const Form = (props: FormProps) => {
  return (
    <form method="post" {...props}>
      <FormControl>
        <Input
          placeholder="code"
          _placeholder={{ color: 'gray.500' }}
          type="text"
          name="code"
          required
        />
      </FormControl>
      <Button mt={2} w="full" type="submit" colorScheme="purple">
        Jump
      </Button>
    </form>
  )
}

export default Form
