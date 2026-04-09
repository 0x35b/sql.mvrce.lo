"use client";

import { ArrowDownToLine, Loader2, Play, Search } from "lucide-react";
import Button from "../ui/button";
import { motion } from "motion/react";
import { Separator } from "../ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useTerminalsStore, type TerminalDatabaseOption } from "@/stores/terminals";

interface TerminalsSidebarProps {
   databases: TerminalDatabaseOption[];
}

export default function TerminalsSidebar({ databases }: TerminalsSidebarProps) {
   const selectedDatabaseId = useTerminalsStore((state) => state.selectedDatabaseId);
   const setSelectedDatabaseId = useTerminalsStore((state) => state.setSelectedDatabaseId);
   const runQuery = useTerminalsStore((state) => state.runQuery);
   const isRunning = useTerminalsStore((state) => state.isRunning);

   return (
      <motion.div
         initial={{ zoom: 0.8, filter: "blur(4px)", y: "110%", opacity: 0 }}
         animate={{ zoom: 1, filter: "blur(0px)", y: "0", opacity: 1 }}
         exit={{ zoom: 0.8, filter: "blur(4px)", y: "110%", opacity: 0 }}
         transition={{ type: "spring", stiffness: 600, damping: 50, mass: 2 }}
         data-slot="toolbar"
         className="bg-background fixed right-2 bottom-2 left-2 z-10 flex origin-bottom items-center gap-1 rounded-full p-1 shadow-md ring ring-gray-950/10 backdrop-blur md:right-auto md:bottom-4 md:left-1/2 md:w-auto md:-translate-x-1/2 md:rounded-full"
      >
         <Select value={selectedDatabaseId ?? undefined} onValueChange={setSelectedDatabaseId}>
            <SelectTrigger size="sm" className="min-w-44 rounded-full">
               <SelectValue placeholder="Select database" />
            </SelectTrigger>
            <SelectContent>
               {databases.map((database) => (
                  <SelectItem key={database.id} value={database.id}>
                     {database.name}
                  </SelectItem>
               ))}
            </SelectContent>
         </Select>

         <Button
            intent="ghost"
            size="sm"
            className="gap-2 rounded-[6px] first:rounded-l-[calc(var(--spacing,0)*4)] last:rounded-r-[calc(var(--spacing,0)*4)]"
            disabled={isRunning}
            onClick={() => void runQuery()}
         >
            {isRunning ? <Loader2 className="size-4 shrink-0 animate-spin" /> : <Play className="size-4 shrink-0" />}
            Run
         </Button>
         <Separator orientation="vertical" className="mx-0.5 my-1" />
         <Button
            disabled
            intent="ghost"
            size="icon"
            className="size-8 shrink-0 gap-2 rounded-[6px] first:rounded-l-[calc(var(--spacing,0)*4)] last:rounded-r-[calc(var(--spacing,0)*4)] focus-visible:z-1"
         >
            <Search className="size-4 shrink-0" />
            <span className="sr-only">Search</span>
         </Button>
         <Button
            disabled
            intent="ghost"
            size="icon"
            className="size-8 shrink-0 gap-2 rounded-[6px] first:rounded-l-[calc(var(--spacing,0)*4)] last:rounded-r-[calc(var(--spacing,0)*4)] focus-visible:z-1"
         >
            <ArrowDownToLine className="size-4 shrink-0" />
            <span className="sr-only">Export</span>
         </Button>
         {/* <Button
            intent="ghost"
            size="icon"
            className="size-8 shrink-0 gap-2 rounded-[6px] first:rounded-l-[calc(var(--spacing,0)*4)] last:rounded-r-[calc(var(--spacing,0)*4)] focus-visible:z-1"
         >
            <Copy className="size-4 shrink-0" />
            <span className="sr-only">Copy</span>
         </Button> */}

         {/* <Button
            intent="danger-ghost"
            size="icon"
            className="size-8 gap-2 rounded-[6px] first:rounded-l-[calc(var(--spacing,0)*4)] last:rounded-r-[calc(var(--spacing,0)*4)] focus-visible:z-1"
         >
            <X className="size-4 shrink-0" />
            <span className="sr-only">Clear</span>
         </Button> */}

         {/* <Button intent="ghost" size="icon" className="size-8 rounded-full">
            <ChevronUp className="size-4" />
         </Button> */}
      </motion.div>
   );
}
