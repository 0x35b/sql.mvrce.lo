"use client";

import { useEffect, useRef } from "react";
import { EditorView, basicSetup } from "codemirror";
import { search } from "@codemirror/search";
import { EditorState } from "@codemirror/state";
import { sql, PostgreSQL } from "@codemirror/lang-sql";
import { keymap } from "@codemirror/view";
import { useTerminalsStore } from "@/stores/terminals";
import { gruvboxDark } from "@uiw/codemirror-theme-gruvbox-dark";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useStorage } from "@/hooks/use-storage";

type SqlEditorProps = {
   onChange?: (value: string) => void;

   onSubmit?: (value: string) => void;
};

export default function SqlEditor({ onChange }: SqlEditorProps) {
   const editorRef = useRef<HTMLDivElement | null>(null);
   const viewRef = useRef<EditorView | null>(null);

   const [script, setScript] = useStorage("terminal", "");

   const { selectedDatabaseId, runQuery, syncEditorState } = useTerminalsStore();
   const { data } = useQuery({
      queryKey: ["database-tables", selectedDatabaseId],
      queryFn: async () => {
         const response = await fetch(`/api/v1/databases/${selectedDatabaseId}/tables`);
         if (!response.ok) throw new Error("Invalid fetch");

         const json: { table_name: string; columns: string[] }[] = await response.json();
         return json;
      },
      throwOnError(error, query) {
         toast.error(error.message, {
            action: {
               onClick: () => query.reset(),
               label: "Try again",
            },
         });
         return false;
      },
   });

   useEffect(() => {
      if (!editorRef.current) return;

      const schema =
         data?.reduce(
            (acc, cur) => {
               acc[cur.table_name] = cur.columns;
               return acc;
            },
            {} as Record<string, string[]>,
         ) ?? {};

      function syncState(view: EditorView) {
         const selection = view.state.selection.main;

         const query = view.state.doc.toString();
         setScript(query);
         syncEditorState({
            query: view.state.doc.toString(),
            selection: selection.empty ? "" : view.state.sliceDoc(selection.from, selection.to),
         });
      }

      const removeDefaultSearch = search({
         createPanel: () => ({
            dom: document.createElement("div"),
         }),
      });

      const state = EditorState.create({
         doc: script,
         extensions: [
            keymap.of([
               {
                  key: "Ctrl-Enter",
                  run: () => {
                     console.log("Running ctrl+enter");
                     void runQuery();
                     return true;
                  },
               },
               {
                  key: "Mod-Enter",
                  run: () => {
                     void runQuery();
                     return true;
                  },
               },
            ]),
            basicSetup,
            sql({
               dialect: PostgreSQL,
               schema,
               upperCaseKeywords: true,
            }),
            removeDefaultSearch,
            gruvboxDark,
            EditorView.updateListener.of((update) => {
               if (update.docChanged) {
                  onChange?.(update.state.doc.toString());
               }

               if (update.docChanged || update.selectionSet) {
                  syncState(update.view);
               }
            }),
         ],
      });

      const view = new EditorView({
         state,
         parent: editorRef.current,
      });

      viewRef.current = view;
      syncState(view);

      return () => {
         view.destroy();
         viewRef.current = null;
      };
   }, [onChange, runQuery, syncEditorState, data]);

   return (
      <div
         ref={editorRef}
         onKeyDown={(e) => {
            if (e.ctrlKey + e.key == "Enter") {
               e.preventDefault();
               runQuery();
            }
         }}
         className="relative flex grow self-stretch *:grow"
      />
   );
}
