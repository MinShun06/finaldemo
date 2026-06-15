---
name: classwall-realtime
description: ClassWall Supabase Realtime channel cleanup 守則。Triggers when user (1) 編輯或新增包含 `supabase.channel(` 的檔案, (2) 提到「realtime」/「subscribe」/「postgres_changes」/「channel」, (3) 在 useEffect 裡操作 Supabase subscription, (4) 新增需要即時更新的頁面或 component. Does NOT trigger for 一般 useEffect 使用或非 Supabase 的 WebSocket / EventSource.
version: 1.0
---

# ClassWall Realtime Cleanup

ClassWall 用 Supabase Realtime 同步 `questions` / `answers` 兩張表。處理 channel 訂閱時務必遵守以下守則，否則會造成記憶體洩漏與重複觸發。

## 核心規則

1. **每個 `supabase.channel(...)` 都要對應一個 `supabase.removeChannel(channel)`**，寫在 `useEffect` 的 cleanup function 裡
2. **channel 名稱用 namespace 格式**：`<feature>:<purpose>`，例如 `questions:list`、`answers:detail`
3. **同一個 component 不要開重複 channel**，需要監聽多張表時用同一個 channel `.on(...)` 串接
4. **檔案頂部要有 `"use client"`**（Realtime 只能在 browser 端跑）

## 範例

❌ **錯誤**：沒有 cleanup
```ts
"use client";
useEffect(() => {
  supabase
    .channel("x")
    .on("postgres_changes", { event: "*", schema: "public", table: "questions" }, handler)
    .subscribe();
}, []);
```

❌ **錯誤**：channel 名稱沒有 namespace、開重複
```ts
useEffect(() => {
  const c1 = supabase.channel("a").on(...).subscribe();
  const c2 = supabase.channel("b").on(...).subscribe();
  return () => { supabase.removeChannel(c1); supabase.removeChannel(c2); };
}, []);
```

✅ **正確**：cleanup + namespace + 單一 channel 串接
```ts
"use client";
useEffect(() => {
  const channel = supabase
    .channel("questions:list")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "questions" },
      handleQuestionInsert
    )
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "answers" },
      handleAnswerInsert
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

## Reviewer Checklist

新增 / 修改包含 Realtime 的程式碼時逐項確認：

- [ ] 每個 `.channel(...)` 都有對應的 `removeChannel`
- [ ] channel 名稱用 `<feature>:<purpose>` 格式
- [ ] 同一個 component 只開一個 channel，多表用 `.on().on()` 串接
- [ ] 檔案頂部有 `"use client"`
- [ ] `useEffect` 的 dependency array 不包含會頻繁變動的物件（避免重複訂閱）
- [ ] 對應 table 已加入 publication：`alter publication supabase_realtime add table <name>;`

## 相關檔案

- 標準範例：`src/app/page.tsx`（首頁 questions / answers realtime）
- Copilot 對應規則：`.github/instructions/supabase.instructions.md`（Realtime channel 區段）
- AGENTS.md 對應段落：「Conventions → Supabase」與「Code style」

## 為什麼這條規則重要

教學情境學生常見錯誤：
1. 複製 useEffect 範例但漏抄 cleanup → dev server 熱更新後 channel 越疊越多
2. channel 名稱隨便取（"x"、"a"）→ 多個 component 撞名互相覆蓋
3. 想監聽兩張表就開兩個 channel → 配額浪費、cleanup 也容易漏一個
