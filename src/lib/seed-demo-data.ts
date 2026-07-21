/**
 * seed-demo-data.ts
 * -----------------
 * Calls the `seed_demo_data()` PostgreSQL function (SECURITY DEFINER) that
 * lives in supabase/seed.sql.  That function inserts all demo brands,
 * influencers, campaigns, requests, notes and notifications in a single
 * server-side transaction — bypassing RLS — and is idempotent (safe to
 * call multiple times; the SQL guard prevents duplicate rows).
 *
 * This module adds a second guard layer in the browser:
 *   • localStorage key `ih_demo_seeded` — skips the RPC call entirely once
 *     seeding has already succeeded in this browser.
 *   • A module-level in-flight promise — prevents concurrent calls when
 *     React Strict Mode double-invokes effects.
 */

import { supabase } from '@/lib/supabase'

const STORAGE_KEY = 'ih_demo_seeded'

// Singleton promise so concurrent callers share one network round-trip
let _seedPromise: Promise<void> | null = null

export interface SeedResult {
  status: 'success' | 'skipped' | 'error'
  brands?: number
  influencers?: number
  campaigns?: number
  requests?: number
  notes?: number
  notifications?: number
  reason?: string
  message?: string
}

/**
 * seedDemoData()
 *
 * Safe to call from multiple components / strict-mode double effects.
 * Resolves immediately if seeding was already completed this session.
 */
export async function seedDemoData(): Promise<SeedResult> {
  // ── Browser guard — already done this session ──────────────────────────
  if (localStorage.getItem(STORAGE_KEY) === '1') {
    console.log('[seed] Skipping — already seeded (localStorage).')
    return { status: 'skipped', reason: 'Already seeded in this browser' }
  }

  // ── Dedup concurrent calls (StrictMode double-invoke) ─────────────────
  if (_seedPromise) {
    await _seedPromise
    return { status: 'skipped', reason: 'Seed already in progress' }
  }

  let resolve!: () => void
  _seedPromise = new Promise<void>(r => (resolve = r))

  try {
    console.log('[seed] Calling seed_demo_data() RPC…')

    // Call the SECURITY DEFINER function — no auth token needed because
    // the function is granted to `service_role` which is used server-side.
    // From the browser we call it as `anon` via rpc(); Postgres runs it
    // with the definer's privileges (postgres superuser).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('seed_demo_data')

    if (error) {
      // If the function doesn't exist yet (seed.sql not run), fail gracefully
      if (
        error.code === 'PGRST202' ||          // function not found via PostgREST
        error.message?.includes('seed_demo_data') ||
        error.message?.includes('does not exist')
      ) {
        console.warn(
          '[seed] seed_demo_data() not found in DB. ' +
          'Run supabase/seed.sql in the Supabase SQL Editor first.'
        )
        return { status: 'error', message: 'seed_demo_data() function not found. Run supabase/seed.sql first.' }
      }
      console.error('[seed] RPC error:', error.message)
      return { status: 'error', message: error.message }
    }

    const result = data as SeedResult
    console.log(`[seed] Result: ${result.status}`, result)

    if (result.status === 'success') {
      console.log(
        `[seed] ✅ Seeded — ${result.brands} brands, ${result.influencers} influencers, ` +
        `${result.campaigns} campaigns, ${result.requests} requests, ` +
        `${result.notifications} notifications`
      )
      // Persist flag so we never hit the DB again in this browser
      localStorage.setItem(STORAGE_KEY, '1')
    } else if (result.status === 'skipped') {
      console.log('[seed] Already seeded in DB — marking browser flag.')
      localStorage.setItem(STORAGE_KEY, '1')
    }

    return result
  } catch (err) {
    console.error('[seed] Unexpected error:', err)
    return { status: 'error', message: (err as Error).message }
  } finally {
    resolve()
    _seedPromise = null
  }
}

/**
 * resetSeedFlag()
 * Call this from the browser console to force a re-seed attempt:
 *   import('@/lib/seed-demo-data').then(m => m.resetSeedFlag())
 */
export function resetSeedFlag() {
  localStorage.removeItem(STORAGE_KEY)
  console.log('[seed] Browser seed flag cleared. Reload to re-seed.')
}
