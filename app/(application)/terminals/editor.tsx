"use client";

import { useRef } from "react";

const keywords = ["SELECT", "FROM", "WHERE", "INSERT", "UPDATE", "DELETE"];
const symbols = ["=", ">", ">=", "<", "<=", "!="];

function getCaretPosition(element: HTMLElement): number {
   let caretOffset = 0;
   const sel = window.getSelection();

   if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(element);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      caretOffset = preCaretRange.toString().length;
   }

   return caretOffset;
}

function setCaretPosition(element: HTMLElement, position: number): void {
   const range = document.createRange();
   const sel = window.getSelection();

   if (!sel) return;

   let currentPos = 0;
   const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);

   let node: Node | null;
   while ((node = walker.nextNode())) {
      const textLength = node.textContent?.length || 0;
      if (currentPos + textLength >= position) {
         range.setStart(node, position - currentPos);
         range.collapse(true);
         sel.removeAllRanges();
         sel.addRange(range);
         return;
      }
      currentPos += textLength;
   }

   // If we couldn't find the position, set it at the end
   range.selectNodeContents(element);
   range.collapse(false);
   sel.removeAllRanges();
   sel.addRange(range);
}

export default function Editor({ tables }: { tables: string[] }) {
   const textArea = useRef<HTMLDivElement>(null);

   function formatText(text: string) {
      console.log(text);
      const f1 = text
         .split("\n")
         .map((line) => {
            if (line.trim().startsWith("--")) return `<span style="color:gray">${line}</span>`;
            return line;
         })
         .join("\n");

      let skip = false;
      const formatted = f1.split(" ").map((word) => {
         if (skip) {
            if (word.endsWith("</span>")) skip = false;
            return word;
         }
         if (word.startsWith("<span")) {
            skip = true;
         }
         if (keywords.includes(word.toUpperCase()))
            return `<span style="color:var(--color-primary)">${word.toUpperCase()}</span>`;
         if (tables && tables?.includes(word)) return `<span style="color:blue">${word}</span>`;
         if (symbols.includes(word)) return `<span style="color:orange">${word}</span>`;
         return word;
      });
      // Basic formatting: uppercase keywords
      return formatted.join(" ");
   }

   const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
      const text = e.currentTarget.innerText ?? "";
      // setValue(text);

      // Save current caret position
      const caretPos = getCaretPosition(e.currentTarget);

      // Format the text
      const formattedText = formatText(text);

      // Only update if formatting changed something
      if (formattedText !== text) {
         e.currentTarget.innerHTML = formattedText;

         // Restore caret position
         setCaretPosition(e.currentTarget, caretPos);
      }
   };

   return (
      <div className="relative flex grow self-stretch">
         <div
            className="caret-primary grow self-stretch p-3 whitespace-pre-wrap"
            contentEditable
            suppressContentEditableWarning={true}
            onInput={handleInput}
            ref={textArea}
         />
      </div>
   );
}
