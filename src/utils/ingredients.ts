export function parseIngredients(description: string | null): string[] {
  if (!description) return []
  return description
    .split(/[,&]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1 && s.length < 40)
}

export const CATEGORY_ADDONS: Record<string, string[]> = {
  'traditional-wood-oven-fire-pizza': ['Extra mozzarella', 'Pepperoni', 'Mushroom', 'Onion', 'Black olives', 'Bell peppers', 'Basil', 'Rocket', 'Chilli'],
  'chefs-signature-pizza':            ['Extra mozzarella', 'Pepperoni', 'Mushroom', 'Onion', 'Black olives', 'Rocket', 'Chilli'],
  'calzone':                          ['Pepperoni', 'Mushroom', 'Onion', 'Salami', 'Spinach'],
  'focaccia':                         ['Rocket', 'Parmesan', 'Chilli oil', 'Olives'],
  'pasta-and-co':                     ['Chicken', 'Mushroom', 'Parmesan', 'Cream', 'Chilli'],
  'salad':                            ['Chicken', 'Avocado', 'Olives', 'Cherry tomatoes', 'Parmesan'],
  'starters':                         ['Lemon', 'Chilli oil', 'Parmesan'],
}

export function buildNotes(removed: string[], added: string[], spice: 0 | 1 | 2 | 3): string {
  const spiceLabels = ['', 'Mild', 'Medium', 'Hot']
  const parts: string[] = []
  if (removed.length > 0) parts.push(`Remove: ${removed.join(', ')}`)
  if (added.length > 0) parts.push(`Add: ${added.join(', ')}`)
  if (spice > 0) parts.push(`Spice: ${spiceLabels[spice]}`)
  return parts.join(' | ')
}
