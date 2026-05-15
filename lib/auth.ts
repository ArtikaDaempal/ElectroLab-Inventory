import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'lab-elektro-secret-fallback-key-32chars'
)

export interface SessionUser {
  id: string
  email: string
  nama: string
  role: 'KAJUR' | 'KEPALA_LAB' | 'DOSEN' | 'MAHASISWA'
  nip?: string | null
  nim?: string | null
  aktif: boolean
  labId?: string | null
  createdAt?: string
}

export async function signToken(payload: SessionUser): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as SessionUser
  } catch {
    return null
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('lab_session')?.value
    if (!token) return null
    return verifyToken(token)
  } catch {
    return null
  }
}
