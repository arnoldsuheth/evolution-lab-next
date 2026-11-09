export const BAG_RECIPES = [
  { id: 'bag-5', size: 5, level: 1, cloth: 3, gold: 12 },
  { id: 'bag-10', size: 10, level: 10, cloth: 7, gold: 40 },
  { id: 'bag-20', size: 20, level: 20, cloth: 14, gold: 100 },
] as const;

export const BACKPACK_SIZE = 24;
const bagIds = new Set<string>(BAG_RECIPES.map(bag => bag.id));

export function inventorySections(inventory: string[], equipped: string[]) {
  // A stack uses one slot. Equipment in use and active bags do not consume slots.
  const worn = new Set(equipped);
  const stacks = new Set<string>();
  for (const id of inventory) {
    if (bagIds.has(id)) continue;
    if (worn.delete(id)) continue;
    stacks.add(id);
  }
  const ids = [...stacks];
  let offset = 0;
  const sections = [
    { id: 'backpack', size: BACKPACK_SIZE },
    ...BAG_RECIPES.filter(bag => inventory.includes(bag.id)),
  ].map(({ id, size }) => {
    const items = ids.slice(offset, offset + size);
    offset += size;
    return { id, size, items };
  });
  // Existing saves and rewards remain accessible even when all bags are full.
  return { sections, overflow: ids.slice(offset), used: ids.length, capacity: offset };
}

export function canStoreInventory(before: string[], after: string[], equipped: string[]) {
  const current = inventorySections(before, equipped);
  const next = inventorySections(after, equipped);
  return next.overflow.length <= current.overflow.length;
}
