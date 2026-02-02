export function getRarityTextClass(rarity) {
  const value = Number(rarity);
  if (value === 6) return "text-orange-500";
  if (value === 5) return "text-amber-500";
  if (value === 4) return "text-purple-500";
  return "text-zinc-900 dark:text-zinc-100";
}
