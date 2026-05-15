import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { v4 as uuid } from 'uuid'
import { supabase } from '@/lib/supabase'
import { createAuditLog } from '@/lib/audit'

export async function POST(req: NextRequest) {
  try {
    const { nama, email, password, role, nim, nip, labId, accessCode } = await req.json()
    
    // Validasi Data Dasar
    if (!nama || !email || !password || !role) return Response.json({ error: 'Data tidak lengkap.' }, { status: 400 })
    
    // Hanya Kepala Lab yang wajib pilih lab
    if (role === 'KEPALA_LAB' && !labId) return Response.json({ error: 'Laboratorium wajib dipilih untuk Kepala Lab.' }, { status: 400 })

    // Validasi NIM/NIP
    if (role === 'MAHASISWA' && !nim) return Response.json({ error: 'NIM wajib diisi untuk Mahasiswa' }, { status: 400 })
    if (role !== 'MAHASISWA' && !nip) return Response.json({ error: 'NIP wajib diisi untuk Dosen/Admin' }, { status: 400 })

    // Validasi Kode Akses (Hanya untuk Dosen/Kepala Lab)
    let codes: any[] = []
    let codeIndex = -1
    let settingsId = ''

    if (role === 'KEPALA_LAB') {
      // 1. Coba sistem baru (INVITE_CODES - JSON)
      const { data: setting, error: settingErr } = await supabase.from('Settings').select('key, value').eq('key', 'INVITE_CODES').maybeSingle()
      
      if (setting && setting.value) {
        try {
          codes = JSON.parse(setting.value)
        } catch (e) {
          codes = []
        }
        
        // Cari yang benar-benar cocok dulu (aktif, belum digunakan, role sesuai)
        const validCode = codes.find((c: any) => 
          c.code?.trim().toUpperCase() === accessCode?.trim().toUpperCase() && 
          !c.used && 
          c.role === role &&
          new Date(c.expiresAt).getTime() > Date.now()
        )

        if (validCode) {
          codeIndex = codes.indexOf(validCode)
        } else {
          // Jika tidak ada yang valid, cari yang namanya cocok untuk beri pesan error spesifik
          const matchedByName = codes.find((c: any) => c.code?.trim().toUpperCase() === accessCode?.trim().toUpperCase())
          if (matchedByName) {
            if (matchedByName.used) return Response.json({ error: 'Kode undangan ini sudah pernah digunakan.' }, { status: 403 })
            
            const serverTime = Date.now()
            const expiryTime = new Date(matchedByName.expiresAt).getTime()
            if (expiryTime < serverTime) {
              return Response.json({ 
                error: `Kode undangan sudah kedaluwarsa. (Sistem: ${new Date(serverTime).toLocaleTimeString()}, Expired: ${new Date(expiryTime).toLocaleTimeString()})` 
              }, { status: 403 })
            }
            
            if (matchedByName.role !== role) return Response.json({ error: `Kode ini untuk ${matchedByName.role?.replace('_', ' ')}, Anda mendaftar sebagai ${role.replace('_', ' ')}.` }, { status: 403 })
          }
        }
      }

      // 2. Jika belum valid, coba sistem lama (LAB_ACCESS_CODE - String)
      if (codeIndex === -1) {
        const { data: legacySetting } = await supabase.from('Settings').select('value').eq('key', 'LAB_ACCESS_CODE').maybeSingle()
        if (legacySetting && legacySetting.value?.toUpperCase() === accessCode?.trim().toUpperCase()) {
          // Valid di sistem lama - kita izinkan lewat
        } else {
          return Response.json({ 
            error: `Kode undangan "${accessCode}" tidak valid, sudah digunakan, atau kedaluwarsa.` 
          }, { status: 403 })
        }
      }
    }

    if (!email.toLowerCase().endsWith('@gmail.com')) return Response.json({ error: 'Gunakan email Gmail' }, { status: 400 })
    if (password.length < 8) return Response.json({ error: 'Password minimal 8 karakter' }, { status: 400 })

    const { data: existing } = await supabase.from('User').select('id').eq('email', email.toLowerCase().trim()).single()
    if (existing) return Response.json({ error: 'Email sudah terdaftar' }, { status: 409 })

    const hashedPassword = await bcrypt.hash(password, 12)
    const now = new Date().toISOString()

    const { data: newUser, error } = await supabase.from('User').insert({
      id: uuid(),
      email: email.toLowerCase().trim(),
      nama,
      password: hashedPassword,
      role,
      labId: role === 'KEPALA_LAB' ? (labId || null) : null,
      nim: role === 'MAHASISWA' ? nim : null,
      nip: role !== 'MAHASISWA' ? nip : null,
      aktif: true,
      pendingApproval: false,
      verificationToken: null,
      emailVerified: now,
      createdAt: now,
      updatedAt: now,
    }).select().single()

    if (error || !newUser) {
      return Response.json({ error: `Gagal membuat akun: ${error?.message || 'Unknown error'}` }, { status: 500 })
    }

    // JIKA BERHASIL MEMBUAT AKUN, BARU TANDAI KODE UNDANGAN SEBAGAI DIGUNAKAN
    if (role === 'KEPALA_LAB' && codeIndex !== -1) {
      codes[codeIndex].used = true
      codes[codeIndex].usedBy = email.toLowerCase().trim()
      codes[codeIndex].usedAt = new Date().toISOString()

      await supabase
        .from('Settings')
        .update({ value: JSON.stringify(codes), updatedAt: new Date().toISOString() })
        .eq('key', 'INVITE_CODES')
    }

    await createAuditLog({ 
      userId: newUser.id, 
      userName: nama, 
      aksi: 'REGISTER', 
      tabel: 'User', 
      recordId: newUser.id, 
      labId: newUser.labId || null, 
      dataBaru: { email, role, status: 'INSTANT_ACTIVE' } 
    })

    return Response.json({ ok: true, message: 'Pendaftaran Berhasil! Silakan login.' })
  } catch (err) {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
