import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CartItem {
  id: string
  namaAlat: string
  kodeAlat: string
  jumlah: number
  stokBaik: number
}

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  updateJumlah: (id: string, jumlah: number) => void
  clearCart: () => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) => set((state) => {
        const existing = state.items.find((i) => i.id === item.id)
        if (existing) {
          return {
            items: state.items.map((i) => 
              i.id === item.id ? { ...i, jumlah: Math.min(i.stokBaik, i.jumlah + 1) } : i
            )
          }
        }
        return { items: [...state.items, { ...item, jumlah: 1 }] }
      }),
      removeItem: (id) => set((state) => ({
        items: state.items.filter((i) => i.id !== id)
      })),
      updateJumlah: (id, jumlah) => set((state) => ({
        items: state.items.map((i) => i.id === id ? { ...i, jumlah } : i)
      })),
      clearCart: () => set({ items: [] }),
    }),
    { name: 'lab-cart' }
  )
)
