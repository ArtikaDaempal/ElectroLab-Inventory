import { getSessionUser } from '@/lib/auth'
import { buildTemplateWorkbook } from '@/lib/excel'

export async function GET() {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const workbook = await buildTemplateWorkbook()
  const buffer = Buffer.from(await workbook.xlsx.writeBuffer())
  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="template_import_peralatan.xlsx"',
    },
  })
}
