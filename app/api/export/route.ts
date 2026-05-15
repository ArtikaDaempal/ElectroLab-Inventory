import { getSessionUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { buildExportWorkbook } from '@/lib/excel'

export async function GET() {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let query = supabase.from('Peralatan').select('*').order('namaAlat')
  if (user.role !== 'KAJUR' && user.labId) {
    query = query.eq('labId', user.labId)
  }

  const { data, error } = await query
  if (error) return Response.json({ error: error.message }, { status: 500 })

  const workbook = await buildExportWorkbook(data || [])
  const buffer = Buffer.from(await workbook.xlsx.writeBuffer())
  const date = new Date().toISOString().split('T')[0]

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="peralatan_${date}.xlsx"`,
    },
  })
}
