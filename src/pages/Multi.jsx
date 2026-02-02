import React, { useMemo, useState } from "react";
import { getMulti } from "../api.js";
import { withBasePath } from "../utils/paths.js";

function TrashIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M9 3h6m-9 4h12m-10 0v14a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V7M10 11v8M14 11v8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WeaponTile({ w, selected, onClick }) {
  return (
    <div
      className={
        "rounded-2xl border p-2 cursor-pointer select-none transition group " +
        (selected
          ? "border-black/60 bg-zinc-100 dark:border-white/70 dark:bg-zinc-800"
          : "border-zinc-200 bg-white hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:bg-zinc-800/60")
      }
      onClick={onClick}
      title={w.name}
    >
      <div className="flex items-center gap-3">
        <img
          src={withBasePath(w.image)}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
          className="w-14 h-14 rounded-xl object-cover bg-zinc-200 dark:bg-zinc-800 flex-shrink-0 group-hover:scale-[1.02] transition"
          loading="lazy"
        />
        <div className="min-w-0">
          <div className="font-bold truncate">{w.name}</div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
            {w.rarity}★ · {w.type || "未知"}
          </div>
        </div>
      </div>
    </div>
  );
}

function SelectedChip({ w, onRemove }) {
  return (
    <div className="chip flex items-center gap-2">
      <img
        src={withBasePath(w.image)}
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
        className="w-6 h-6 rounded-lg object-cover bg-zinc-200 dark:bg-zinc-800"
        loading="lazy"
      />
      <span className="font-bold">{w.name}</span>
      <span className="text-xs text-zinc-500 dark:text-zinc-400">{w.rarity}★</span>
      <button
        className="btn2 px-2 py-1"
        onClick={onRemove}
        title="移除"
        style={{ marginLeft: 4 }}
      >
        <TrashIcon className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function Multi({ data, gotoSingle }) {
  const weapons = data.weapons;
  const traits = data.traits;
  const locations = data.locations;
  const categories = data.categories;

  const [q, setQ] = useState("");
  const [picked, setPicked] = useState([]);
  const [resp, setResp] = useState(null);
  const [loading, setLoading] = useState(false);

  const [rarityFilter, setRarityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const typeOptions = useMemo(() => {
    const set = new Set(Object.values(weapons).map((w) => w.type || "未知"));
    return ["all", ...Array.from(set).sort()];
  }, [weapons]);

  const pickedWeapons = useMemo(() => {
    return picked.map((id) => weapons[id]).filter(Boolean);
  }, [picked, weapons]);

  const pool = useMemo(() => {
    const arr = Object.values(weapons).sort(
      (a, b) => b.rarity - a.rarity || a.name.localeCompare(b.name)
    );
    const key = q.trim().toLowerCase();

    return arr.filter((w) => {
      if (key && !w.name.toLowerCase().includes(key)) return false;
      if (rarityFilter !== "all" && String(w.rarity) !== rarityFilter) return false;
      if (typeFilter !== "all" && (w.type || "未知") !== typeFilter) return false;
      return true;
    });
  }, [weapons, q, rarityFilter, typeFilter]);

  function toggle(id) {
    setPicked((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function removePicked(id) {
    setPicked((prev) => prev.filter((x) => x !== id));
  }

  function clearPicked() {
    setPicked([]);
    setResp(null);
  }

  async function run() {
    setLoading(true);
    const r = await getMulti(picked);
    setResp(r);
    setLoading(false);
  }

  const view = useMemo(() => {
    const groups = resp?.groups || [];
    const map = new Map();

    for (const g of groups) {
      const locName = locations[g.loc_id]?.name || g.loc_id;
      const fixedCatName = categories[g.fixed_cat]?.name || g.fixed_cat;
      const fixedTraitName = traits[g.fixed_trait]?.name || g.fixed_trait;

      const key = `${locName}__${g.fixed_cat}__${g.fixed_trait}`;
      if (!map.has(key)) {
        map.set(key, {
          locName,
          fixedCatName,
          fixedTraitName,
          fixedCat: g.fixed_cat,
          fixedTrait: g.fixed_trait,
          matched: [],
          score: g.score,
        });
      }
      map.get(key).matched = g.matched_weapon_ids;
      map.get(key).score = Math.max(map.get(key).score, g.score);
    }

    return Array.from(map.values()).sort(
      (a, b) => b.matched.length - a.matched.length || b.score - a.score
    );
  }, [resp, locations, traits, categories]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-4 card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-black">选择武器</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              多选后生成共同刷取建议。
            </div>
          </div>
          <button className="btn2 px-3 py-2" onClick={clearPicked} title="清空已选">
            <TrashIcon />
          </button>
        </div>

        {pickedWeapons.length > 0 && (
          <div>
            <div className="text-sm font-bold mb-2">
              已选（{pickedWeapons.length}）
              <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-2">参与计算</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {pickedWeapons.map((w) => (
                <SelectedChip key={w.id} w={w} onRemove={() => removePicked(w.id)} />
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-12">
            <input
              className="input"
              placeholder="搜索武器…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="col-span-6">
            <select
              className="input"
              value={rarityFilter}
              onChange={(e) => setRarityFilter(e.target.value)}
              title="星级筛选"
            >
              <option value="all">全部星级</option>
              <option value="4">4★</option>
              <option value="5">5★</option>
              <option value="6">6★</option>
            </select>
          </div>

          <div className="col-span-6">
            <select
              className="input"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              title="类型筛选"
            >
              <option value="all">全部类型</option>
              {typeOptions
                .filter((x) => x !== "all")
                .map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 max-h-[560px] overflow-auto pr-1">
          {pool.map((w) => (
            <WeaponTile
              key={w.id}
              w={w}
              selected={picked.includes(w.id)}
              onClick={() => toggle(w.id)}
            />
          ))}
        </div>

        <button className="btn w-full" onClick={run} disabled={loading || picked.length === 0}>
          {loading ? "检索中…" : "搜索（查共同刷取）"}
        </button>

        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          右侧只展示“至少满足 2 把”的共同结果；满足 1 把的将不显示。
        </div>
      </div>

      <div className="lg:col-span-8 space-y-4">
        {!resp && (
          <div className="card p-6 text-zinc-500 dark:text-zinc-300">
            左侧选中多个武器后点“搜索”。
          </div>
        )}

        {resp && view.length === 0 && (
          <div className="card p-6">
            <div className="text-zinc-900 dark:text-zinc-200 font-black text-lg">
              暂无共同
            </div>
            <div className="text-zinc-500 dark:text-zinc-400 mt-2">
              当前选择下没有“满足 ≥2 把”的共同刷取组合。
            </div>
            <button className="btn mt-4" onClick={gotoSingle}>
              点击此处回到单武器查询
            </button>
          </div>
        )}

        {view.map((b, idx) => (
          <div key={idx} className="card p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="font-black text-lg truncate">{b.locName}</div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400">
                  共享：{b.fixedCatName} · {b.fixedTraitName}
                </div>
              </div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                满足 {b.matched.length} 把
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              {b.matched.map((id) => {
                const w = weapons[id];
                if (!w) return null;
                const cat1Name = traits[w.traits.cat1]?.name || w.traits.cat1;
                return (
                  <div
                    key={id}
                    className="rounded-2xl border border-zinc-200 bg-white/40 p-3 dark:border-zinc-800 dark:bg-zinc-950/30"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={withBasePath(w.image)}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                        className="w-12 h-12 rounded-xl object-cover bg-zinc-200 dark:bg-zinc-800 flex-shrink-0"
                        loading="lazy"
                      />
                      <div className="min-w-0">
                        <div className="font-bold truncate">{w.name}</div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                          {w.rarity}★ · {w.type || "未知"} · 基础：{cat1Name}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
