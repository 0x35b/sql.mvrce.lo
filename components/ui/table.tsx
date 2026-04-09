import React from "react";

import { cn } from "@/lib/utils";

export const TableWrapper = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<"div">>(
   ({ className, ...props }, ref) => {
      return (
         <div
            aria-description="Table wrapper"
            data-scroll-container
            {...props}
            className={cn("relative w-full grow", className)}
            ref={ref}
         />
      );
   },
);
TableWrapper.displayName = "TableWrapper";

export const Table = React.forwardRef<HTMLTableElement, React.ComponentPropsWithoutRef<"table">>(
   ({ className, ...props }, ref) => {
      return <div ref={ref} className={cn("flex flex-col text-sm text-gray-800", className)} {...props} />;
   },
);
Table.displayName = "Table";

export const THead = React.forwardRef<HTMLTableSectionElement, React.ComponentPropsWithoutRef<"thead">>(
   ({ className, ...props }, ref) => {
      return (
         <div
            ref={ref}
            className={cn(
               "sticky top-0 left-0 col-span-full grid h-[calc(2.25rem+1px)] grid-cols-subgrid bg-gray-100",
               className,
            )}
            {...props}
         />
      );
   },
);
THead.displayName = "Thead";

export const TBody = React.forwardRef<HTMLTableSectionElement, React.ComponentPropsWithoutRef<"tbody">>(
   ({ className, ...props }, ref) => {
      return (
         <div className={cn("col-span-full grid auto-rows-fr grid-cols-subgrid", className)} {...props} ref={ref} />
      );
   },
);
TBody.displayName = "TBody";

export const TRow = React.forwardRef<HTMLTableRowElement, React.ComponentPropsWithoutRef<"tr">>(
   ({ className, ...props }, ref) => {
      return <div role="row" className={cn("[&>*]:border-b", className)} {...props} ref={ref} />;
   },
);
TRow.displayName = "TRow";

export const Th = React.forwardRef<HTMLTableCellElement, React.ComponentPropsWithoutRef<"th">>(
   ({ className, ...props }, ref) => {
      return (
         <div
            className={cn(
               "grid grid-cols-1 items-center border-r border-b bg-gray-100 px-3 text-left font-medium",
               className,
            )}
            {...props}
            ref={ref}
         />
      );
   },
);
Th.displayName = "Th";

export const Td = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<"td">>(
   ({ className, ...props }, ref) => {
      return <div ref={ref} className={cn("h-[calc(1.75rem+1px)] truncate border-r px-2", className)} {...props} />;
   },
);
Td.displayName = "Td";
