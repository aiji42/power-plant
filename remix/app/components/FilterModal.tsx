import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalOverlay,
  useColorModeValue,
  useDisclosure
} from '@chakra-ui/react'
import { useFetcher, useLocation } from '@remix-run/react'
import { useEffect, useRef } from 'react'
import { SearchIcon } from '@chakra-ui/icons'
import ProductFilterForm from '~/forms/ProductFilterForm'

export const FilterModal = () => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const location = useLocation()
  useEffect(() => {
    onClose()
  }, [location, onClose])
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
