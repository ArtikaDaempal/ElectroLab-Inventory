'use client'
import { Skeleton } from '@/components/ui/skeleton'

interface StatCardProps {
  title: string
  value: number | string
  icon: React.ReactNode
  color: 'blue' | 'green' | 'amber' | 'indigo' | 'rose'
  sub?: string
  loading?: boolean
}

const colorMap: Record<string, { border: string; icon: string; bg: string }> = {
  blue:   { border: '#3b82f6', icon: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  green:  { border: '#10b981', icon: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  amber:  { border: '#f59e0b', icon: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  indigo: { border: '#6366f1', icon: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
  rose:   { border: '#f43f5e', icon: '#f43f5e', bg: 'rgba(244,63,94,0.1)'  },
}

export default function StatCard({ title, value, icon, color, sub, loading }: StatCardProps) {
  const c = colorMap[color]
  return (
    <div className="glass-card p-5 h-full" style={{ borderTop: `3px solid ${c.border}` }}>
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-4 w-24 bg-slate-700" />
          <Skeleton className="h-8 w-16 bg-slate-700" />
          <Skeleton className="h-3 w-32 bg-slate-700" />
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between mb-3">
            <p className="text-slate-400 text-sm font-medium">{title}</p>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: c.bg, color: c.icon }}>
              {icon}
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{value}</p>
          {sub && <p className="text-slate-500 text-xs mt-1.5">{sub}</p>}
        </>
      )}
    </div>
  )
}
