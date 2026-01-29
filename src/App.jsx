import React, { useEffect, useState } from "react";
import { getData } from "./api.js";
import Single from "./pages/Single.jsx";
import Multi from "./pages/Multi.jsx";
import Bead from "./pages/Bead.jsx";

function ThemeToggle({ theme, setTheme }) {
  const isDark = theme === "dark";
  return (
    <button
      className="fixed right-5 bottom-5 z-50 card px-4 py-3 font-bold hover:opacity-90 active:scale-[0.99] transition"
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
    <div className="min-h-screen p-6 bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="max-w-7xl mx-auto flex items-center justify-between mb-6">
        <div>
          <div className="text-2xl font-black tracking-tight">终末地 · 武器基质收益规划器</div>
          <div className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
            仅供参考，如有意见请前往{" "}
            <a
              href="https://space.bilibili.com/455520146"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-zinc-700 dark:hover:text-zinc-300 transition"
            >
              https://space.bilibili.com/455520146
            </a>
          </div>
        </div>

        <div className="flex gap-2">
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

      {tab === "single" && <Single data={data} gotoMulti={() => setTab("multi")} />}
      {tab === "multi" && <Multi data={data} gotoSingle={() => setTab("single")} />}
      {tab === "bead" && <Bead data={data} />}

      <ThemeToggle theme={theme} setTheme={setTheme} />
    </div>
  );
}
