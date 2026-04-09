"use client";

import { queryDatabase } from "@/models/databases";
import { create } from "zustand";
import { toast } from "sonner";

export interface TerminalDatabaseOption {
   id: string;
   name: string;
   description?: string | null;
}

export interface TerminalResultField {
   name: string;
   position: number;
   type: string;
   nullable: "YES" | "NO";
   default: string;
   key_type: string;
}

export interface TerminalQueryResult {
   count: number;
   fields: TerminalResultField[];
   rows: Record<string, unknown>[];
}

interface TerminalsStore {
   databases: TerminalDatabaseOption[];
   selectedDatabaseId: string | null;
   query: string;
   selection: string;
   result: TerminalQueryResult | null;
   error: string | null;
   isRunning: boolean;
   setDatabases: (databases: TerminalDatabaseOption[]) => void;
   setSelectedDatabaseId: (databaseId: string) => void;
   syncEditorState: (payload: { query: string; selection: string }) => void;
   runQuery: () => Promise<void>;
}

const emptyResult: TerminalQueryResult = { count: 0, fields: [], rows: [] };

export const useTerminalsStore = create<TerminalsStore>((set, get) => ({
   databases: [],
   selectedDatabaseId: null,
   query: "",
   selection: "",
   result: null,
   error: null,
   isRunning: false,
   setDatabases: (databases) =>
      set((state) => ({
         databases,
         selectedDatabaseId:
            state.selectedDatabaseId && databases.some((database) => database.id === state.selectedDatabaseId)
               ? state.selectedDatabaseId
               : (databases[0]?.id ?? null),
      })),
   setSelectedDatabaseId: (selectedDatabaseId) => set({ selectedDatabaseId }),
   syncEditorState: ({ query, selection }) => set({ query, selection }),
   runQuery: async () => {
      const { query, selection, selectedDatabaseId } = get();

      console.log({ selection, query });

      const sql = selection.trim() || query.trim();

      if (!selectedDatabaseId) {
         const error = "Select a database before running a query.";
         set({ error });
         toast.error(error);
         return;
      }

      if (!sql) {
         const error = "Type a query or select a statement first.";
         set({ error });
         toast.error(error);
         return;
      }

      set({ isRunning: true, error: null });

      const [data, error] = await queryDatabase({ databaseId: selectedDatabaseId, sql });

      if (error) {
         set({ isRunning: false, error: error.message });
         toast.error(error.message);
         return;
      }

      set({
         isRunning: false,
         result: data ?? emptyResult,
      });
   },
}));
