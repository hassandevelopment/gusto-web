import rawMenu from '../../menu.json'
import type { MenuData } from '../types'

const base = import.meta.env.BASE_URL.replace(/\/$/, '')

const data = rawMenu as MenuData

export const menuData: MenuData = {
  ...data,
  items: data.items.map((item) => ({
    ...item,
    image: item.image ? base + item.image : item.image,
  })),
}
