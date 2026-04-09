import { useComposedRefs } from "@/lib/compose-refs";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { useCallback, useRef, useState } from "react";

export type ResizablePanelProps = React.PropsWithChildren<React.ComponentProps<typeof motion.div>>;
export function ResizablePanel({ ref, className, children, ...props }: ResizablePanelProps) {
   const areaRef = useRef<HTMLDivElement>(null);
   const handlerRef = useRef<HTMLSpanElement>(null);
   const [height, setHeight] = useState<number | undefined>(320);

   const [open, setOpen] = useState(false);
   const [, setAnimating] = useState(false);

   const refs = useComposedRefs(ref, areaRef);

   const handlePointerDown = useCallback((e: React.PointerEvent<HTMLSpanElement>) => {
      const posY = e.clientY;
      let deltaY = 0;
      function handlePointerMove(e: PointerEvent) {
         deltaY = e.clientY - posY;
         if (handlerRef.current) handlerRef.current.style.translate = `0px ${deltaY}px`;
      }

      window.addEventListener("pointermove", handlePointerMove);

      function handleEnd() {
         if (areaRef.current) {
            const rect = areaRef.current?.getBoundingClientRect();
            setHeight(rect.height - deltaY);
            setAnimating(true);
         }
         if (handlerRef.current) handlerRef.current.style.translate = `0px 0px`;
         window.removeEventListener("pointermove", handlePointerMove);
         window.removeEventListener("pointerup", handleEnd);
         window.removeEventListener("blur", handleEnd);
      }

      window.addEventListener("pointerup", handleEnd);
      window.addEventListener("blur", handleEnd);
   }, []);

   return (
      <motion.div
         initial={{ opacity: 0, y: "110%", height: 0 }}
         animate={{ opacity: 1, y: "0%", height }}
         data-slot="area"
         onAnimationComplete={() => setOpen(true)}
         className={cn("relative bottom-0", className)}
         {...props}
         transition={{
            type: "spring",
            stiffness: 400,
            damping: 40,
         }}
         style={{ ...props.style }}
         ref={refs}
      >
         {/* {!animating ? children : null} */}
         {open ? children : null}
         <span
            data-slot="handler"
            className="hover:bg-primary bg-border absolute -top-px left-0 z-100 h-px w-full cursor-ns-resize rounded-full before:absolute before:inset-x-0 before:-inset-y-1 hover:h-0.5"
            onPointerDown={handlePointerDown}
            ref={handlerRef}
         />
      </motion.div>
   );
}
