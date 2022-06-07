import { FC, ReactNode, useState } from 'react'
import { SwipeDirections, useSwipeable } from 'react-swipeable'
import { Box } from '@chakra-ui/react'
import { useNavigate } from '@remix-run/react'

export const SwipeToRandom: FC<{ children: ReactNode; disabled?: boolean }> = ({
  children,
  disabled = false
}) => {
  const nav = useNavigate()
  const [swipingDir, setSwipingDir] = useState<null | SwipeDirections>(null)
  const handler = useSwipeable({
    onSwipedLeft: () => {
      setSwipingDir(null)
      nav('/products/random')
    },
    onSwiping: ({ dir }) => {
      setSwipingDir(dir)
    },
    delta: 100
  })

  if (disabled) return <>{children}</>

  return (
    <div {...handler}>
      {children}
      {swipingDir === 'Left' ? (
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
