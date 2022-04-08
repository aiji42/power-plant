import { useEffect, ReactNode } from 'react'
import {
  useLocation,
  Outlet,
  Link as RemixLink,
  useFetcher
} from '@remix-run/react'
import {
  Box,
  useDisclosure,
  useColorModeValue,
  Center,
  Stack,
  Container,
  FormControl,
  Input,
  Button
} from '@chakra-ui/react'
import { LoaderFunction } from '@remix-run/cloudflare'
import { supabaseStrategy } from '~/utils/auth.server'

export const loader: LoaderFunction = async ({ request }) =>
  supabaseStrategy.checkSession(request, {
    failureRedirect: '/login'
  })

const Links = [
  { href: '/products', children: 'Products' },
  { href: '/transmission', children: 'Transmission' }
]

const NavLink = (props: { children: ReactNode; href: string }) => (
  <RemixLink to={props.href}>
    <Box
      px={2}
      py={1}
      rounded={'md'}
      _hover={{
        textDecoration: 'none',
        bg: useColorModeValue('gray.200', 'gray.700')
      }}
    >
      {props.children}
    </Box>
  </RemixLink>
)

export default function Layout() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const location = useLocation()
  useEffect(() => {
    onClose()
  }, [location, onClose])
  const { Form } = useFetcher()

  return (
    <Container p={0}>
      <Box
        position="sticky"
        top={0}
        bg={useColorModeValue('gray.100', 'gray.900')}
      >
        <Center h={12}>
          <Box onClick={isOpen ? onClose : onOpen}>POWER PLANT</Box>
        </Center>

        {isOpen ? (
          <Box pb={4} px={2}>
            <Stack as={'nav'} spacing={2}>
              {Links.map((link) => (
                <NavLink {...link} key={link.href} />
              ))}
              <Form method="post" action="/products/search-code">
                <FormControl>
                  <Input
                    placeholder="code"
                    _placeholder={{ color: 'gray.500' }}
                    type="text"
                    name="code"
                    required
                  />
                </FormControl>
                <Button
                  mt={2}
                  w="full"
                  type="submit"
                  colorScheme="purple"
                  color={'white'}
                >
                  Jump
                </Button>
              </Form>
            </Stack>
          </Box>
        ) : null}
      </Box>

      <Box>
        <Outlet />
      </Box>
    </Container>
  )
}
