import ExcelJS from 'exceljs'

const TEAL = '0D9488'
const WHITE = 'FFFFFF'

export async function buildExportWorkbook(rows: Record<string, unknown>[]) {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Lab Elektro Inventaris'
  const sheet = workbook.addWorksheet('Peralatan')

  const headers = [
    'NO', 'KODE ALAT', 'NAMA ALAT', 'KATEGORI', 'SPESIFIKASI / MERK',
    'JUMLAH TOTAL', 'BAIK', 'RUSAK', 'BUTUH PERBAIKAN',
    'NAMA LAB'
  ]

  sheet.columns = [
    { header: 'NO', key: 'no', width: 6 },
    { header: 'KODE ALAT', key: 'kodeAlat', width: 18 },
    { header: 'NAMA ALAT', key: 'namaAlat', width: 26 },
    { header: 'KATEGORI', key: 'kategori', width: 22 },
    { header: 'SPESIFIKASI / MERK', key: 'merek', width: 26 },
    { header: 'JUMLAH TOTAL', key: 'stokTotal', width: 15 },
    { header: 'BAIK', key: 'stokBaik', width: 10 },
    { header: 'RUSAK', key: 'stokRusak', width: 10 },
    { header: 'BUTUH PERBAIKAN', key: 'stokButuhPerbaikan', width: 18 },
    { header: 'NAMA LAB', key: 'namaLab', width: 26 }
  ]

  // Style header row
  const headerRow = sheet.getRow(1)
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TEAL } }
    cell.font = { bold: true, color: { argb: WHITE }, size: 11 }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.border = {
      bottom: { style: 'thin', color: { argb: '0D7A70' } },
    }
  })
  headerRow.height = 30

  rows.forEach((r: Record<string, any>, idx) => {
    const row = sheet.addRow([
      idx + 1,
      r.kodeAlat, r.namaAlat, r.kategori, r.merek || '-',
      r.stokTotal, r.stokBaik, r.stokRusak, r.stokButuhPerbaikan,
      r.namaLab || '-'
    ])
    if (idx % 2 === 1) {
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F0FDFA' } }
      })
    }
  })

  // Totals row
  const totalRow = sheet.addRow([
    'TOTAL', '', '', '', '',
    rows.reduce((s, r) => s + Number(r.stokTotal || 0), 0),
    rows.reduce((s, r) => s + Number(r.stokBaik || 0), 0),
    rows.reduce((s, r) => s + Number(r.stokRusak || 0), 0),
    rows.reduce((s, r) => s + Number(r.stokButuhPerbaikan || 0), 0),
    ''
  ])
  totalRow.eachCell((cell) => {
    cell.font = { bold: true }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'CCFBF1' } }
  })

  return workbook
}

export async function buildPeminjamanWorkbook(rows: Record<string, unknown>[]) {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Lab Elektro Inventaris'
  const sheet = workbook.addWorksheet('Laporan Peminjaman')

  const headers = ['No', 'Nama Peminjam', 'Email', 'Nama Alat', 'Kode Alat', 'Jumlah', 'Tujuan', 'Tgl Pinjam', 'Tgl Kembali', 'Status', 'Catatan']
  sheet.columns = [
    { key: 'no', width: 5 },
    { key: 'nama', width: 22 },
    { key: 'email', width: 28 },
    { key: 'namaAlat', width: 24 },
    { key: 'kodeAlat', width: 14 },
    { key: 'jumlah', width: 10 },
    { key: 'tujuan', width: 30 },
    { key: 'tanggalPinjam', width: 14 },
    { key: 'tanggalKembali', width: 14 },
    { key: 'status', width: 14 },
    { key: 'catatan', width: 30 },
  ]

  const headerRow = sheet.getRow(1)
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1)
    cell.value = h
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1D4ED8' } }
    cell.font = { bold: true, color: { argb: WHITE }, size: 11 }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
  })
  headerRow.height = 28

  rows.forEach((r: any, idx) => {
    const row = sheet.addRow([
      idx + 1,
      r.peminjam?.nama || '-',
      r.peminjam?.email || '-',
      r.alat?.namaAlat || '-',
      r.alat?.kodeAlat || '-',
      r.jumlah,
      r.tujuan,
      r.tanggalPinjam ? new Date(r.tanggalPinjam).toLocaleDateString('id-ID') : '-',
      r.tanggalKembali ? new Date(r.tanggalKembali).toLocaleDateString('id-ID') : '-',
      r.status,
      r.catatan || '-',
    ])
    if (idx % 2 === 1) {
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'EFF6FF' } }
      })
    }
  })

  return workbook
}

