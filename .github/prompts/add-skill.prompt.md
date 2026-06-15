---
description: "新增一個雙邊（Copilot + Claude Code）通用的 skill / 規則"
---

# 任務：新增 skill（同步建立 Copilot instruction + Claude skill）

本 repo 同時服務 Copilot 與 Claude Code 學生，新增規則時兩邊都要建檔。

## 步驟

1. 詢問我四件事：
   - `name`（kebab-case，例如 `classwall-realtime`）
   - 這個規則「何時該觸發」（檔案類型 / 關鍵字 / 場景）
   - 規則內容（守則、checklist、好 / 壞範例）
   - 觸發範圍：**全域**（整個 repo）還是**檔案層級**（特定 glob）

2. 建立 **Copilot instruction**：`.github/instructions/<name>.instructions.md`

   ```markdown
   ---
   applyTo: "<glob,glob,...>"
   description: "<一句話描述>"
   ---

   # <Title>

   ## 規則
   ...

   ## 範例
   ❌ 錯誤：...
   ✅ 正確：...
   ```

3. 建立 **Claude skill**：`.agents/skills/<name>/SKILL.md`

   ```markdown
   ---
   name: <name>
   description: <做什麼>。Triggers when user (1) ..., (2) ..., (3) .... Does NOT trigger for ...
   version: 1.0
   ---

   # <Title>

   <與 Copilot instruction 等價的內容，但改成 Claude 自然語言敘述>
   ```

   **description 一定要寫 "Triggers when (1)...(2)...(3)..." 格式**，Claude 用這欄判斷觸發。

4. 建立 symlink：

   ```bash
   cd .claude/skills && ln -s ../../.agents/skills/<name> <name>
   ```

5. 如果是**全域規則**，順手在 `.github/copilot-instructions.md` 的 Critical rules 區塊加一條引用（一行即可），並更新 `AGENTS.md` 對應段落。

6. 印出三個檔案的 diff 與建議的 commit message：

   ```
   feat(skills): add <name> guard for both Copilot and Claude
   ```

## 規範

- **AGENTS.md 是 source of truth**，全域規則若與其他檔衝突，先改 AGENTS.md
- description 觸發詞要具體（檔名、關鍵字、API 名），避免「寫程式時」這種模糊描述
- 範例一定要有「❌ 錯誤 / ✅ 正確」對照，學生才看得懂
- 註解、文案用繁體中文；變數名、function 名用英文
- 不要在 SKILL.md 寫長篇大論，超過 ~150 行就拆 `rules/*.md` 子檔（參考 `.agents/skills/vercel-react-best-practices/`）
