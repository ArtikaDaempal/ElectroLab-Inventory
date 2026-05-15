'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AuthUser {
  id: string
  email: string
  nama: string
  role: 'KAJUR' | 'KEPALA_LAB' | 'DOSEN' | 'MAHASISWA'
  nip?: string | null
  nim?: string | null
  fotoUrl?: string | null
  aktif: boolean
  labId?: string | null
  createdAt?: string
}

interface AuthState {
  user: AuthUser | null
  setUser: (user: AuthUser | null) => void
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: async () => {
        await fetch('/api/auth/logout', { method: 'POST' })
        set({ user: null })
        window.location.href = '/login'
      },
    }),
    { name: 'lab-auth' }
  )
)
