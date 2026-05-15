import { NextRequest } from 'next/server'
import { v4 as uuid } from 'uuid'
import { supabase } from '@/lib/supabase'
import { getSessionUser } from '@/lib/auth'
import { createAuditLog } from '@/lib/audit'

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['KEPALA_LAB', 'DOSEN', 'KAJUR'].includes(user.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { items } = await req.json()
    if (!Array.isArray(items) || items.length === 0) {
      return Response.json({ error: 'Data tidak valid atau kosong' }, { status: 400 })
    }

    const labId = user.labId
    if (!labId && user.role !== 'KAJUR') {
      return Response.json({ error: 'User tidak terikat dengan laboratorium' }, { status: 400 })
    }

    // Fetch all labs to map names if KAJUR
    let labMapping: Record<string, string> = {}
    if (user.role === 'KAJUR') {
      const { data: allLabs } = await supabase.from('Laboratorium').select('id, nama')
      allLabs?.forEach(l => { labMapping[l.nama.toLowerCase()] = l.id })
    }

    const now = new Date().toISOString()
    const records = items.map((item: any, idx: number) => {
      const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)

      // Find matching labId for KAJUR
      let itemLabId = labId
      if (user.role === 'KAJUR' && item.namaLab) {
        const foundId = labMapping[item.namaLab.toLowerCase()]
        if (foundId) itemLabId = foundId
      }

      // Final check: Pastikan labId adalah UUID yang valid
      if (itemLabId && !isUUID(itemLabId)) {
        itemLabId = null // Fallback ke null jika bukan UUID yang valid
      }

      const baik = parseInt(item.stokBaik) || 0
      const rusak = parseInt(item.stokRusak) || 0
      const perbaikan = parseInt(item.stokButuhPerbaikan) || 0
      const total = parseInt(item.stokTotal) || (baik + rusak + perbaikan)

      // Generate kode if missing
      const generatedKode = item.kodeAlat || `ALT-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${idx}`

      return {
        id: uuid(),
        namaAlat: item.namaAlat,
        kategori: item.kategori || 'Lainnya',
        merek: item.merek || null,
        kodeAlat: generatedKode,
        stokTotal: total,
        stokBaik: baik,
        stokRusak: rusak,
        stokButuhPerbaikan: perbaikan,
        namaLab: item.namaLab || null,
        prodi: item.prodi || null,
        labId: itemLabId,
        createdAt: now,
        updatedAt: now,
      }
    }).filter((r: any) => r.namaAlat && r.labId) // Filter out rows without name or lab

    // Final Sanity Check for all records
    const sanitizedRecords = records.map(r => {
      const isUUID = (str: string | null) => str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
      return {
        ...r,
        labId: isUUID(r.labId) ? r.labId : null
      }
    })

    if (sanitizedRecords.length === 0) {
      return Response.json({ error: 'Tidak ada data valid untuk diimport' }, { status: 400 })
    }

    try {
      // Batch insert to avoid too many requests
      const { data, error } = await supabase.from('Peralatan').insert(sanitizedRecords).select()

      if (error) {
        // Check for enum error (KategoriAlat)
        if (error.message.includes('enum') || error.code === '22P02' || error.message.includes('invalid input value')) {
          // FALLBACK LOGIC: Coba lagi dengan kategori yang pasti diterima sistem ('LAINNYA')
          const fallbackRecords = sanitizedRecords.map(r => ({ ...r, kategori: 'LAINNYA' }))
          const { data: fallbackData, error: fallbackError } = await supabase.from('Peralatan').insert(fallbackRecords).select()

          if (fallbackError) {
            return Response.json({ 
              error: `Gagal Import: Database Anda masih menolak kategori. Pesan teknis: ${fallbackError.message}` 
            }, { status: 400 })
          }

          await createAuditLog({
            userId: user.id,
            userName: user.nama,
            aksi: 'IMPORT_EXCEL_PERALATAN_FALLBACK',
            tabel: 'Peralatan',
            recordId: 'BULK_IMPORT',
            labId: labId || 'GLOBAL',
            dataBaru: { keterangan: `Import ${fallbackData.length} alat dengan kategori fallback 'LAINNYA'` }
          })

          return Response.json({ 
            message: `Berhasil mengimport ${fallbackData.length} peralatan. Catatan: Beberapa kategori otomatis diubah ke 'LAINNYA' karena pembatasan di database Anda.`, 
            count: fallbackData.length 
          })
        }
        // Check for duplicate kodeAlat
        if (error.code === '23505') {
          return Response.json({ error: 'Beberapa Kode Alat sudah terdaftar di sistem. Periksa kembali file Anda.' }, { status: 409 })
        }
        return Response.json({ error: error.message }, { status: 500 })
      }

      await createAuditLog({
        userId: user.id,
        userName: user.nama,
        aksi: 'IMPORT_EXCEL_PERALATAN',
        tabel: 'Peralatan',
        recordId: 'BULK_IMPORT',
        labId: labId || 'GLOBAL',
        dataBaru: { keterangan: `Import ${data.length} alat via Excel` }
      })

      return Response.json({ message: `Berhasil mengimport ${data.length} peralatan`, count: data.length })
    } catch (err: any) {
      return Response.json({ error: 'Terjadi kesalahan sistem saat memproses data' }, { status: 500 })
    }
  } catch (err: any) {
    return Response.json({ error: 'Format data tidak sesuai' }, { status: 400 })
  }
}
