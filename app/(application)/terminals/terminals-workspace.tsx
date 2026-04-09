"use client";

import { useEffect } from "react";

import Editor from "./editor2";
import { DataTable } from "@/components/data-table";
import TerminalsSidebar from "@/components/sidebars/terminals-sidebar";
import { useTerminalsStore, type TerminalDatabaseOption } from "@/stores/terminals";
import { ResizablePanel } from "@/components/resize-panel";
import { AnimatePresence } from "motion/react";

interface TerminalsWorkspaceProps {
   databases: TerminalDatabaseOption[];
}

export default function TerminalsWorkspace({ databases }: TerminalsWorkspaceProps) {
   const setDatabases = useTerminalsStore((state) => state.setDatabases);
   const result = useTerminalsStore((state) => state.result);

   useEffect(() => {
      setDatabases(databases);
   }, [databases, setDatabases]);

   return (
      <div className="flex grow flex-col overflow-hidden">
         <section className="relative flex min-h-0 grow self-stretch contain-layout">
            <TerminalsSidebar databases={databases} />
            <Editor />
         </section>
         <AnimatePresence>
            {result ? (
               <ResizablePanel className="border-t">
                  <DataTable count={result.count} fields={result.fields} rows={result.rows} editable={false} />
               </ResizablePanel>
            ) : null}
         </AnimatePresence>
      </div>
   );
}
