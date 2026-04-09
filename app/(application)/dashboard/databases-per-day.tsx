"use client";

import { DAY_DURATION } from "@/constants/globals";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, MotionStyle, useSpring } from "motion/react";
import React, { CSSProperties, useState } from "react";

interface Props {
   data: { created_at: Date }[];
   since: Date;
   range: number;
}

const TICK_WIDTH = 2;
const TICK_GAP = 6;

function getMonth(timestamp: number) {
   const date = new Date(timestamp);

   const year = date.getFullYear();
   const month = date.getMonth(); // 0-11

   const today = new Date();
   const start = new Date(year, month, 1, 0, 0, 0, 0);
   const tempEnd = new Date(year, month + 1, 0, 0, 0, 0, 0);

   const end = new Date(Math.min(tempEnd.getTime(), Math.floor(today.getTime() / DAY_DURATION) * DAY_DURATION));

   const difference = end.getTime() - start.getTime();
   const days = difference / DAY_DURATION + 1;

   return { start, end, difference, days };
}

export default function DatabasesPerDay({ data, since, range }: Props) {
   const sinceTime = since.getTime();

   const [pressed, setPressed] = useState(false);
   const [activeIndex, setActiveIndex] = useState<number | null>(null);
   const [count, setCount] = useState(0);
   const ref = React.useRef<HTMLDivElement>(null);

   const x = useSpring(0, { stiffness: 600, damping: 50 });
   const [width, setWidth] = useState(0);

   function getSnappedIndex(pointerX: number) {
      const pointerSnappedIndex = Math.floor(pointerX / (TICK_WIDTH + TICK_GAP));
      return Math.min(Math.max(pointerSnappedIndex, 0), range);
   }

   function handlePointer(e: React.PointerEvent<HTMLDivElement>) {
      const rect = e.currentTarget.getBoundingClientRect();
      const pointerX = e.clientX - rect.left + e.currentTarget.scrollLeft - (16 - TICK_WIDTH);
      const pointerSnappedIndex = getSnappedIndex(pointerX);

      const index = Math.floor(pointerSnappedIndex);
      setActiveIndex(index);
      x.set(index * (TICK_WIDTH + TICK_GAP));

      const start = new Date(sinceTime + pointerSnappedIndex * DAY_DURATION);
      const end = new Date(sinceTime + (pointerSnappedIndex + 1) * DAY_DURATION);

      setCount(
         data.filter((x) => x.created_at.getTime() >= start.getTime() && x.created_at.getTime() < end.getTime()).length,
      );
   }

   function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
      if (e.pointerType === "touch") return;
      setPressed(false);
      handlePointer(e);
      setWidth(0);
   }

   function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
      if (e.pointerType === "touch") return;
      setPressed(true);

      const rect = e.currentTarget.getBoundingClientRect();
      const pointerX = e.clientX - rect.left + e.currentTarget.scrollLeft - (16 - TICK_WIDTH);
      const pointerSnappedIndex = getSnappedIndex(pointerX);

      const activeTimestamp = since.getTime() + pointerSnappedIndex * DAY_DURATION;
      const { start, end, days } = getMonth(activeTimestamp);

      const index = Math.floor(start.getTime() - since.getTime()) / DAY_DURATION;
      setActiveIndex(index);

      setCount(
         data.filter((x) => x.created_at.getTime() >= start.getTime() && x.created_at.getTime() <= end.getTime())
            .length,
      );

      x.set(index * (TICK_WIDTH + TICK_GAP));
      setWidth(days * (TICK_WIDTH + TICK_GAP));
   }

   function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
      if (pressed || e.pointerType === "touch") return;
      handlePointer(e);
   }

   return (
      <div
         data-slot="container"
         style={{ gap: TICK_GAP }}
         className="relative -m-4 mb-0 flex min-h-48 items-end overflow-auto p-4 pb-2"
         onPointerLeave={(e) => {
            if (e.pointerType === "touch") return;
            setActiveIndex(null);
         }}
         onPointerEnter={(e) => {
            if (e.pointerType === "touch") return;

            const rect = e.currentTarget.getBoundingClientRect();
            const pointerX = e.clientX - rect.left + e.currentTarget.scrollLeft - (16 - TICK_WIDTH);
            const pointerSnappedIndex = getSnappedIndex(pointerX);

            const index = Math.floor(pointerSnappedIndex);
            setActiveIndex(index);
            x.jump(index * (TICK_WIDTH + TICK_GAP));
         }}
         onPointerDown={onPointerDown}
         onPointerUp={onPointerUp}
         onPointerMove={onPointerMove}
      >
         {new Array(range + 1).fill(null).map((_, index) => {
            const start = sinceTime + index * DAY_DURATION;
            const end = sinceTime + (index + 1) * DAY_DURATION;

            const filtered = data.filter((x) => x.created_at.getTime() >= start && x.created_at.getTime() < end);

            const count = filtered?.length ?? 0;

            const multiplier = 1.5;
            const base = new Date(start).getDate() === 1 ? multiplier * 2 : multiplier;
            const height = `${Math.max(count * multiplier, base)}rem`;

            const background = count ? "var(--color-primary)" : "var(--color-gray-400";

            return (
               <span
                  key={"tick-" + index}
                  data-slot="tick"
                  data-index={index}
                  data-count={count}
                  style={
                     {
                        "--count": count,
                        height,
                        minWidth: TICK_WIDTH,
                        maxWidth: TICK_WIDTH,
                        background,
                     } as CSSProperties
                  }
                  className="inline-block"
               />
            );
         })}

         <AnimatePresence>
            {pressed ? (
               <motion.span
                  style={{ x }}
                  initial={{ opacity: 0.3, width: 0 }}
                  animate={{ opacity: 1, width }}
                  exit={{ opacity: 0, width: 0 }}
                  className="bg-primary/20 border-primary absolute inset-y-0 block h-full w-full border-r"
               />
            ) : null}
         </AnimatePresence>
         <AnimatePresence mode="sync">
            {activeIndex !== null && (
               <motion.div
                  ref={ref}
                  style={{ x, width: TICK_WIDTH } as MotionStyle}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "tween", ease: "easeInOut", duration: 0.1 }}
                  className={cn("bg-primary pointer-events-none absolute top-0 bottom-0 transition-colors")}
               >
                  <p
                     className={cn(
                        "pointer-events-none absolute top-1 left-full text-start text-xs whitespace-nowrap text-gray-900 duration-300",
                        activeIndex >= range - 15 ? "-ml-2 -translate-x-full" : "ml-2",
                     )}
                  >
                     Created {count}
                  </p>

                  <p
                     data-slot="selected-date"
                     className={cn(
                        "pointer-events-none absolute top-5 left-full flex flex-col text-xs whitespace-nowrap text-gray-600 duration-300",
                        activeIndex >= range - 15 ? "-ml-2 -translate-x-full" : "ml-2",
                     )}
                  >
                     <span>
                        {new Date(sinceTime + activeIndex * DAY_DURATION).toLocaleDateString(undefined, {
                           day: "2-digit",
                           month: "short",
                           year: "2-digit",
                        })}
                     </span>
                     {pressed && (
                        <span>
                           {new Date(
                              sinceTime +
                                 activeIndex * DAY_DURATION +
                                 (width / (TICK_WIDTH + TICK_GAP) - 1) * DAY_DURATION,
                           ).toLocaleDateString(undefined, {
                              day: "2-digit",
                              month: "short",
                              year: "2-digit",
                           })}
                        </span>
                     )}
                  </p>
               </motion.div>
            )}
         </AnimatePresence>
      </div>
   );
}
