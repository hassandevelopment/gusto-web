const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string
const BUCKET = 'menu-photos'

export interface MenuCategory {
  id: string
  name: string
  sort: number
}

export interface MenuItem {
  id: string
  name: string
  description: string | null
  base_price_fils: number
  image_url: string | null
  in_stock: boolean | null
  sort: number | null
  category: MenuCategory | null
}

export interface MenuSection {
  category: MenuCategory
  items: MenuItem[]
}

export function menuImageUrl(path: string | null): string | null {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(path)}`
}

interface RawRow {
  id: string
  name: string
  description: string | null
  base_price_fils: number
  image_url: string | null
  in_stock: boolean | null
  sort: number | null
  categories: MenuCategory | null
}

export async function fetchMenu(): Promise<MenuSection[]> {
  const url = `${SUPABASE_URL}/rest/v1/menu_items?select=*,categories(*)&active=eq.true`
  const res = await fetch(url, {
    headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
  })
  if (!res.ok) throw new Error(`Menu fetch failed: ${res.status}`)
  const rows: RawRow[] = await res.json()

  const sectionMap = new Map<string, { category: MenuCategory; items: MenuItem[] }>()

  for (const row of rows) {
    if (!row.categories) continue
    const cat = row.categories
    if (!sectionMap.has(cat.id)) {
      sectionMap.set(cat.id, { category: cat, items: [] })
    }
    sectionMap.get(cat.id)!.items.push({
      id: row.id,
      name: row.name,
      description: row.description,
      base_price_fils: row.base_price_fils,
      image_url: row.image_url,
      in_stock: row.in_stock,
      sort: row.sort,
      category: cat,
    })
  }

  for (const section of sectionMap.values()) {
    section.items.sort((a, b) => {
      const d = (a.sort ?? 0) - (b.sort ?? 0)
      return d !== 0 ? d : a.name.localeCompare(b.name)
    })
  }

  return [...sectionMap.values()].sort((a, b) => a.category.sort - b.category.sort)
}
