import { ReactNode, useCallback, useMemo, useState } from 'react'
import { useLocation, useNavigate } from '@remix-run/react'
import { SwipeDirections, useSwipeable } from 'react-swipeable'
import { Box } from '@chakra-ui/react'

const usePagination = () => {
  const { pathname, search } = useLocation()
  const params = useMemo(
    () => Object.fromEntries(new URLSearchParams(search).entries()),
    [search]
  )
  const current = Number(params.page ?? 1)
  const nav = useNavigate()
  const next = useCallback(() => {
    nav(
      `${pathname}?${new URLSearchParams({
        ...params,
        page: String(current + 1)
      }).toString()}`
    )
  }, [params, current, nav, pathname])

  const prev = useCallback(() => {
    nav(
      `${pathname}?${new URLSearchParams({
        ...params,
        page: String(Math.max(current - 1, 1))
      }).toString()}`
    )
  }, [params, current, nav, pathname])

  return [next, prev]
}

export const Pageable = ({ children }: { children: ReactNode }) => {
  const [next, prev] = usePagination()
  const [swipingDir, setSwipingDir] = useState<null | SwipeDirections>(null)
  const handler = useSwipeable({
    onSwipedLeft: () => {
      setSwipingDir(null)
      next()
    },
    onSwipedRight: () => {
      setSwipingDir(null)
      prev()
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
