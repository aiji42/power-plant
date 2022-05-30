import { useEffect, useRef, useState, VFC } from 'react'
import { useInView } from 'react-intersection-observer'
import { Box, Flex, Text } from '@chakra-ui/react'

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

export const ProductCard = ({
  sku,
  image_path,
  name,
  isProcessing,
  isDownloaded,
  casts,
  maker,
  series,
  stealthMode
}: {
  sku: string
  image_path: string
  name: string
  isProcessing?: boolean
  isDownloaded?: boolean
  casts?: string[]
  maker?: string
  series?: string
  stealthMode?: boolean
}) => {
  return (
    <Box w="full" rounded="xl">
      <Flex>
        <Box w="8rem">
          <Thumbnail
            src={stealthMode ? 'https://picsum.photos/200/300' : image_path}
          />
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
