import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSessionUser } from '@/lib/auth'
import { createAuditLog } from '@/lib/audit'

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user || user.role !== 'KEPALA_LAB') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { items } = await req.json()
  if (!Array.isArray(items) || items.length === 0) {
    return Response.json({ error: 'Data tidak valid' }, { status: 400 })
  }

  // Update tools in parallel
  const promises = items.map(async (item: any) => {
    const { id, stokBaik, stokRusak, stokButuhPerbaikan } = item
    const stokTotal = Number(stokBaik) + Number(stokRusak) + Number(stokButuhPerbaikan)

    const { data: oldData } = await supabase.from('Peralatan').select('stokBaik, stokRusak, stokButuhPerbaikan').eq('id', id).single()

    const { error } = await supabase
      .from('Peralatan')
      .update({ stokBaik, stokRusak, stokButuhPerbaikan, stokTotal, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .eq('labId', user.labId) // extra security check
      
    if (!error && oldData && (oldData.stokBaik !== stokBaik || oldData.stokRusak !== stokRusak || oldData.stokButuhPerbaikan !== stokButuhPerbaikan)) {
      await createAuditLog({
        userId: user.id,
        userName: user.nama,
        aksi: 'UPDATE_OPNAME',
        tabel: 'Peralatan',
        recordId: id,
        labId: user.labId || ''
      })
    }
    
    return error
  })

  const results = await Promise.all(promises)
  const hasErrors = results.some(e => e !== null)

  if (hasErrors) {
    return Response.json({ error: 'Sebagian atau seluruh data gagal diperbarui' }, { status: 500 })
  }

  return Response.json({ success: true }, { status: 200 })
}
