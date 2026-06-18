"use client";

import { AnimatePresence, motion } from "motion/react";
import { memo, useEffect, useRef, useState } from "react";

import { AnswerSection } from "@/components/answer-section";
import { getAnonId } from "@/lib/anon-id";
import { addLiked, hasLiked, addDisliked, hasDisliked } from "@/lib/liked-store";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import type { Question } from "@/types/database";

type Props = {
  question: Question;
};

// 按讚瞬間的粒子噴發角度
const PARTICLES = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * Math.PI * 2 + Math.random() * 0.4;
  const distance = 28 + Math.random() * 18;
  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
    delay: Math.random() * 0.05,
  };
});

function QuestionCardImpl({ question }: Props) {
  const [pending, setPending] = useState(false);
  const [alreadyLiked, setAlreadyLiked] = useState(false);
  const [pendingDislike, setPendingDislike] = useState(false);
  const [alreadyDisliked, setAlreadyDisliked] = useState(false);
  const [burstKey, setBurstKey] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const isHot = question.likes >= 5;

  const tiltRef = useRef<HTMLDivElement>(null);
  const rafIdRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    setAlreadyLiked(hasLiked(question.id));
    setAlreadyDisliked(hasDisliked(question.id));
  }, [question.id]);

  useEffect(() => {
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  function handleMouseMove(event: React.MouseEvent<HTMLElement>) {
    const el = tiltRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = requestAnimationFrame(() => {
      const rotateX = (-y * 8).toFixed(2);
      const rotateY = (x * 8).toFixed(2);
      el.style.transform = `perspective(1000px) translateY(-5px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });
  }

  function handleMouseLeave() {
    const el = tiltRef.current;
    if (!el) return;
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    el.style.transform = "";
  }

  async function handleLike() {
    if (pending || alreadyLiked) return;
    setPending(true);
    const { error } = await supabase.rpc("increment_question_like", {
      qid: question.id,
      anon: getAnonId(),
    });
    setPending(false);
    if (error) {
      console.error("按讚失敗", error);
      return;
    }
    addLiked(question.id);
    setAlreadyLiked(true);
    setBurstKey((k) => k + 1);
  }

  async function handleDisagree() {
    if (pendingDislike || alreadyDisliked) return;
    setPendingDislike(true);
    const { error } = await supabase.rpc("increment_question_dislike", {
      qid: question.id,
      anon: getAnonId(),
    });
    setPendingDislike(false);
    if (error) {
      console.error("反對失敗", error);
      return;
    }
    addDisliked(question.id);
    setAlreadyDisliked(true);
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 280, damping: 26 }}
    >
      <div
        ref={tiltRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "group relative overflow-hidden rounded-2xl p-6 sm:p-7",
          "transition-all duration-300 will-change-transform",
          // ─── 顏色美化核心：改用極具質感的太空深色底，或帶有玻璃質感的純白 ───
          "bg-white/90 dark:bg-slate-900/80 text-slate-800 dark:text-slate-100",
          "border border-slate-200/60 dark:border-slate-800/80",
          // 懸停時的超帥霓虹微光與浮起特效
          "hover:scale-[1.02] hover:shadow-2xl hover:shadow-indigo-500/10 dark:hover:shadow-violet-500/10",
          "hover:bg-linear-to-r hover:from-indigo-500/5 hover:to-transparent hover:gradient-flow",
          isHot && "border-amber-500/40 shadow-amber-500/5"
        )}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* 左側邊緣的流光裝飾條 */}
        <span
          aria-hidden
          className={cn(
            "absolute left-0 top-0 bottom-0 w-[4px] transition-colors duration-300",
            isHot 
              ? "bg-linear-to-b from-amber-400 via-rose-500 to-orange-400" 
              : "bg-transparent group-hover:bg-indigo-500"
          )}
        />

        <p className={cn("whitespace-pre-wrap text-[15px] leading-[1.8] sm:text-base font-medium")}>
          {isHot ? (
            <motion.span
              aria-hidden
              className="mr-2 inline-block origin-center"
              animate={{ rotate: [-8, 10, -8] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            >
              🔥
            </motion.span>
          ) : (
            <span className="mr-2 text-indigo-500 dark:text-indigo-400 font-bold">#</span>
          )}
          {question.content}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono tracking-wider text-slate-400 dark:text-slate-500">
              {new Date(question.created_at).toLocaleString("zh-TW", {
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <motion.button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "inline-flex min-h-10 items-center gap-1.5 rounded-xl px-3.5 py-1.5",
                "text-xs font-semibold transition-all duration-200",
                expanded
                  ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/60"
                  : "bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800 hover:border-indigo-500/50 hover:text-indigo-500"
              )}
            >
              <span>{expanded ? "收起討論" : "查看回覆"}</span>
              <motion.span
                aria-hidden
                animate={{ rotate: expanded ? 180 : 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="inline-block text-[10px]"
              >
                ▼
              </motion.span>
            </motion.button>
          </div>

          <div className="relative">
            {/* 粒子噴發層 */}
            {burstKey > 0 ? (
              <span
                key={burstKey}
                aria-hidden
                className="pointer-events-none absolute inset-0 flex items-center justify-center"
              >
                {PARTICLES.map((p, i) => (
                  <motion.span
                    key={i}
                    initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                    animate={{ x: p.x, y: p.y, opacity: 0, scale: 0.4 }}
                    transition={{ duration: 0.6, delay: p.delay, ease: "easeOut" }}
                    className="absolute h-1.5 w-1.5 rounded-full bg-linear-to-br from-indigo-400 to-violet-500"
                  />
                ))}
                <motion.span
                  initial={{ y: 0, opacity: 0, scale: 0.8 }}
                  animate={{ y: -30, opacity: [0, 1, 0], scale: 1.1 }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  className="absolute text-xs font-bold text-indigo-500"
                >
                  +1 連署
                </motion.span>
              </span>
            ) : null}

            <motion.button
              type="button"
              onClick={handleLike}
              disabled={pending || alreadyLiked}
              whileTap={alreadyLiked ? undefined : { scale: 0.94 }}
              className={cn(
                "relative inline-flex min-h-10 items-center gap-2 rounded-xl px-4 py-2",
                "text-xs font-bold tracking-wide transition-all duration-300 shadow-sm",
                // ─── 按鈕顏色美化 ───
                alreadyLiked
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-transparent cursor-not-allowed"
                  : "bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white border border-transparent hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 cursor-pointer"
              )}
            >
              <span aria-hidden>{alreadyLiked ? "✓" : "⚡"}</span>
              <span>
                {alreadyLiked ? "已參與附議" : "附議連署"} ·{" "}
                <motion.span
                  key={question.likes}
                  initial={{ y: -4, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="inline-block tabular-nums font-mono"
                >
                  {question.likes}
                </motion.span>
              </span>
            </motion.button>
            <motion.button
              type="button"
              onClick={handleDisagree}
              disabled={pendingDislike || alreadyDisliked}
              whileTap={alreadyDisliked ? undefined : { scale: 0.94 }}
              className={cn(
                "ml-3 relative inline-flex min-h-10 items-center gap-2 rounded-xl px-4 py-2",
                "text-xs font-bold tracking-wide transition-all duration-300 shadow-sm",
                alreadyDisliked
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-transparent cursor-not-allowed"
                  : "bg-linear-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-500 text-white border border-transparent hover:shadow-lg hover:shadow-rose-500/20 active:scale-95 cursor-pointer"
              )}
            >
              <span aria-hidden>{alreadyDisliked ? "✓" : "👎"}</span>
              <span>
                {alreadyDisliked ? "已表達不同意" : "不同意"} ·{" "}
                <motion.span
                  key={question.dislikes}
                  initial={{ y: -4, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="inline-block tabular-nums font-mono"
                >
                  {question.dislikes}
                </motion.span>
              </span>
            </motion.button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {expanded ? (
            <motion.div
              key="answers"
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden mt-4"
            >
              <AnswerSection questionId={question.id} />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.article>
  );
}

export const QuestionCard = memo(QuestionCardImpl, (prev, next) => {
  return (
    prev.question.id === next.question.id &&
    prev.question.likes === next.question.likes &&
    prev.question.dislikes === next.question.dislikes &&
    prev.question.content === next.question.content &&
    prev.question.created_at === next.question.created_at
  );
});