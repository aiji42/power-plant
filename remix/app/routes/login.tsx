import {
  Flex,
  Box,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Button,
  useColorModeValue
} from '@chakra-ui/react'
import { ActionFunction, LoaderFunction } from '@remix-run/cloudflare'
import { Form } from '@remix-run/react'
import { authenticator, supabaseStrategy } from '~/utils/auth.server'

export const loader: LoaderFunction = async ({ request }) =>
  supabaseStrategy.checkSession(request, {
    successRedirect: '/products'
  })

export const action: ActionFunction = async ({ request }) =>
  authenticator.authenticate('sb', request, {
    successRedirect: '/products',
    failureRedirect: '/login'
  })

export default function Login() {
  return (
    <Flex
      minH={'100vh'}
      align={'center'}
      justify={'center'}
      bg={useColorModeValue('gray.50', 'gray.800')}
      p={8}
    >
      <Box
        w="full"
        maxW={'2xl'}
        rounded={'lg'}
        bg={useColorModeValue('white', 'gray.700')}
        boxShadow={'lg'}
        p={8}
      >
        <Form method="post">
          <Stack spacing={4}>
            <FormControl id="email">
              <FormLabel>Email address</FormLabel>
              <Input type="email" name="email" />
            </FormControl>
            <FormControl id="password">
              <FormLabel>Password</FormLabel>
              <Input type="password" name="password" />
            </FormControl>
            <Button
              type="submit"
              w={'full'}
              bg={'green.400'}
              color={'white'}
              rounded={'md'}
              boxShadow={'0 5px 20px 0px rgb(72 187 120 / 43%)'}
              _hover={{
                bg: 'green.500'
              }}
              _focus={{
                bg: 'green.500'
              }}
            >
              Sign in
            </Button>
          </Stack>
        </Form>
      </Box>
    </Flex>
  )
}
