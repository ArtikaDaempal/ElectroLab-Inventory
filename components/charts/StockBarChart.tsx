'use client'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { Skeleton } from '@/components/ui/skeleton'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const LABEL_MAP: Record<string, string> = {
  MULTIMETER: 'Multimeter', OSILOSKOP: 'Osiloskop', GENERATOR: 'Generator',
  POWER_SUPPLY: 'Power Supply', KOMPONEN_ELEKTRONIK: 'Komponen', KABEL_AKSESORIS: 'Kabel',
  MIKROKONTROLER: 'Mikrokontroler', LAINNYA: 'Lainnya',
}

export default function StockBarChart({ data, loading }: { data: Record<string, number>; loading?: boolean }) {
  if (loading) return <Skeleton className="h-48 w-full bg-slate-700/50 rounded-xl" />

  const labels = Object.keys(data).map((k) => LABEL_MAP[k] || k)
  const values = Object.values(data)

  return (
    <Bar
      data={{
        labels,
        datasets: [{
          label: 'Stok Total',
          data: values,
          backgroundColor: labels.map((_, i) => `hsla(${170 + i * 20}, 70%, 50%, 0.6)`),
          borderColor: labels.map((_, i) => `hsla(${170 + i * 20}, 70%, 50%, 1)`),
          borderWidth: 1.5,
          borderRadius: 8,
          hoverBackgroundColor: labels.map((_, i) => `hsla(${170 + i * 20}, 70%, 50%, 0.8)`),
        }],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
          legend: { display: false }, 
          tooltip: { 
            backgroundColor: '#1e293b', 
            titleColor: '#e2e8f0', 
            bodyColor: '#94a3b8', 
            borderColor: 'rgba(20,184,166,0.3)', 
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            displayColors: false
          } 
        },
        scales: {
          x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { display: false } },
          y: { 
            beginAtZero: true,
            ticks: { color: '#64748b', font: { size: 10 }, stepSize: 5 }, 
            grid: { color: 'rgba(255,255,255,0.03)' } 
          },
        },
      }}
      style={{ height: '240px' }}
    />
  )
}
