import { v4 as uuid } from 'uuid'
import { supabase } from './supabase'

interface AuditLogParams {
  userId: string
  userName: string
  aksi: string
  tabel: string
  recordId?: string
  labId?: string | null
  dataLama?: Record<string, unknown> | null
  dataBaru?: Record<string, unknown> | null
}

export async function createAuditLog(params: AuditLogParams) {
  try {
    await supabase.from('AuditLog').insert({
      id: uuid(),
      userId: params.userId,
      userName: params.userName,
      aksi: params.aksi,
      tabel: params.tabel,
      recordId: params.recordId || null,
      labId: params.labId || null,
      dataLama: params.dataLama || null,
      dataBaru: params.dataBaru || null,
      createdAt: new Date().toISOString(),
    })
  } catch (err) {
    console.error('Audit log error:', err)
  }
}
