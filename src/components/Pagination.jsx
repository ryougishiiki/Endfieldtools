import React from "react";

export default function Pagination({ page, totalPages, onChange, className = "" }) {
  if (totalPages <= 1) return null;

  return (
    <div className={`flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400 ${className}`}>
      <button
        className="btn2 px-3 py-1 disabled:opacity-50"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page <= 1}
      >
        上一页
      </button>
      <div>
        第 {page} / {totalPages} 页
      </div>
      <button
        className="btn2 px-3 py-1 disabled:opacity-50"
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
      >
        下一页
      </button>
    </div>
  );
}
