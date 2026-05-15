import { getSessionUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { buildLaporanWorkbook } from '@/lib/excel'

export async function GET() {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let query = supabase.from('LaporanKerusakan').select(`
    *, 
    alat:alatId(namaAlat, kodeAlat),
    pelapor:pelaporId(nama, email),
    diproses:diprosesOleh(nama)
  `).order('createdAt', { ascending: false })

  if (user.role === 'MAHASISWA') {
    query = query.eq('pelaporId', user.id)
  } else if (user.role !== 'KAJUR') {
    query = query.eq('labId', user.labId)
  }

  const { data, error } = await query
  if (error) return Response.json({ error: error.message }, { status: 500 })

  const workbook = await buildLaporanWorkbook(data || [])
  const buffer = Buffer.from(await workbook.xlsx.writeBuffer())
  const date = new Date().toISOString().split('T')[0]

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="laporan_kerusakan_${date}.xlsx"`,
    },
  })
}
