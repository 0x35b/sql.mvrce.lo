"use client";

import Button, { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
   ChevronRight,
   Database,
   Loader2,
   MoreVertical,
   Pencil,
   Plus,
   Search,
   Table2,
   Trash2,
   X,
   Zap,
   ZapOff,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import AddDatabaseDialog from "@/components/add-database-dialog";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuLabel,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { getDatabases, GetDatabasesReturn } from "@/models/databases";
import { toast } from "sonner";
import Link, { useLinkStatus } from "next/link";
import { AnimatePresence, motion, useReducedMotion, Variants } from "motion/react";
import Expand from "@/components/ui/expand";
import { cn } from "@/lib/utils";
import { useParams, usePathname } from "next/navigation";
import { useDatabasesStore } from "@/stores/databases";
import { isFocusedOnElement } from "@/lib/is-focused-on-element";
import { useEvent } from "@/hooks/use-event";
import { useStorage } from "@/hooks/use-storage";
import { useIsMobile } from "@/hooks/use-mobile";

export default function DatabasesSidebar() {
   const isMobile = useIsMobile();
   const [search, setSearch] = useState<null | string>(null);

   const { find, connect } = useDatabasesStore();
   const addButton = useRef<HTMLButtonElement>(null);

   const params = useParams<{ id: string; table: string }>();
   const {
      data: databases,
      isLoading,
      refetch,
   } = useQuery({
      queryKey: ["databases"],
      queryFn: async () => {
         const [databases, error] = await getDatabases();

         if (error) {
            const status = error?.data ? JSON.parse(error?.data).status : undefined;
            if (status === 401) {
               const id = toast(error.message, {
                  action: (
                     <Link
                        href="/auth/sign-in"
                        onClick={() => {
                           toast.dismiss(id);
                        }}
                        className={buttonVariants({
                           intent: "none",
                           size: "xs",
                           className:
                              "ml-auto border border-gray-600 bg-gray-900 text-gray-300 hover:bg-gray-800 hover:text-gray-100 dark:border-gray-400 dark:bg-gray-100 dark:text-gray-700 dark:hover:bg-gray-200 dark:hover:text-gray-900",
                        })}
                     >
                        Sign in
                     </Link>
                  ),
               });
            } else {
               toast.error(error.message ?? "An non expected error happened");
            }

            return [];
         }

         return databases;
      },
      retry: 2,
   });

   useEffect(() => {
      if (!params) return;

      const id = params.id;
      if (typeof id !== "string") return;

      connect(id);
   }, [params, connect, databases]);

   const [hide, setHide] = useStorage<boolean>("sub-sidebar", false);

   useEvent(
      "keydown",
      (e: Event) => {
         if (!(e instanceof KeyboardEvent)) return;
         if (e.key.toLowerCase() === "s" && !e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
            if (isFocusedOnElement()) return;
            e.preventDefault();
            setHide(!hide);
         }
      },
      [hide],
   );

   const isReduced = useReducedMotion();
   const variants: Variants = useMemo(() => {
      if (isReduced) {
         return {
            hidden: { marginLeft: isMobile ? 0 : "-18rem", translateY: 0, opacity: 0, filter: "blur(0px)" },
            visible: { marginLeft: 0, translateY: 0, opacity: 1, filter: "blur(0px)" },
         };
      }

      if (isMobile) {
         return {
            hidden: { marginLeft: 0, translateY: "110%", opacity: 0, filter: "blur(4px)" },
            visible: { marginLeft: 0, translateY: "0%", opacity: 1, filter: "blur(0px)" },
         };
      }

      return {
         hidden: {
            marginLeft: "-18rem",
            translateY: 0,
            opacity: 0,
            filter: "blur(4px)",
         },
         visible: { marginLeft: 0, translateY: 0, opacity: 1, filter: "blur(0px)" },
      };
   }, [isMobile, isReduced]);

   if (typeof window === "undefined") return null;

   return (
      <AnimatePresence>
         {hide ? null : (
            <motion.aside
               layout
               initial="hidden"
               animate="visible"
               exit="hidden"
               variants={variants}
               transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 37,
               }}
               className={cn(
                  "isolate flex shrink-0 grow flex-col self-stretch overflow-hidden",
                  isMobile
                     ? "bg-background xs:max-w-80 max-xs:left-2 xs:w-full absolute top-22.25 right-2 bottom-12.5 z-50 rounded-lg border"
                     : "max-h-svh w-full max-w-72",
               )}
            >
               {/* <div className="h-11 self-stretch border-b border-b-border" /> */}
               {search === null ? (
                  <div className="flex items-center justify-between gap-4 p-1">
                     <span className="px-2 text-sm font-semibold text-gray-800 uppercase">Databases</span>
                     <div className="flex items-center">
                        <AddDatabaseDialog onSuccess={() => refetch()}>
                           <Button intent="ghost" size="none" className="size-8 shrink-0" ref={addButton}>
                              <Plus className="size-4 shrink-0" />
                           </Button>
                        </AddDatabaseDialog>
                        <Button
                           intent="ghost"
                           size="none"
                           className="size-8 shrink-0"
                           onClick={() => {
                              setSearch("");
                           }}
                        >
                           <Search className="size-4 shrink-0" />
                        </Button>
                     </div>
                  </div>
               ) : (
                  <div className="flex items-center gap-1 p-1">
                     <Input
                        autoFocus
                        intent="opaque"
                        size="sm"
                        onChange={(e) => setSearch(e.currentTarget.value)}
                        value={search ?? ""}
                     />
                     <Button
                        intent="ghost"
                        size="none"
                        className="size-8 shrink-0"
                        onClick={() => {
                           setSearch(null);
                        }}
                     >
                        <X className="size-4 shrink-0" />
                     </Button>
                  </div>
               )}
               {/* <SidebarSearch /> */}
               <ul role="list" className="flex grow flex-col gap-1 self-stretch overflow-auto p-1">
                  {isLoading || !databases?.length ? (
                     <div className="m-auto flex flex-col items-center gap-4">
                        <span className="p-2 text-gray-500">
                           <Database className="size-6 shrink-0" />
                        </span>
                        <Button intent="ghost" size="xs" className="gap-2" onClick={() => addButton?.current?.click()}>
                           <Plus className="size-4 shrink-0" />
                           <span className="font-normal">Add a database first.</span>
                        </Button>
                     </div>
                  ) : (
                     databases
                        ?.filter((x) => {
                           if (!search?.length) return true;
                           return x.name.toLowerCase().includes(search?.toLowerCase());
                        })
                        ?.map((database) => {
                           const found = find(database.id);
                           const state = found?.status ?? "disconnected";
                           return <Item state={state} database={database} key={database.id} />;
                        })
                  )}
               </ul>
            </motion.aside>
         )}
      </AnimatePresence>
   );
}

