'use client'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Skeleton } from '@/components/ui/skeleton'

ChartJS.register(ArcElement, Tooltip, Legend)

export default function ReportDoughnutChart({ data, loading }: { data: Record<string, number>; loading?: boolean }) {
  if (loading) return <Skeleton className="h-48 w-full bg-slate-700/50 rounded-xl" />

  const total = Object.values(data).reduce((a, b) => a + b, 0)

  return (
    <div className="relative flex flex-col items-center">
      <div style={{ height: '180px', width: '180px', position: 'relative' }}>
        <Doughnut
          data={{
            labels: ['Dilapor', 'Diproses', 'Selesai', 'Ditolak'],
            datasets: [{
              data: [data.DILAPOR || 0, data.DIPROSES || 0, data.SELESAI || 0, data.DITOLAK || 0],
              backgroundColor: ['rgba(245,158,11,0.8)', 'rgba(99,102,241,0.8)', 'rgba(16,185,129,0.8)', 'rgba(244,63,94,0.8)'],
              borderColor: ['#f59e0b', '#6366f1', '#10b981', '#f43f5e'],
              borderWidth: 1,
            }],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
              legend: { display: false },
              tooltip: { backgroundColor: '#1e293b', titleColor: '#e2e8f0', bodyColor: '#94a3b8', borderColor: 'rgba(20,184,166,0.3)', borderWidth: 1 },
            },
          }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-white">{total}</span>
          <span className="text-slate-400 text-xs">Total</span>
        </div>
      </div>
      <div className="mt-4 w-full grid grid-cols-2 gap-2 text-xs">
        {[['Dilapor','#f59e0b'],['Diproses','#6366f1'],['Selesai','#10b981'],['Ditolak','#f43f5e']].map(([label, color]) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
            <span className="text-slate-400">{label}: <span className="text-white font-medium">{data[label.toUpperCase()] || 0}</span></span>
          </div>
        ))}
      </div>
    </div>
  )
}
