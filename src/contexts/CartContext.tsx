import { createContext, useContext, useEffect, useReducer } from 'react'
import type { ReactNode } from 'react'
import { menuData } from '../data/menu'

export interface CartEntry {
  qty: number
  notes?: string
}

interface CartState {
  items: Record<string, CartEntry>
  updatedAt: number
}

type Action =
  | { type: 'ADD'; itemId: string; qty?: number; notes?: string }
  | { type: 'REMOVE'; itemId: string }
  | { type: 'SET_QTY'; itemId: string; qty: number }
  | { type: 'SET_NOTES'; itemId: string; notes: string }
  | { type: 'CLEAR' }

const STORAGE_KEY = 'gusto_cart'
const TTL_MS = 4 * 60 * 60 * 1000

function loadFromStorage(): CartState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { items: {}, updatedAt: 0 }
    const parsed: CartState = JSON.parse(raw)
    if (Date.now() - parsed.updatedAt > TTL_MS) return { items: {}, updatedAt: 0 }
    const validIds = new Set(menuData.items.map((i) => i.id))
    const cleaned: Record<string, CartEntry> = {}
    for (const [id, entry] of Object.entries(parsed.items)) {
      if (validIds.has(id)) cleaned[id] = entry
    }
    return { items: cleaned, updatedAt: parsed.updatedAt }
  } catch {
    return { items: {}, updatedAt: 0 }
  }
}

function reducer(state: CartState, action: Action): CartState {
  const now = Date.now()
  switch (action.type) {
    case 'ADD': {
      const existing = state.items[action.itemId]
      return {
        updatedAt: now,
        items: {
          ...state.items,
          [action.itemId]: {
            qty: (existing?.qty ?? 0) + (action.qty ?? 1),
            notes: action.notes ?? existing?.notes,
          },
        },
      }
    }
    case 'REMOVE': {
      const next = { ...state.items }
      delete next[action.itemId]
      return { updatedAt: now, items: next }
    }
    case 'SET_QTY': {
      if (action.qty <= 0) {
        const next = { ...state.items }
        delete next[action.itemId]
        return { updatedAt: now, items: next }
      }
      return {
        updatedAt: now,
        items: {
          ...state.items,
          [action.itemId]: { ...state.items[action.itemId], qty: action.qty },
        },
      }
    }
    case 'SET_NOTES': {
      return {
        updatedAt: now,
        items: {
          ...state.items,
          [action.itemId]: { ...state.items[action.itemId], notes: action.notes },
        },
      }
    }
    case 'CLEAR':
      return { items: {}, updatedAt: now }
    default:
      return state
  }
}

interface CartContextValue {
  items: Record<string, CartEntry>
  totalQty: number
  totalPrice: number
  add: (itemId: string, qty?: number, notes?: string) => void
  remove: (itemId: string) => void
  setQty: (itemId: string, qty: number) => void
  setNotes: (itemId: string, notes: string) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadFromStorage)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {}
  }, [state])

  const totalQty = Object.values(state.items).reduce((s, e) => s + e.qty, 0)

  const totalPrice = Object.entries(state.items).reduce((sum, [id, entry]) => {
    const item = menuData.items.find((i) => i.id === id)
    if (!item || item.price === null) return sum
    return sum + item.price * entry.qty
  }, 0)

  const value: CartContextValue = {
    items: state.items,
    totalQty,
    totalPrice,
    add: (itemId, qty, notes) => dispatch({ type: 'ADD', itemId, qty, notes }),
    remove: (itemId) => dispatch({ type: 'REMOVE', itemId }),
    setQty: (itemId, qty) => dispatch({ type: 'SET_QTY', itemId, qty }),
    setNotes: (itemId, notes) => dispatch({ type: 'SET_NOTES', itemId, notes }),
    clear: () => dispatch({ type: 'CLEAR' }),
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
