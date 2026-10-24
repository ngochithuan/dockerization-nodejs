import { useCallback, useEffect, useState } from 'react'
import { activityApi } from '../api/drinks'
import type { ActivityFeed } from '../types'
import { errorMessage } from '../utils'

// Hỏi backend định kỳ để thấy số tin trong queue và các sự kiện worker vừa xử lý
export function useActivityFeed(intervalMs = 2500) {
  const [feed, setFeed] = useState<ActivityFeed | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(
    () =>
      activityApi
        .list()
        .then((data) => {
          setFeed(data)
          setError(null)
        })
        .catch((err) => setError(errorMessage(err))),
    [],
  )

  useEffect(() => {
    refresh()
    const timer = window.setInterval(refresh, intervalMs)
    return () => window.clearInterval(timer)
  }, [refresh, intervalMs])

  return { feed, error, refresh }
}