function Item({ database, state }: { database: GetDatabasesReturn[number]; state: string }) {
   const { find, connect, disconnect } = useDatabasesStore();
   const found = find(database.id);
   const pathname = usePathname();

   return (
      <Expand.Root defaultOpen={false} open={state !== "connected" ? false : undefined} key={database.id}>
         <li
            role="listitem"
            data-state={state}
            className="group data-sta flex flex-col rounded text-sm transition-colors hover:bg-gray-100 has-[button[aria-pressed='true']]:bg-gray-100 has-[button[aria-pressed='true']]:[--display:flex]"
         >
            <div className="has-[button[aria-pressed='true']]:peer/title flex h-8 items-center justify-start gap-1 px-1">
               <Expand.Trigger
                  disabled={state === "connecting"}
                  intent="ghost"
                  size="none"
                  className="group/toggle peer/toggle size-6 rounded-sm bg-transparent"
                  onPressedChange={(pressed) => {
                     if (!pressed || found || state === "connecting" || state === "connected") return;
                     connect(database.id);
                  }}
               >
                  {state === "connecting" ? (
                     <Loader2 className="size-4 shrink-0 animate-spin" />
                  ) : (
                     <ChevronRight className="size-4 shrink-0 duration-150 group-aria-pressed/toggle:rotate-90" />
                  )}
               </Expand.Trigger>

               <span
                  className={cn(
                     "truncate text-gray-800",
                     state === "connecting" ? "pointer-events-none opacity-50" : null,
                  )}
               >
                  {database.name}
               </span>
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button
                        intent="ghost"
                        size="none"
                        className="aria-expanded:text-foreground ml-auto size-6 rounded-sm text-gray-500 hover:text-gray-700 aria-expanded:bg-gray-200"
                     >
                        <MoreVertical className="size-4 shrink-0 duration-150" />
                     </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                     <DropdownMenuLabel>Actions</DropdownMenuLabel>
                     {state === "disconnected" ? (
                        <>
                           <DropdownMenuItem
                              className="gap-2"
                              onSelect={() => {
                                 connect(database.id);
                              }}
                           >
                              <Zap className="size-4 shrink-0" />
                              Connect
                           </DropdownMenuItem>
                        </>
                     ) : state === "connected" ? (
                        <DropdownMenuItem
                           className="gap-2"
                           onSelect={() => {
                              disconnect(database.id);
                           }}
                        >
                           <ZapOff className="size-4 shrink-0" />
                           Disconnect
                        </DropdownMenuItem>
                     ) : null}

                     {/* <DropdownMenuItem>
			   <Spline className="size-4 shrink-0" />
			   Duplicate
			</DropdownMenuItem>
			<DropdownMenuItem>
			   <Star className="size-4 shrink-0" />
			   Favorite
			</DropdownMenuItem>
			<DropdownMenuItem>
			   <Share className="size-4 shrink-0" />
			   Share
			   </DropdownMenuItem>
			   <DropdownMenuSeparator /> */}
                     {state === "disconnected" ? (
                        <>
                           <DropdownMenuSeparator />
                           <DropdownMenuItem className="gap-2">
                              <Pencil className="size-4 shrink-0" />
                              Modify
                           </DropdownMenuItem>
                           <DropdownMenuItem>
                              <Trash2 className="size-4 shrink-0" />
                              Delete
                           </DropdownMenuItem>
                        </>
                     ) : null}
                  </DropdownMenuContent>
               </DropdownMenu>
            </div>

            <Expand.Content className="p-1 pl-4">
               {/* Tables */}
               <Expand.Root defaultOpen={false}>
                  <div
                     aria-selected={pathname.startsWith(`/databases/${database.id}/table`)}
                     className="group aria-selected:!bg-primary/15 flex h-8 items-center gap-1 rounded px-1 duration-150 hover:bg-gray-200 has-[button[aria-pressed='true']]:bg-gray-200"
                  >
                     <Expand.Trigger
                        intent="ghost"
                        size="none"
                        className="group/toggle group-aria-selected:hover:bg-primary/15 size-6 rounded-sm bg-transparent"
                     >
                        <ChevronRight className="group-aria-selected:text-primary-hover size-4 shrink-0 duration-150 group-aria-pressed/toggle:rotate-90" />
                     </Expand.Trigger>
                     <span className="text-gray-800">Tables</span>
                     {/* <span className="mx-1 block h-1 w-1 rounded-full bg-gray-300" /> */}
                     <span className="self-center text-xs text-gray-600">{found?.tables?.length ?? 0}</span>
                  </div>
                  <Expand.Content>
                     <ul role="list" className="flex grow flex-col self-stretch py-1 pl-4">
                        {found?.tables?.map((table) => {
                           const href = `/databases/${database.id}/table/${table.table_name}`;
                           const selected = pathname.startsWith(href);

                           return (
                              <li key={table?.table_name}>
                                 <Link
                                    href={selected ? pathname : href}
                                    aria-selected={selected}
                                    className={buttonVariants({
                                       intent: "ghost",
                                       size: "xs",
                                       className:
                                          "group aria-selected:bg-primary/15 const aria-selected:hover:bg-primary/30 relative w-full justify-start gap-2 rounded-sm",
                                    })}
                                 >
                                    <Table2 className="group-aria-selected:text-primary-hover size-4 shrink-0 opacity-70 dark:group-aria-selected:text-emerald-400" />
                                    <span className="truncate">{table?.table_name}</span>
                                    <LoadingIndicator />
                                    {/* {pathname === href && <span className="bg-primary ml-auto size-2.5" />} */}
                                 </Link>
                              </li>
                           );
                        })}
                     </ul>
                  </Expand.Content>
               </Expand.Root>

               {/* Views */}
               <Expand.Root defaultOpen={false}>
                  <div className="flex h-8 items-center gap-1 rounded-sm px-1 duration-150 has-[button[aria-pressed='true']]:bg-gray-200">
                     <Expand.Trigger intent="ghost" size="none" className="group/toggle size-6 bg-transparent">
                        <ChevronRight className="size-4 shrink-0 duration-150 group-aria-pressed/toggle:rotate-90" />
                     </Expand.Trigger>
                     <span className="text-gray-800">Views</span>
                     {/* <span className="mx-1 block h-1 w-1 rounded-full bg-gray-300" /> */}
                     <span className="self-center text-xs text-gray-600">{found?.views?.length ?? 0}</span>
                  </div>
                  <Expand.Content>
                     <ul role="list" className="flex grow flex-col self-stretch py-1 pl-4">
                        {found?.views?.map((view) => (
                           <li key={view?.table_name}>
                              <Link
                                 href={`/databases/${database.id}/view/${view.table_name}`}
                                 className={buttonVariants({
                                    intent: "ghost",
                                    size: "xs",
                                    className: "w-full justify-start gap-2 rounded-sm hover:bg-gray-200",
                                 })}
                              >
                                 <Table2 className="size-4 shrink-0 opacity-70" />
                                 <span className="truncate">{view?.table_name}</span>
                                 <LoadingIndicator />
                              </Link>
                           </li>
                        ))}
                     </ul>
                  </Expand.Content>
               </Expand.Root>

               {/* Indexes */}
               <Expand.Root defaultOpen={false}>
                  <div className="flex h-8 items-center gap-1 rounded-sm px-1 duration-150 has-[button[aria-pressed='true']]:bg-gray-200">
                     <Expand.Trigger intent="ghost" size="none" className="group/toggle size-6 bg-transparent">
                        <ChevronRight className="size-4 shrink-0 duration-150 group-aria-pressed/toggle:rotate-90" />
                     </Expand.Trigger>
                     <span className="text-gray-800">Indexes</span>
                     {/* <span className="mx-1 block h-1 w-1 rounded-full bg-gray-300" /> */}
                     <span className="self-center text-xs text-gray-600">{found?.indexes?.length ?? 0}</span>
                  </div>
                  <Expand.Content>
                     <ul role="list" className="flex grow flex-col self-stretch py-1 pl-4">
                        {found?.indexes?.map((index) => (
                           <li key={index.indexname}>
                              <Link
                                 href="#"
                                 // href={`/databases/${database.id}/indexes/${index.indexname}`}
                                 className={buttonVariants({
                                    intent: "ghost",
                                    size: "xs",
                                    className: "w-full justify-start gap-2 rounded-sm hover:bg-gray-200",
                                 })}
                              >
                                 <Table2 className="size-4 shrink-0 opacity-70" />
                                 <span className="truncate">{index.indexname}</span>
                                 <LoadingIndicator />
                              </Link>
                           </li>
                        ))}
                     </ul>
                  </Expand.Content>
               </Expand.Root>

               {/* Sequences */}
               <Expand.Root defaultOpen={false}>
                  <div className="flex h-8 items-center gap-1 rounded-sm px-1 duration-150 has-[button[aria-pressed='true']]:bg-gray-200">
                     <Expand.Trigger intent="ghost" size="none" className="group/toggle size-6 bg-transparent">
                        <ChevronRight className="size-4 shrink-0 duration-150 group-aria-pressed/toggle:rotate-90" />
                     </Expand.Trigger>
                     <span className="text-gray-800">Sequences</span>
                     {/* <span className="mx-1 block h-1 w-1 rounded-full bg-gray-300" /> */}
                     <span className="self-center text-xs text-gray-600">{found?.sequences?.length ?? 0}</span>
                  </div>
                  <Expand.Content>
                     <ul role="list" className="flex grow flex-col self-stretch py-1 pl-4">
                        {found?.sequences?.map((sequence) => (
                           <li key={sequence.sequencename}>
                              <Link
                                 href="#"
                                 // href={`/databases/${database.id}/sequences/${sequence.sequencename}`}
                                 className={buttonVariants({
                                    intent: "ghost",
                                    size: "xs",
                                    className: "w-full justify-start gap-2 rounded-sm hover:bg-gray-200",
                                 })}
                              >
                                 <Table2 className="size-4 shrink-0 opacity-70" />
                                 <span className="truncate">{sequence.sequencename}</span>
                                 <LoadingIndicator />
                              </Link>
                           </li>
                        ))}
                     </ul>
                  </Expand.Content>
               </Expand.Root>
            </Expand.Content>
         </li>
      </Expand.Root>
   );
}

function LoadingIndicator() {
   const { pending } = useLinkStatus();

   if (!pending) return null;

   return <Loader2 className="animate-in animate-zoom-in mr-0.5 ml-auto size-4 shrink-0 animate-spin" />;
}
