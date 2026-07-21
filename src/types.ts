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

// ── Kitchen: Supabase-fetched shapes ──────────────────────────────────────

export interface KitchenOrderItemAddon {
  id: string
  addon_id: string | null
  name_snapshot: string
  price_fils: number
}

export interface KitchenOrderItemVariant {
  id: string
  group_slug_snapshot: string
  option_slug_snapshot: string
  group_label_snapshot: string
  option_label_snapshot: string
  price_delta_fils: number
}

export interface KitchenOrderItem {
  id: string
  menu_item_id: string | null
  name_snapshot: string
  unit_price_fils: number
  quantity: number
  line_note: string | null
  addons_total_fils: number
  line_total_fils: number
  addons: KitchenOrderItemAddon[]
  variants: KitchenOrderItemVariant[]
}

export type OrderStatus =
  | 'placed'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'completed'
  | 'cancelled'

export type OrderType = 'delivery' | 'pickup'

export interface AddressSnapshot {
  label?: string
  area?: string
  block?: string
  road?: string
  building?: string
  apartment?: string
  additional_notes?: string
}

export interface KitchenOrder {
  id: string
  order_number: number
  user_id: string | null
  order_type: OrderType
  status: OrderStatus
  subtotal_fils: number
  delivery_fee_fils: number
  total_fils: number
  address_snapshot: AddressSnapshot | null
  // Payment fields land via DEV-Gusto-App migrations 039 (payment_status,
  // widened payment_method) and 041 (refund_owed). The kitchen visibility
  // filter (payment_method != 'online' OR payment_status = 'paid') is the
  // authority; RLS is only a backstop.
  payment_method: 'cash' | 'card' | 'online'
  payment_status: 'unpaid' | 'pending' | 'paid' | 'failed'
  refund_owed: boolean
  // Tap charge id (migration 039). Null for cash/card or a capture whose id could
  // not be read. Shown on the refund card so Hassan can find the charge in the
  // Tap dashboard to process the manual refund.
  tap_charge_id: string | null
  order_note: string | null
  scheduled_for: string | null
  placed_at: string
  updated_at: string
  completed_at: string | null
  cancelled_by: string | null
  // Guest orders (user_id IS NULL, is_guest_order TRUE) carry the customer
  // contact inline. Anonymized deleted-user orders have was_deleted_user TRUE.
  is_guest_order: boolean
  was_deleted_user: boolean
  guest_name: string | null
  guest_phone: string | null
  items: KitchenOrderItem[]
  customer: { id: string; full_name: string; phone: string } | null
}
