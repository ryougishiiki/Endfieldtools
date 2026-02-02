import React, { useEffect, useState } from "react";
import { getData } from "./api.js";
import Single from "./pages/Single.jsx";
import Multi from "./pages/Multi.jsx";
import Bead from "./pages/Bead.jsx";

function ThemeToggle({ theme, setTheme }) {
  const isDark = theme === "dark";
  return (
    <button
      className="fixed right-5 bottom-5 z-50 card px-4 py-3 font-semibold tracking-tight hover:opacity-90 active:scale-[0.99] transition shadow-lg"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={isDark ? "切换为亮色" : "切换为暗色"}
    >
      {isDark ? "☀ 亮色" : "🌙 暗色"}
    </button>
  );
}

export default function App() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("single");

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved === "light" ? "light" : "dark";
  });

  useEffect(() => {
    getData().then(setData);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  if (!data) {
    return <div className="p-8 text-zinc-300 dark:text-zinc-300">加载数据中…</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="relative overflow-hidden border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_55%)] dark:bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.2),_transparent_55%)]" />
        <div className="relative max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
                Endfieldtools
              </div>
              <div className="text-3xl md:text-4xl font-black tracking-tight">
                终末地 · 武器基质收益规划器
              </div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl">
                轻量化规划界面，快速筛选武器副产与刷取组合。仅供参考，如有意见请前往{" "}
                <a
                  href="https://space.bilibili.com/455520146"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold underline decoration-dotted underline-offset-4 hover:text-zinc-700 dark:hover:text-zinc-300 transition"
                >
                  https://space.bilibili.com/455520146
                </a>
                。
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button className={tab === "single" ? "btn" : "btn2"} onClick={() => setTab("single")}>
                副产查询
              </button>
              <button className={tab === "multi" ? "btn" : "btn2"} onClick={() => setTab("multi")}>
                组合刷取建议
              </button>
              <button className={tab === "bead" ? "btn" : "btn2"} onClick={() => setTab("bead")}>
                这件基质给谁用
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {tab === "single" && <Single data={data} gotoMulti={() => setTab("multi")} />}
        {tab === "multi" && <Multi data={data} gotoSingle={() => setTab("single")} />}
        {tab === "bead" && <Bead data={data} />}
      </div>

      <ThemeToggle theme={theme} setTheme={setTheme} />
    </div>
  );
}
