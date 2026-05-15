'use client'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import { Skeleton } from '@/components/ui/skeleton'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

interface Props {
  data: { months: string[]; laporan: number[]; peminjaman: number[] }
  loading?: boolean
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']

export default function TrendLineChart({ data, loading }: Props) {
  if (loading) return <Skeleton className="h-48 w-full bg-slate-700/50 rounded-xl" />

  const labels = data.months.map((m) => {
    const [, month] = m.split('-')
    return MONTH_NAMES[parseInt(month) - 1]
  })

  return (
    <Line
      data={{
        labels,
        datasets: [
          {
            label: 'Laporan',
            data: data.laporan,
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245,158,11,0.1)',
            fill: true,
            tension: 0.45,
            pointBackgroundColor: '#f59e0b',
            pointBorderColor: '#0f172a',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          {
            label: 'Pinjam',
            data: data.peminjaman,
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99,102,241,0.1)',
            fill: true,
            tension: 0.45,
            pointBackgroundColor: '#6366f1',
            pointBorderColor: '#0f172a',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { 
            position: 'top',
            align: 'end',
            labels: { color: '#94a3b8', font: { size: 11, weight: 'bold' }, boxWidth: 8, usePointStyle: true, pointStyle: 'circle' } 
          },
          tooltip: { 
            mode: 'index',
            intersect: false,
            backgroundColor: '#1e293b', 
            titleColor: '#e2e8f0', 
            bodyColor: '#94a3b8', 
            borderColor: 'rgba(20,184,166,0.3)', 
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8
          },
        },
        scales: {
          x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { display: false } },
          y: { 
            beginAtZero: true,
            ticks: { color: '#64748b', font: { size: 10 }, stepSize: 1 }, 
            grid: { color: 'rgba(255,255,255,0.03)' } 
          },
        },
      }}
      style={{ height: '240px' }}
    />
  )
}
