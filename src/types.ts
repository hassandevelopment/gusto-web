export type Currency = 'BHD'

export type DietaryTag =
  | 'vegetarian'
  | 'vegan'
  | 'gluten-free'
  | 'spicy'
  | 'contains-nuts'
  | 'seafood'

export interface MenuItem {
  id: string
  name: string
  nameAr?: string
  description: string | null
  descriptionAr?: string
  price: number | null
  image: string
  category: string
  tags?: DietaryTag[]
  available?: boolean
}

export interface Category {
  id: string
  name: string
  nameAr?: string
  order: number
  icon?: string
}

export interface MenuData {
  _extractionIssues?: string[]
  restaurant: {
    name: string
    address: string
    phone: string
    instagram: string
    googleMapsUrl: string
    hours: string
    vatIncluded: true
  }
  categories: Category[]
  items: MenuItem[]
}
