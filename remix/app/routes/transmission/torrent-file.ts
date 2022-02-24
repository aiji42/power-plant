import { ActionFunction } from 'remix'
import { addTorrentFile } from '~/utils/transmission.server'

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData()
  const fileURL = formData.get('fileUrl')
  if (request.method === 'POST' && typeof fileURL === 'string') {
    return await addTorrentFile(fileURL)
  }

  return null
}