export async function buildLaporanWorkbook(rows: Record<string, unknown>[]) {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Lab Elektro Inventaris'
  const sheet = workbook.addWorksheet('Laporan Kerusakan')

  const headers = ['No', 'Nama Alat', 'Kode Alat', 'Pelapor', 'Deskripsi Kerusakan', 'Status', 'Diproses Oleh', 'Tgl Lapor', 'Catatan']
  sheet.columns = [
    { key: 'no', width: 5 },
    { key: 'namaAlat', width: 24 },
    { key: 'kodeAlat', width: 14 },
    { key: 'pelapor', width: 22 },
    { key: 'deskripsi', width: 36 },
    { key: 'status', width: 14 },
    { key: 'diproses', width: 22 },
    { key: 'createdAt', width: 14 },
    { key: 'catatan', width: 30 },
  ]

  const headerRow = sheet.getRow(1)
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1)
    cell.value = h
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'B45309' } }
    cell.font = { bold: true, color: { argb: WHITE }, size: 11 }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
  })
  headerRow.height = 28

  rows.forEach((r: any, idx) => {
    const row = sheet.addRow([
      idx + 1,
      r.alat?.namaAlat || '-',
      r.alat?.kodeAlat || '-',
      r.pelapor?.nama || '-',
      r.deskripsi || '-',
      r.status,
      r.diproses?.nama || '-',
      r.createdAt ? new Date(r.createdAt).toLocaleDateString('id-ID') : '-',
      r.catatan || '-',
    ])
    if (idx % 2 === 1) {
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBEB' } }
      })
    }
  })

  return workbook
}

export async function buildTemplateWorkbook() {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Template Import')

  const headers = [
    'NO', 'NAMA ALAT', 'KATEGORI', 'SPESIFIKASI / MERK',
    'JUMLAH TOTAL', 'BAIK', 'RUSAK', 'BUTUH PERBAIKAN',
    'NAMA LAB'
  ]

  sheet.columns = [
    { header: 'NO', key: 'no', width: 6 },
    { header: 'NAMA ALAT', key: 'namaAlat', width: 26 },
    { header: 'KATEGORI', key: 'kategori', width: 22 },
    { header: 'SPESIFIKASI / MERK', key: 'merek', width: 26 },
    { header: 'JUMLAH TOTAL', key: 'stokTotal', width: 15 },
    { header: 'BAIK', key: 'stokBaik', width: 10 },
    { header: 'RUSAK', key: 'stokRusak', width: 10 },
    { header: 'BUTUH PERBAIKAN', key: 'stokButuhPerbaikan', width: 18 },
    { header: 'NAMA LAB', key: 'namaLab', width: 26 }
  ]

  const headerRow = sheet.getRow(1)
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TEAL } }
    cell.font = { bold: true, color: { argb: WHITE } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
  })
  headerRow.height = 28

  // Example row
  sheet.addRow([
    1, 'Transformator Arus (CT)', 'Sensor & Transduser', 'Schneider LVCT 50/5A Panel',
    7, 6, 1, 1, 'Laboratorium Konversi Energi Distribusi dan Proteksi'
  ])

  return workbook
}

function emptyRow() {
  return {
    kodeAlat: '', namaAlat: '', kategori: '', merek: '',
    stokTotal: 0, stokBaik: 0, stokRusak: 0, stokButuhPerbaikan: 0,
    namaLab: '', prodi: '', kondisi: '',
  }
}
