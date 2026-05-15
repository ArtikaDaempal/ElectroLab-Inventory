'use client'
import { Badge } from '@/components/ui/badge'

type Status = 'DILAPOR' | 'DIPROSES' | 'SELESAI' | 'DITOLAK' | 'PENDING' | 'DISETUJUI' | 'DIKEMBALIKAN' | 'AKTIF' | 'NONAKTIF'

const config: Record<Status, { label: string; bg: string; color: string }> = {
  DILAPOR:     { label: 'Dilapor',     bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
  DIPROSES:    { label: 'Diproses',    bg: 'rgba(99,102,241,0.15)', color: '#6366f1' },
  SELESAI:     { label: 'Selesai',     bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
  DITOLAK:     { label: 'Ditolak',     bg: 'rgba(244,63,94,0.15)',  color: '#f43f5e' },
  PENDING:     { label: 'Pending',     bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
  DISETUJUI:   { label: 'Disetujui',   bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
  DIKEMBALIKAN:{ label: 'Dikembalikan',bg: 'rgba(59,130,246,0.15)', color: '#3b82f6' },
  AKTIF:       { label: 'Aktif',       bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
  NONAKTIF:    { label: 'Nonaktif',    bg: 'rgba(244,63,94,0.15)',  color: '#f43f5e' },
}

export default function StatusBadge({ status }: { status: string }) {
  const c = config[status as Status] ?? { label: status, bg: 'rgba(100,116,139,0.15)', color: '#64748b' }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ background: c.bg, color: c.color }}>
      {c.label}
    </span>
  )
}
