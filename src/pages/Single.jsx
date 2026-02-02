import React, { useEffect, useMemo, useState } from "react";
import { getSingle } from "../api.js";
import Pagination from "../components/Pagination.jsx";
import { withBasePath } from "../utils/paths.js";
import { getRarityTextClass } from "../utils/weaponUi.js";

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
          <div className={`font-bold weapon-name ${getRarityTextClass(w.rarity)}`}>
            {w.name}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            {w.type || "未知"}
          </div>
        </div>
      </div>
    </div>
  );
}

function uniqKeepOrder(arr) {
  const set = new Set();
  const out = [];
  for (const x of arr) {
    if (set.has(x)) continue;
    set.add(x);
    out.push(x);
  }
  return out;
}

function getTraitName(traits, id) {
  if (!id) return "";
  return traits[id]?.name || id;
}

function WeaponCard({ w, traits }) {
  const baseName = getTraitName(traits, w.traits.cat1);
  const cat2Name = getTraitName(traits, w.traits.cat2);
  const cat3Name = getTraitName(traits, w.traits.cat3);

  const parts = [baseName, cat2Name, cat3Name].filter(Boolean);
  const smallText = parts.join(" · ");

  return (
    <div className="card p-3 flex items-center gap-3">
      <img
        src={withBasePath(w.image)}
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
        className="w-12 h-12 rounded-xl object-cover bg-zinc-200 dark:bg-zinc-800"
        loading="lazy"
      />
      <div className="min-w-0">
        <div className={`font-bold weapon-name ${getRarityTextClass(w.rarity)}`}>{w.name}</div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400">{smallText}</div>
      </div>
    </div>
  );
}

