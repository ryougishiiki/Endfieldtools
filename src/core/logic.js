// frontend/src/core/logic.js

function poolHas(loc, cat, traitId) {
  const arr = loc?.pools?.[cat] || [];
  return arr.some((x) => x.id === traitId);
}

function weaponFitsLocation(weapon, loc) {
  return (
    poolHas(loc, "cat1", weapon.traits.cat1) &&
    poolHas(loc, "cat2", weapon.traits.cat2) &&
    poolHas(loc, "cat3", weapon.traits.cat3)
  );
}

// 对应旧后端 /api/single 返回结构：{ weapon_id, results:[{loc_id, by_rarity, cat1_trait_ids}] }
export function computeSingle(weaponId, weaponsMap, locationsFull) {
  const target = weaponsMap[weaponId];
  if (!target) return { weapon_id: weaponId, results: [] };

  const results = [];

  for (const loc of Object.values(locationsFull)) {
    if (!weaponFitsLocation(target, loc)) continue;

    const by_rarity = { 6: [], 5: [], 4: [] };
    const cat1Set = new Set();

    for (const w of Object.values(weaponsMap)) {
      if (!weaponFitsLocation(w, loc)) continue;

      cat1Set.add(w.traits.cat1);
      const r = Number(w.rarity);
      if (r === 6 || r === 5 || r === 4) by_rarity[r].push(w.id);
    }

    results.push({
      loc_id: loc.id,
      by_rarity,
      cat1_trait_ids: Array.from(cat1Set),
    });
  }

  return { weapon_id: weaponId, results };
}

// 对应旧后端返回结构：{ selected_ids, groups:[{loc_id,fixed_cat,fixed_trait,matched_weapon_ids,score}] }
export function computeMulti(ids, weaponsMap, locationsFull) {
  const selected = ids.map((id) => weaponsMap[id]).filter(Boolean);
  if (selected.length === 0) return { selected_ids: ids, groups: [] };

  const groups = [];

  for (const loc of Object.values(locationsFull)) {
    // 地点能满足的武器集合
    const fits = selected.filter((w) => weaponFitsLocation(w, loc));
    if (fits.length < 2) continue; // 只满足1把的不展示

    // 固定 cat2
    for (const it of loc.pools?.cat2 || []) {
      const fixedTrait = it.id;
      const matched = fits.filter((w) => w.traits.cat2 === fixedTrait).map((w) => w.id);
      if (matched.length >= 2) {
        groups.push({
          loc_id: loc.id,
          fixed_cat: "cat2",
          fixed_trait: fixedTrait,
          matched_weapon_ids: matched,
          score: matched.length,
        });
      }
    }

    // 固定 cat3
    for (const it of loc.pools?.cat3 || []) {
      const fixedTrait = it.id;
      const matched = fits.filter((w) => w.traits.cat3 === fixedTrait).map((w) => w.id);
      if (matched.length >= 2) {
        groups.push({
          loc_id: loc.id,
          fixed_cat: "cat3",
          fixed_trait: fixedTrait,
          matched_weapon_ids: matched,
          score: matched.length,
        });
      }
    }
  }

  groups.sort(
    (a, b) =>
      b.matched_weapon_ids.length - a.matched_weapon_ids.length ||
      b.score - a.score ||
      String(a.loc_id).localeCompare(String(b.loc_id))
  );

  return { selected_ids: ids, groups };
}
