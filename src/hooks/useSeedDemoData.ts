/**
 * useSeedDemoData.ts
 * ------------------
 * React hook that fires seedDemoData() exactly once per application launch.
 *
 * Behaviour:
 *  - Runs after the component mounts (useEffect with empty deps).
 *  - Uses a module-level `called` ref so React Strict Mode's double-invoke
 *    of effects does NOT trigger a second RPC call (seedDemoData() has its
 *    own in-flight dedup too, but this stops even reaching that layer).
 *  - In production builds the hook still runs but the localStorage guard
 *    in seedDemoData() means it is a no-op after the very first launch.
 *  - Exposes `status` and `error` so callers can optionally render feedback.
 */

import { useEffect, useRef, useState } from 'react'
import { seedDemoData, type SeedResult } from '@/lib/seed-demo-data'

type SeedStatus = 'idle' | 'running' | 'done' | 'error'

interface UseSeedDemoDataReturn {
  /** Current lifecycle status of the seed operation */
  status: SeedStatus
  /** Populated only when status === 'error' */
  error: string | null
  /** Raw result returned from seedDemoData(), null until finished */
  result: SeedResult | null
}

// Module-level flag — survives StrictMode unmount/remount cycles
let _globallyFired = false

export function useSeedDemoData(): UseSeedDemoDataReturn {
  const [status, setStatus] = useState<SeedStatus>('idle')
  const [error, setError]   = useState<string | null>(null)
  const [result, setResult] = useState<SeedResult | null>(null)

  // Per-instance guard as a belt-and-suspenders backup
  const firedRef = useRef(false)

  useEffect(() => {
    // Prevent double execution from StrictMode or hot-reload
    if (firedRef.current || _globallyFired) return
    firedRef.current  = true
    _globallyFired    = true

    setStatus('running')

    seedDemoData()
      .then(res => {
        setResult(res)
        setStatus(res.status === 'error' ? 'error' : 'done')
        if (res.status === 'error') {
          setError(res.message ?? 'Unknown seed error')
        }
      })
      .catch(err => {
        setStatus('error')
        setError((err as Error).message ?? 'Unexpected error during seeding')
      })
  }, [])

  return { status, error, result }
}