export default function Single({ data }) {
  const weapons = data.weapons;
  const traits = data.traits;
  const locations = data.locations;

  const [q, setQ] = useState("");
  const [rarityFilter, setRarityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const [selected, setSelected] = useState(Object.keys(weapons)[0] || "");
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState(null);
  const [poolPage, setPoolPage] = useState(1);
  const [resultPage, setResultPage] = useState(1);

  const [cat1Selected, setCat1Selected] = useState([]);

  const [otherMode, setOtherMode] = useState("none");

  const selectedWeapon = weapons[selected];
  const selectedCat1 = selectedWeapon?.traits?.cat1;
  const selectedCat2 = selectedWeapon?.traits?.cat2;
  const selectedCat3 = selectedWeapon?.traits?.cat3;

  const typeOptions = useMemo(() => {
    const set = new Set(Object.values(weapons).map((w) => w.type || "未知"));
    return ["all", ...Array.from(set).sort()];
  }, [weapons]);

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

  useEffect(() => {
    setPoolPage(1);
  }, [q, rarityFilter, typeFilter]);

  function pickWeapon(id) {
    setSelected(id);
    setResp(null);
    const w = weapons[id];
    const forced = w?.traits?.cat1 ? [w.traits.cat1] : [];
    setCat1Selected(forced);
    setOtherMode("none");
  }

  async function run() {
    setLoading(true);
    const forced = selectedCat1 ? [selectedCat1] : [];
    setCat1Selected(forced);
    setOtherMode("none");
    const r = await getSingle(selected);
    setResp(r);
    setLoading(false);
  }

  const filterChips = useMemo(() => {
    if (!resp || !resp.results) return [];
    const set = new Set();
    resp.results.forEach((x) => x.cat1_trait_ids?.forEach((id) => set.add(id)));
    const arr = Array.from(set).map((id) => ({
      id,
      name: traits[id]?.name || id,
      color: traits[id]?.color || "#999",
    }));
    if (selectedCat1) {
      arr.sort((a, b) => {
        if (a.id === selectedCat1) return -1;
        if (b.id === selectedCat1) return 1;
        return a.name.localeCompare(b.name);
      });
    } else {
      arr.sort((a, b) => a.name.localeCompare(b.name));
    }
    return arr;
  }, [resp, traits, selectedCat1]);

  function toggleCat1(id) {
    setCat1Selected((prev) => {
      if (id === selectedCat1) return prev.includes(id) ? prev : [id, ...prev];
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return [...prev, id];
    });
  }

  function clearCat1() {
    setCat1Selected(selectedCat1 ? [selectedCat1] : []);
  }

  const otherTagLabel = useMemo(() => {
    const cat2Name = selectedCat2 ? traits[selectedCat2]?.name || selectedCat2 : "（无）";
    const cat3Name = selectedCat3 ? traits[selectedCat3]?.name || selectedCat3 : "（无）";
    return { cat2Name, cat3Name };
  }, [traits, selectedCat2, selectedCat3]);

  function toggleOtherMode(next) {
    setOtherMode((prev) => (prev === next ? "none" : next));
  }

  function clearOtherMode() {
    setOtherMode("none");
  }

  const strategyText = useMemo(() => {
    const baseNames = uniqKeepOrder(
      cat1Selected
        .filter(Boolean)
        .map((id) => traits[id]?.name || id)
    );

    const forcedName = selectedCat1 ? traits[selectedCat1]?.name || selectedCat1 : null;
    const bases =
      forcedName && baseNames.includes(forcedName)
        ? [forcedName, ...baseNames.filter((x) => x !== forcedName)]
        : forcedName
        ? [forcedName, ...baseNames]
        : baseNames;

    const basePart = bases.length > 0 ? bases.join("/") : "（未选）";

    let otherPart = "（未选）";
    if (otherMode === "cat2") otherPart = `附加：${otherTagLabel.cat2Name}`;
    else if (otherMode === "cat3") otherPart = `技能：${otherTagLabel.cat3Name}`;

    return `当前策略：${basePart} | ${otherPart}`;
  }, [cat1Selected, traits, selectedCat1, otherMode, otherTagLabel]);

  const view = useMemo(() => {
    if (!resp?.results) return [];
    const selSet = new Set(cat1Selected);

    const blocks = resp.results
      .map((r) => {
        const locName = locations[r.loc_id]?.name || r.loc_id;
        const byR = r.by_rarity || {};

        const pack = (rarity) =>
          (byR[rarity] || [])
            .map((id) => weapons[id])
            .filter(Boolean)
            .filter((w) => w.id !== selected)
            .filter((w) => {
              if (selSet.size > 0 && !selSet.has(w.traits.cat1)) return false;
              if (otherMode === "cat2") {
                if (!selectedCat2) return false;
                return w.traits.cat2 === selectedCat2;
              }
              if (otherMode === "cat3") {
                if (!selectedCat3) return false;
                return w.traits.cat3 === selectedCat3;
              }
              return true;
            })
            .sort((a, b) => {
              const an = traits[a.traits.cat1]?.name || a.traits.cat1;
              const bn = traits[b.traits.cat1]?.name || b.traits.cat1;
              return an.localeCompare(bn) || a.name.localeCompare(b.name);
            });

        const r6 = pack(6);
        const r5 = pack(5);
        const r4 = pack(4);

        return { loc_id: r.loc_id, locName, r6, r5, r4 };
      })
      .filter((b) => b.r6.length + b.r5.length + b.r4.length > 0);

    return blocks;
  }, [resp, locations, weapons, cat1Selected, otherMode, selectedCat2, selectedCat3, traits, selected]);

  useEffect(() => {
    setResultPage(1);
  }, [resp, cat1Selected, otherMode, selectedCat2, selectedCat3]);

  const poolPageSize = 24;
  const poolTotalPages = Math.max(1, Math.ceil(pool.length / poolPageSize));
  const safePoolPage = Math.min(poolPage, poolTotalPages);
  const pagedPool = pool.slice((safePoolPage - 1) * poolPageSize, safePoolPage * poolPageSize);

  const resultPageSize = 6;
  const resultTotalPages = Math.max(1, Math.ceil(view.length / resultPageSize));
  const safeResultPage = Math.min(resultPage, resultTotalPages);
  const pagedView = view.slice(
    (safeResultPage - 1) * resultPageSize,
    safeResultPage * resultPageSize
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-4 card p-5 space-y-4">
        <div>
          <div className="text-lg font-black">选择武器</div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            支持搜索、星级与类型筛选。
          </div>
        </div>

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

        <div className="grid grid-cols-2 gap-3 pr-1">
          {pagedPool.map((w) => (
            <WeaponTile
              key={w.id}
              w={w}
              selected={selected === w.id}
              onClick={() => pickWeapon(w.id)}
            />
          ))}
        </div>
        <Pagination page={safePoolPage} totalPages={poolTotalPages} onChange={setPoolPage} />

        <button className="btn w-full" onClick={run} disabled={loading || !selected}>
          {loading ? "计算中…" : "计算"}
        </button>

        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          点击计算后，系统将列出该武器基质可能出产的地区以及可能出现的副产基质
        </div>

        {resp && filterChips.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <div className="font-bold">基础属性筛选</div>
              <button className="btn2 px-3 py-2" onClick={clearCat1} title="清空">
                <TrashIcon />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {filterChips.map((c) => {
                const active = cat1Selected.includes(c.id);
                const isPinned = c.id === selectedCat1;
                return (
                  <div
                    key={c.id}
                    className={
                      "chip " +
                      (active ? "border-black/60 dark:border-white/60" : "") +
                      (isPinned ? " ring-1 ring-black/10 dark:ring-white/10" : "")
                    }
                    onClick={() => toggleCat1(c.id)}
                    title={c.id}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                    <span>{c.name}</span>
                    {isPinned ? (
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">（本武器）</span>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
              当前武器基础属性：{getTraitName(traits, selectedCat1)}
              {cat1Selected.length > 0 ? `｜已选：${cat1Selected.length}（不选则默认只有自带tag）` : ""}
            </div>

            <div className="flex items-center justify-between">
              <div className="font-bold">其余 Tag（只能二选一）</div>
              <button className="btn2 px-3 py-2" onClick={clearOtherMode} title="清空">
                <TrashIcon />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <div
                className={
                  "chip " +
                  (otherMode === "cat2" ? "border-black/60 dark:border-white/60" : "")
                }
                onClick={() => toggleOtherMode("cat2")}
                title={selectedCat2 || ""}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: "#00C2A8" }} />
                <span>附加：{otherTagLabel.cat2Name}</span>
              </div>

              <div
                className={
                  "chip " +
                  (otherMode === "cat3" ? "border-black/60 dark:border-white/60" : "")
                }
                onClick={() => toggleOtherMode("cat3")}
                title={selectedCat3 || ""}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: "#B088F9" }} />
                <span>技能：{otherTagLabel.cat3Name}</span>
              </div>
            </div>

            <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
              当前筛选：
              {otherMode === "none"
                ? "（无）"
                : otherMode === "cat2"
                ? `附加=${otherTagLabel.cat2Name}`
                : `技能=${otherTagLabel.cat3Name}`}
            </div>
          </>
        )}
      </div>

      <div className="lg:col-span-8 space-y-4">
        {!resp && (
          <div className="card p-6 text-zinc-500 dark:text-zinc-300">
            选择武器后点击“计算”。
          </div>
        )}

        {resp && view.length === 0 && (
          <div className="card p-6 text-zinc-500 dark:text-zinc-300">
            没有可行地点（请检查 locations.json 的词条池是否覆盖该武器的 cat1/cat2/cat3，或筛选过严）。
          </div>
        )}

        {pagedView.map((block) => (
          <details key={block.loc_id} className="card p-4" open>
            <summary className="details-summary flex items-center justify-between gap-4 cursor-pointer">
              <div className="min-w-0">
                <div className="font-black text-lg weapon-name">
                  {block.locName}
                  <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400">
                    {" "}
                    | {strategyText}
                  </span>
                </div>
              </div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400 flex-shrink-0">
                按地区分类，按星级分类
              </div>
            </summary>

            <div className="grid grid-cols-3 gap-3 mt-3">
              <RarityCol title="6★" items={block.r6} traits={traits} />
              <RarityCol title="5★" items={block.r5} traits={traits} />
              <RarityCol title="4★" items={block.r4} traits={traits} />
            </div>
          </details>
        ))}
        <Pagination
          page={safeResultPage}
          totalPages={resultTotalPages}
          onChange={setResultPage}
        />
      </div>
    </div>
  );
}

function RarityCol({ title, items, traits }) {
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white/60 p-3 dark:border-zinc-800/80 dark:bg-zinc-950/30">
      <div className="font-bold mb-2 text-sm text-zinc-600 dark:text-zinc-300">{title}</div>
      {items.length === 0 ? (
        <div className="text-sm text-zinc-400">空</div>
      ) : (
        <div className="space-y-2">
          {items.map((w) => (
            <WeaponCard key={w.id} w={w} traits={traits} />
          ))}
        </div>
      )}
    </div>
  );
}
