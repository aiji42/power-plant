import { ActionFunction, LoaderFunction } from '@remix-run/cloudflare'
import {
  Link,
  useFetcher,
  useLoaderData,
  useLocation,
  useNavigate
} from '@remix-run/react'
import { useInView } from 'react-intersection-observer'
import { ReactNode, useEffect, useRef, useState, VFC } from 'react'
import {
  ProductListItem,
  productsFromDB,
  productsFromF,
  productsFromM
} from '~/utils/products.server'
import { useSwipeable, SwipeDirections } from 'react-swipeable'
import {
  Box,
  Button,
  Flex,
  Modal,
  ModalOverlay,
  Text,
  useDisclosure,
  ModalContent,
  ModalBody,
  ModalFooter,
  useColorModeValue
} from '@chakra-ui/react'
import ProductFilterForm, {
  handler,
  Data as ProductFilterFormData
} from '~/forms/ProductFilterForm'
import { SearchIcon } from '@chakra-ui/icons'

type Data = {
  items: ProductListItem[]
  page: number
} & ProductFilterFormData

export const loader: LoaderFunction = async ({ request }) => {
  const params = new URL(request.url).searchParams
  const page = Number(params.get('page') ?? 1)
  const provider = params.get('provider') ?? 'stock'
  const download = params.get('download') ?? 'any'
  const keyword = params.get('keyword')
  const sort = params.get('sort') ?? 'newer'
  const items = await (provider === 'm'
    ? productsFromM(page, undefined, keyword)
    : provider === 'fa'
    ? productsFromF(page, undefined, 'videoa', keyword)
    : provider === 'fc'
    ? productsFromF(page, undefined, 'videoc', keyword)
    : productsFromDB(
        page,
        { column: 'createdAt', sort: sort === 'newer' ? 'desc' : 'asc' },
        {
          isDownloaded:
            download === 'any' ? null : download === 'done' ? '1' : '0',
          keyword
        }
      ))
  return {
    items,
    page,
    filterFormData: {
      provider,
      sort,
      download,
      keyword,
      page: String(page)
    }
  } as Data
}

export const action: ActionFunction = (params) => handler(params)

const Products: VFC = () => {
  const { items } = useLoaderData<Data>()

  return (
    <Pageable>
      <FilterModal />
      {items.map((item) => (
        <Link to={`/products/${item.sku}`} key={item.sku}>
          <ProductCard {...item} />
        </Link>
      ))}
    </Pageable>
  )
}

export default Products

const Thumbnail: VFC<{ src: string }> = ({ src }) => {
  const [isSquare, setIsSquare] = useState(false)
  const { ref, inView } = useInView({
    triggerOnce: true
  })
  const imgRef = useRef<HTMLImageElement>(null)
  useEffect(() => {
    if (imgRef.current && imgRef.current.naturalHeight > 0)
      setIsSquare(imgRef.current.naturalHeight === imgRef.current.naturalWidth)
  }, [inView])

  return (
    <span ref={ref}>
      <img
        ref={imgRef}
        style={{
          width: 70 * 1.6,
          height: 100 * 1.6,
          objectFit: isSquare ? 'contain' : 'cover',
          ...(!isSquare && { objectPosition: '100% 100%' })
        }}
        src={src}
        loading="lazy"
      />
    </span>
  )
}

const ProductCard = ({
  sku,
  image_path,
  name,
  isProcessing,
  isDownloaded,
  casts,
  maker,
  series
}: {
  sku: string
  image_path: string
  name: string
  isProcessing?: boolean
  isDownloaded?: boolean
  casts?: string[]
  maker?: string
  series?: string
}) => {
  return (
    <Box w="full" rounded="xl">
      <Flex>
        <Box w="8rem">
          <Thumbnail src={image_path} />
        </Box>
        <Box w={'calc(100% - 8rem)'}>
          <Flex alignItems="center">
            {(isDownloaded || isProcessing) && (
              <Box
                as="div"
                h="12px"
                w="12px"
                bgColor={isDownloaded ? 'green.300' : 'orange.300'}
                borderRadius="50%"
                mr={1}
              />
            )}
            <Text w="calc(100% - 12px)" fontSize="sm" isTruncated>
              {name}
            </Text>
          </Flex>
          <Text fontSize="sm" color="gray.600" isTruncated>
            {sku}
          </Text>
          <Text fontSize="sm" color="gray.500" lineHeight="1rem" isTruncated>
            {maker}
          </Text>
          <Text fontSize="sm" color="gray.500" lineHeight="1rem" isTruncated>
            {series}
          </Text>
          <Text fontSize="sm" color="gray.500" lineHeight="1rem" isTruncated>
            {casts?.join(' ')}
          </Text>
        </Box>
      </Flex>
    </Box>
  )
}

const Pageable = ({ children }: { children: ReactNode }) => {
  const { filterFormData, page } = useLoaderData<Data>()
  const nav = useNavigate()
  const [swipingDir, setSwipingDir] = useState<null | SwipeDirections>(null)
  const handler = useSwipeable({
    onSwipedLeft: () => {
      setSwipingDir(null)
      nav(
        `/products?${new URLSearchParams({
          ...filterFormData,
          page: String(page + 1)
        }).toString()}`
      )
    },
    onSwipedRight: () => {
      setSwipingDir(null)
      nav(
        `/products?${new URLSearchParams({
          ...filterFormData,
          page: String(Math.max(page - 1, 1))
        }).toString()}`
      )
    },
    onSwiping: ({ dir }) => {
      setSwipingDir(dir)
    },
    delta: 100
  })

  return (
    <div {...handler}>
      {children}
      {swipingDir === 'Right' ? (
        <Box
          position="fixed"
          left={0}
          top="50%"
          p={4}
          rounded="lg"
          bg={'blue.600'}
        >
          &larr;
        </Box>
      ) : swipingDir === 'Left' ? (
        <Box
          position="fixed"
          right={0}
          top="50%"
          p={4}
          rounded="lg"
          bg={'blue.600'}
        >
          &rarr;
        </Box>
      ) : null}
    </div>
  )
}

const FilterModal = () => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const locatiion = useLocation()
  useEffect(() => {
    onClose()
  }, [locatiion, onClose])
  const fetcher = useFetcher()
  const ref = useRef<HTMLFormElement>(null)
  return (
    <>
      <Button
        position="fixed"
        bottom={5}
        right={5}
        h={12}
        w={12}
        colorScheme="purple"
        borderRadius="50%"
        onClick={onOpen}
      >
        <SearchIcon />
      </Button>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent mx={0.5} bg={useColorModeValue('gray.200', 'gray.800')}>
          <ModalBody pb={6}>
            <ProductFilterForm ref={ref} />
          </ModalBody>

          <ModalFooter>
            <Button
              colorScheme="purple"
              color="white"
              mr={3}
              onClick={() => ref.current && fetcher.submit(ref.current)}
            >
              Filter
            </Button>
            <Button onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
