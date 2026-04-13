import { openDB, IDBPDatabase } from 'idb'
import { supabase } from './supabase'

const DB_NAME = 'guardtrack-offline'
const STORE_NAME = 'pending-actions'

interface PendingAction {
  id?: number
  type: 'check-in' | 'check-out'
  guard_id: string
  timestamp: string
  lat: number | null
  lng: number | null
  attendance_id?: string
}

async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
      }
    },
  })
}

export async function saveOfflineAction(action: Omit<PendingAction, 'id'>) {
  const db = await getDB()
  await db.add(STORE_NAME, action)
}

export async function getPendingActions(): Promise<PendingAction[]> {
  const db = await getDB()
  return db.getAll(STORE_NAME)
}

export async function syncPendingActions(): Promise<number> {
  const db = await getDB()
  const actions = await db.getAll(STORE_NAME)
  let synced = 0

  for (const action of actions) {
    try {
      if (action.type === 'check-in') {
        const { error } = await supabase.from('attendance').insert({
          guard_id: action.guard_id,
          check_in: action.timestamp,
          check_in_lat: action.lat,
          check_in_lng: action.lng,
        })
        if (error) throw error
      } else if (action.type === 'check-out' && action.attendance_id) {
        const checkOut = new Date(action.timestamp)
        const { data: record, error: fetchErr } = await supabase
          .from('attendance')
          .select('check_in')
          .eq('id', action.attendance_id)
          .single()
        if (fetchErr) throw fetchErr

        const totalHours = record
          ? (checkOut.getTime() - new Date(record.check_in).getTime()) / 3600000
          : null

        const { error: updateErr } = await supabase.from('attendance').update({
          check_out: action.timestamp,
          check_out_lat: action.lat,
          check_out_lng: action.lng,
          total_hours: totalHours ? Math.round(totalHours * 100) / 100 : null,
        }).eq('id', action.attendance_id)
        if (updateErr) throw updateErr
      }
      await db.delete(STORE_NAME, action.id!)
      synced++
    } catch {
      // Keep in IndexedDB — will retry on next sync
    }
  }
  return synced
}

export function isOnline(): boolean {
  return navigator.onLine
}
