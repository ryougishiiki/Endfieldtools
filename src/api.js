// frontend/src/api.js
import { computeSingle, computeMulti } from "./core/logic.js";

// 兼容 GitHub Pages 子路径：/Endfieldtools/
function withBase(path) {
  const base = import.meta.env.BASE_URL || "/";
  const clean = path.startsWith("/") ? path.slice(1) : path;
  return new URL(base + clean, window.location.origin).toString();
}

async function fetchJson(path) {
  const r = await fetch(withBase(path), { cache: "no-store" });
  if (!r.ok) throw new Error(`Fetch failed ${r.status}: ${path}`);
  return r.json();
}

let _cache = null;

// 维持你之前前端使用方式：App 里 getData().then(setData)，页面里 data.weapons / data.traits / data.locations / data.categories
export async function getData() {
  if (_cache) return _cache;

  const [traitsRaw, weaponsRaw, locationsRaw] = await Promise.all([
    fetchJson("/data/traits.json"),
    fetchJson("/data/weapons.json"),
    fetchJson("/data/locations.json"),
  ]);

  // traits：扁平化到 {id: {id,name,color}}
  const traits = {};
  for (const cat of Object.values(traitsRaw.categories || {})) {
    for (const item of cat.items || []) traits[item.id] = item;
  }

  // weapons：扁平化到 {id: weapon}
  const weapons = {};
  for (const w of weaponsRaw.weapons || []) weapons[w.id] = w;

  // locations：你之前页面只要 name/id；但计算需要 pools，所以同时保留一个 full map
  const locations = {};
  const locationsFull = {};
  for (const l of locationsRaw.locations || []) {
    locations[l.id] = { id: l.id, name: l.name };
    locationsFull[l.id] = l;
  }

  const categories = {};
  for (const [k, v] of Object.entries(traitsRaw.categories || {})) {
    categories[k] = { name: v.name, fixed_pick_from: v.fixed_pick_from };
  }

  _cache = { traits, weapons, locations, categories, _locationsFull: locationsFull };
  return _cache;
}

// 保持函数签名不变：getSingle(weaponId) -> Promise<json>
export async function getSingle(weaponId) {
  const data = await getData();
  return computeSingle(weaponId, data.weapons, data._locationsFull);
}

// 保持函数签名不变：getMulti(ids:Array) -> Promise<json>
export async function getMulti(ids) {
  const data = await getData();
  return computeMulti(ids, data.weapons, data._locationsFull);
}
