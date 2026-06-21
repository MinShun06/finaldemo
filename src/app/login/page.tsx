"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!nickname.trim()) {
      setError("請輸入暱稱！");
      return;
    }

    // 管理員登入邏輯（報告當天密碼敲這個：nkust2026）
    if (isAdmin || nickname.toLowerCase() === "admin") {
      if (password === "nkust2026") {
        sessionStorage.setItem("user_role", "admin");
        sessionStorage.setItem("user_nickname", "🚨 超級管理員");
        router.push("/");
      } else {
        setError("管理員密碼錯誤！");
      }
      return;
    }

    // 一般訪客登入邏輯
    sessionStorage.setItem("user_role", "guest");
    sessionStorage.setItem("user_nickname", nickname.trim());
    router.push("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xl">
        <h1 className="text-center text-2xl font-bold text-slate-800 dark:text-slate-100">
          🏫 NKUST 匿名問答牆
        </h1>
        <p className="mt-2 text-center text-xs text-slate-400">進網站前，請先給自己一個帥氣的稱號</p>

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">自訂暱稱</label>
            <input
              type="text"
              placeholder="例如：高科彭于晏"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-2.5 text-sm outline-hidden focus:border-indigo-500 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center gap-2 py-1">
            <input
              type="checkbox"
              id="admin-check"
              checked={isAdmin}
              onChange={(e) => setIsAdmin(e.target.checked)}
              className="h-4 w-4 rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="admin-check" className="text-xs font-semibold text-slate-500 cursor-pointer select-none">
              我是管理員 (Admin)
            </label>
          </div>

          {isAdmin && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="block text-xs font-bold text-slate-500 mb-1">管理員驗證密碼</label>
              <input
                type="password"
                placeholder="請輸入後台密碼"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-2.5 text-sm outline-hidden focus:border-indigo-500 text-slate-800 dark:text-slate-100"
              />
            </div>
          )}

          {error && <p className="text-xs font-semibold text-rose-500">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 py-2.5 text-sm font-bold text-white shadow-md hover:from-indigo-500 hover:to-violet-500 transition-all"
          >
            進入牆面 ⚡
          </button>
        </form>
      </div>
    </div>
  );
}