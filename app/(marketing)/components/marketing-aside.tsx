"use client";

import { buttonVariants } from "@/components/ui/button";
import { useOpen, useOpenToggle } from "@/contexts/open-context";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { SIDEBAR_ENTRANCE_DURATION, SIDEBAR_EXIT_DURATION, SIDEBAR_SIZE } from "./constants";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useEvent } from "@/hooks/use-event";
import { isFocusedOnElement } from "@/lib/is-focused-on-element";

export const variants = {
   hidden: {
      x: 0,
      y: 0,
      opacity: 0,
      filter: "blur(3px)",
   },
   visible: {
      x: 0,
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
   },
};

const GROUPED_AUTHENTICATED_ROUTES = [
   [
      { id: "dashboard", label: "Dashboard", href: "/dashboard" },
      { id: "databases", label: "Databases", href: "/databases" },
      { id: "terminals", label: "Terminals", href: "/terminals" },
      // { id: "databases", label: "Databases", href: "/databases" },
   ],
];

const GROUPED_UNAUTHENTICATED_ROUTES = [
   [
      { id: "sign-in", label: "Sign in", href: "/auth/sign-in" },
      { id: "sign-up", label: "Sign up", href: "/auth/sign-up" },
      // { id: "databases", label: "Databases", href: "/databases" },
   ],
];

const GROUPED_ROUTES = [
   [
      { id: "home", label: "Home", href: "/" },
      { id: "about", label: "About", href: "/about" },
      { id: "contact", label: "Contact", href: "/contact" },
   ],
];

export default function MarketingAside() {
   // const { data: session } = useSession();
   const session = {
      user: {
         id: "1",
         name: "John doe",
         email: "https.braganca@gmail.com",
         image: "https://example.com/image.jpg",
      },
   };

   const open = useOpen();
   const toggleOpen = useOpenToggle();

   const pathname = usePathname();
   const maxWidth = SIDEBAR_SIZE;
   const translateX = open ? 0 : -maxWidth;

   const [hover, setHover] = useState<string | null>(null);

   useEvent(
      "keydown",
      (e: Event) => {
         if (!(e instanceof KeyboardEvent)) return;
         if (e.key === "s" && !e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
            if (isFocusedOnElement()) return;
            e.preventDefault();
            toggleOpen?.(!open);
         }
      },
      [open],
   );

   return (
      <motion.aside
         layout
         initial={{
            maxWidth: 0,
            translateX,
         }}
         animate={{
            maxWidth,
            translateX,
         }}
         transition={{
            type: "spring",
            duration: open ? SIDEBAR_ENTRANCE_DURATION : SIDEBAR_EXIT_DURATION,
            bounce: 0.1,
         }}
         className="fixed top-0 left-0 h-full w-full overflow-visible overflow-y-auto px-5 pt-28"
      >
         <ul className="flex flex-col gap-2 sm:gap-4">
            {[...GROUPED_ROUTES, ...(session ? GROUPED_AUTHENTICATED_ROUTES : GROUPED_UNAUTHENTICATED_ROUTES)].map(
               (routes, index) => (
                  <div
                     role="group"
                     key={index}
                     className="flex flex-col"
                     onBlur={() => setHover(null)}
                     onMouseLeave={() => setHover(null)}
                  >
                     {routes.map((route) => (
                        <li
                           key={route.label}
                           className="group relative"
                           onFocus={() => setHover(route.id)}
                           onMouseEnter={() => setHover(route.id)}
                        >
                           <AnimatePresence>
                              {hover === route.id ? (
                                 <motion.span
                                    layoutId="marketing-sidebar-selector"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.1 }}
                                    className="pointer-events-none absolute inset-0 block rounded-md bg-gray-200"
                                 />
                              ) : null}
                           </AnimatePresence>
                           <Link
                              tabIndex={open ? 0 : -1}
                              aria-pressed={pathname === route.href}
                              data-state={pathname === route.href ? "active" : hover === route.id ? "hover" : "idle"}
                              href={route.href}
                              className={buttonVariants({
                                 intent: "item",
                                 size: "sm",
                                 className:
                                    "data-[state=hover]:text-foreground relative z-10 w-full justify-start text-left",
                              })}
                              onClick={() => toggleOpen?.(false)}
                           >
                              {route.label}
                           </Link>
                        </li>
                     ))}
                  </div>
               ),
            )}
         </ul>
      </motion.aside>
   );
}
