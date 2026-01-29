import React, { useMemo, useState } from "react";

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

function Chip({ active, color, text, onClick }) {
  return (
    <div
      className={"chip " + (active ? "border-black/60 dark:border-white/60" : "")}
      onClick={onClick}
    >
      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      <span>{text}</span>
    </div>
  );
}

function WeaponRow({ w, traits, selected }) {
  const t1 = traits[w.traits.cat1]?.name || w.traits.cat1;
  const t2 = traits[w.traits.cat2]?.name || w.traits.cat2;
  const t3 = traits[w.traits.cat3]?.name || w.traits.cat3;

  const tags = [];
  if (selected.cat1.size) tags.push(`基础：${t1}`);
  if (selected.cat2.size) tags.push(`附加：${t2}`);
  if (selected.cat3.size) tags.push(`技能：${t3}`);

  return (
    <div className="card p-3 flex items-center gap-3">
      <img
        src={w.image || ""}
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
        className="w-12 h-12 rounded-xl object-cover bg-zinc-200 dark:bg-zinc-800 flex-shrink-0"
      />
      <div className="min-w-0 flex-1">
        <div className="font-bold truncate">{w.name}</div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
          {w.rarity}★ · {w.type || "未知"} · {tags.join(" ｜ ")}
        </div>
      </div>
    </div>
  );
}

export default function Bead({ data }) {
  const weapons = data.weapons;
  const traits = data.traits;
  const categories = data.categories;

  // 通过 id 前缀归类（c1_/c2_/c3_）
  const catItems = useMemo(() => {
    const all = Object.values(traits);
    return {
      cat1: all.filter((t) => t.id.startsWith("c1_")).sort((a, b) => a.name.localeCompare(b.name)),
      cat2: all.filter((t) => t.id.startsWith("c2_")).sort((a, b) => a.name.localeCompare(b.name)),
      cat3: all.filter((t) => t.id.startsWith("c3_")).sort((a, b) => a.name.localeCompare(b.name)),
    };
  }, [traits]);

  const [sel1, setSel1] = useState([]);
  const [sel2, setSel2] = useState([]);
  const [sel3, setSel3] = useState([]);

  const selected = useMemo(() => ({
    cat1: new Set(sel1),
    cat2: new Set(sel2),
    cat3: new Set(sel3),
  }), [sel1, sel2, sel3]);

  function toggle(sel, setSel, id) {
    setSel((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const matchedWeapons = useMemo(() => {
    const list = Object.values(weapons).filter((w) => {
      if (selected.cat1.size && !selected.cat1.has(w.traits.cat1)) return false;
      if (selected.cat2.size && !selected.cat2.has(w.traits.cat2)) return false;
      if (selected.cat3.size && !selected.cat3.has(w.traits.cat3)) return false;
      return true;
    });

    // 星级高优先，其次名称
    list.sort((a, b) => b.rarity - a.rarity || a.name.localeCompare(b.name));
    return list;
  }, [weapons, selected]);

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-4 space-y-4">
        <CategoryBlock
          title={categories.cat1?.name || "第一大类"}
          items={catItems.cat1}
          selected={sel1}
          onToggle={(id) => toggle(sel1, setSel1, id)}
          onClear={() => setSel1([])}
        />
        <CategoryBlock
          title={categories.cat2?.name || "第二大类"}
          items={catItems.cat2}
          selected={sel2}
          onToggle={(id) => toggle(sel2, setSel2, id)}
          onClear={() => setSel2([])}
        />
        <CategoryBlock
          title={categories.cat3?.name || "第三大类"}
          items={catItems.cat3}
          selected={sel3}
          onToggle={(id) => toggle(sel3, setSel3, id)}
          onClear={() => setSel3([])}
        />
      </div>

      <div className="col-span-8 space-y-3">
        <div className="card p-4">
          <div className="font-black text-lg">这件基质给谁用</div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            每个类别可选一个或多个词条；下方会列出符合条件的武器。
          </div>
        </div>

        {matchedWeapons.length === 0 ? (
          <div className="card p-6 text-zinc-500 dark:text-zinc-300">
            没有符合条件的武器。
          </div>
        ) : (
          matchedWeapons.map((w) => (
            <WeaponRow key={w.id} w={w} traits={traits} selected={selected} />
          ))
        )}
      </div>
    </div>
  );
}

function CategoryBlock({ title, items, selected, onToggle, onClear }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div className="font-bold">{title}</div>
        <button className="btn2 px-3 py-2" onClick={onClear} title="清空">
          <TrashIcon />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((t) => (
          <Chip
            key={t.id}
            active={selected.includes(t.id)}
            color={t.color || "#999"}
            text={t.name}
            onClick={() => onToggle(t.id)}
          />
        ))}
      </div>
    </div>
  );
}
