'use client'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Skeleton } from '@/components/ui/skeleton'

ChartJS.register(ArcElement, Tooltip, Legend)

interface Props {
  data: {
    stokBaik: number
    stokRusak: number
    stokPerbaikan: number
  }
  loading?: boolean
}

export default function ConditionPieChart({ data, loading }: Props) {
  if (loading) return <Skeleton className="h-48 w-full bg-slate-700/50 rounded-xl" />

  const chartData = {
    labels: ['Baik', 'Rusak', 'Perbaikan'],
    datasets: [
      {
        data: [data.stokBaik, data.stokRusak, data.stokPerbaikan],
        backgroundColor: [
          'rgba(34, 197, 94, 0.2)', // Green
          'rgba(239, 68, 68, 0.2)', // Red
          'rgba(59, 130, 246, 0.2)', // Blue
        ],
        borderColor: [
          '#22c55e',
          '#ef4444',
          '#3b82f6',
        ],
        borderWidth: 2,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#94a3b8',
          padding: 20,
          font: { size: 11 },
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#e2e8f0',
        bodyColor: '#94a3b8',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
      },
    },
    cutout: '70%',
  }

  return (
    <div className="relative h-[250px] w-full flex items-center justify-center">
      <Doughnut data={chartData} options={options} />
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-bold text-white">{data.stokBaik + data.stokRusak + data.stokPerbaikan}</span>
        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Alat</span>
      </div>
    </div>
  )
}
