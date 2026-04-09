"use client";

import { DataTableColumnHeader } from "@/components/data-table-column-header";
import { Table, TableWrapper, TBody, Td, TRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

import {
   Column,
   ColumnDef,
   ColumnPinningState,
   ColumnResizeDirection,
   ColumnResizeMode,
   flexRender,
   getCoreRowModel,
   getFacetedRowModel,
   Row,
   useReactTable,
   VisibilityState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { CSSProperties, useCallback, useMemo, useRef, useState } from "react";

import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs";
import { GetTableReturn } from "@/lib/database-factory";
import { AvailableSQLTypes } from "@/constants/converters";
import Cell from "@/components/data-table/cell";

export interface GenericFieldProps {
   columnID: number;
   dataTypeID: number;
   dataTypeSize: number;
   format: string;
   name: string;
   tableID: number;
}

export interface DataTableProps {
   count: GetTableReturn["count"];
   fields?: GetTableReturn["fields"];
   rows?: GetTableReturn["rows"];
   defaultHeader?: boolean;
   editable?: boolean;
}

function getCommonPinningStyles<TData>(column: Column<TData>): CSSProperties {
   const isPinned = column.getIsPinned();

   const minSize = column.columnDef.minSize ?? 0;
   const maxSize = column.columnDef.maxSize ?? 0;
   const size = Math.max(Math.min(column.getSize(), maxSize), minSize);

   return {
      left: isPinned === "left" ? `${column.getStart("left")}px` : undefined,
      right: isPinned === "right" ? `${column.getAfter("right")}px` : undefined,
      position: isPinned ? "sticky" : "relative",
      width: size,
      flexBasis: size,
      maxWidth: `max(${maxSize}px,60svw)`,
      zIndex: isPinned ? 1 : 0,
   };
}
const columnResizeMode = "onEnd" satisfies ColumnResizeMode;
const columnResizeDirection = "ltr" satisfies ColumnResizeDirection;

export function DataTable({ fields = [], rows = [], editable = true }: DataTableProps) {
   const [hidden] = useQueryState(
      "hide",
      parseAsArrayOf(parseAsString).withDefault([]).withOptions({
         clearOnDefault: true,
         scroll: false,
      }),
   );

   const primaryKey = fields.find((x) => x.key_type === "PRIMARY KEY");
   const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
      left: ["$index"],
      right: [],
   });
   const columnVisibility = hidden.reduce<VisibilityState>((acc, cur) => ({ ...acc, [cur]: false }), {});

   const columns = useMemo(
      () => [
         {
            accessorKey: "$index",
            header: "#",
            cell: ({ row }: { row: { index: number } }) => {
               return (
                  <span aria-description="index" className="grid h-full place-items-center truncate px-0 text-center">
                     {row.index + 1}
                  </span>
               );
            },
            minSize: 40,
            size: 40,
         },
         ...fields.map(
            (field) =>
               ({
                  accessorKey: field.name,
                  cell: ({ row, column }) => {
                     const id = (row.original as Record<string, string | number>)?.[primaryKey?.name || ""];
                     return (
                        <Cell
                           key={id}
                           pkName={primaryKey?.name || "id"}
                           pkValue={id}
                           readOnly={!editable}
                           name={field.name}
                           position={field.position}
                           type={field.type as AvailableSQLTypes}
                           nullable={field.nullable == "YES"}
                           fallback={field.default}
                           defaultValue={row.getValue(column.id)}
                        />
                     );
                  },
                  header: field.name,
                  enableHiding: true,
                  meta: {
                     type: field.type,
                     position: field.position,
                     nullable: field.nullable == "YES",
                  },
               }) satisfies ColumnDef<unknown>,
         ),
      ],
      [fields, editable, primaryKey],
   );

   const table = useReactTable({
      columns,
      data: rows,
      getCoreRowModel: getCoreRowModel(),
      getFacetedRowModel: getFacetedRowModel(),
      initialState: {
         columnPinning,
         columnVisibility,
      },
      state: {
         columnPinning,
         columnVisibility,
      },
      onColumnPinningChange: setColumnPinning,
      onColumnVisibilityChange: undefined,

      columnResizeMode,
      columnResizeDirection,
   });
   const tableRows = table.getRowModel().rows;

   const scrollElementRef = useRef<HTMLDivElement>(null);
   const virtualizer = useVirtualizer<HTMLDivElement, HTMLTableRowElement>({
      count: rows.length,
      getScrollElement: () => scrollElementRef.current,
      estimateSize: () => 29, //estimate row height for accurate scrollbar dragging
      overscan: 5,
   });

   const handleScrollElementRef = useCallback(
      (element: HTMLDivElement | null) => {
         scrollElementRef.current = element;
         if (element) {
            virtualizer.measure();
         }
      },
      [virtualizer],
   );

   return (
      <TableWrapper className="flex h-full flex-col overflow-auto" ref={handleScrollElementRef}>
         <div role="rowheader" className="sticky top-0 z-[2] flex w-max flex-row border-b text-sm text-gray-700">
            {table.getHeaderGroups().map((headerGroup) =>
               headerGroup.headers.map((header, index) => {
                  return (
                     <div
                        key={header.id}
                        data-pinned={header.column.getIsPinned() || undefined}
                        className={cn(
                           "group grid h-9 shrink-0 grid-cols-1 items-center truncate border-r bg-gray-100 px-3 font-medium",
                        )}
                        style={{ ...getCommonPinningStyles(header.column) }}
                     >
                        {index > 0 ? (
                           <DataTableColumnHeader
                              id={header.id}
                              column={header.column}
                              // className={
                              //    table.getState().columnSizingInfo.deltaOffset !== 0 ? "pointer-events-none" : ""
                              // }
                           >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                           </DataTableColumnHeader>
                        ) : (
                           flexRender(header.column.columnDef.header, header.getContext())
                        )}

                        <span
                           className={cn(
                              "absolute inset-y-0 z-[1] h-full w-1 cursor-col-resize touch-none bg-transparent select-none ltr:right-0 rtl:left-0",
                              header.column.getIsResizing() ? "bg-primary" : "hover:bg-primary",
                           )}
                           onDoubleClick={() => header.column.resetSize()}
                           onMouseDown={header.getResizeHandler()}
                           onTouchStart={header.getResizeHandler()}
                           style={{
                              transform: header.column.getIsResizing()
                                 ? `translateX(${
                                      (table.options.columnResizeDirection === "rtl" ? -1 : 1) *
                                      (table.getState().columnSizingInfo.deltaOffset ?? 0)
                                   }px)`
                                 : "",
                           }}
                        />
                     </div>
                  );
               }),
            )}
         </div>

         <Table className="flex grow overflow-visible" style={{ direction: columnResizeDirection }}>
            {/* <THead className="absolute top-0 flex flex-row">
                     {table.getHeaderGroups().map((headerGroup) => (
                        <TRow key={headerGroup.id} className="flex flex-row bg-gray-100">
                           {headerGroup.headers.map((header, index) => {
                              return (
                                 <Th
                                    key={header.id}
                                    data-pinned={header.column.getIsPinned() || undefined}
                                    colSpan={header.colSpan}
                                    className={cn("group bg-gray-100")}
                                    style={{ ...getCommonPinningStyles(header.column), position: "static" }}
                                 >
                                    {index > 0 ? (
                                       <DataTableColumnHeader
                                          id={header.id}
                                          column={header.column}
                                          // className={
                                          //    table.getState().columnSizingInfo.deltaOffset !== 0 ? "pointer-events-none" : ""
                                          // }
                                       >
                                          {flexRender(header.column.columnDef.header, header.getContext())}
                                       </DataTableColumnHeader>
                                    ) : (
                                       flexRender(header.column.columnDef.header, header.getContext())
                                    )}

                                    <span
                                       className={cn(
                                          "absolute inset-y-0 z-50 h-full w-1 cursor-col-resize touch-none bg-transparent select-none ltr:right-0 rtl:left-0",
                                          header.column.getIsResizing() ? "bg-primary" : "hover:bg-primary",
                                       )}
                                       onDoubleClick={() => header.column.resetSize()}
                                       onMouseDown={header.getResizeHandler()}
                                       onTouchStart={header.getResizeHandler()}
                                       style={{
                                          transform: header.column.getIsResizing()
                                             ? `translateX(${
                                                (table.options.columnResizeDirection === "rtl" ? -1 : 1) *
                                                (table.getState().columnSizingInfo.deltaOffset ?? 0)
                                             }px)`
                                             : "",
                                       }}
                                    />
                                 </Th>
                              );
                           })}
                        </TRow>
                     ))}
                  </THead> */}
            {/* <Body table={table} tableContainerRef={tableContainerRef} /> */}
            <TBody className="relative flex h-fit grow flex-col">
               {virtualizer.getVirtualItems().map((virtualRow) => {
                  const row = tableRows[virtualRow.index] as Row<unknown>;
                  if (!row) return null;

                  return (
                     <TRow
                        style={{
                           transform: `translateY(${virtualRow.start}px)`,
                        }}
                        key={virtualRow.key}
                        data-index={virtualRow.index}
                        ref={virtualizer.measureElement}
                        className="group/tr hover:text-foreground absolute top-0 flex shrink-0 grow"
                     >
                        {row.getVisibleCells()?.map((cell) => {
                           return (
                              <Td
                                 role="cell"
                                 data-pinned={cell.column.getIsPinned() ? true : undefined}
                                 key={cell.id}
                                 className={cn(
                                    "bg-background group/td hover:bg-background block shrink grow overflow-hidden p-0 group-hover/tr:bg-gray-100",
                                 )}
                                 style={{ ...getCommonPinningStyles(cell.column) }}
                              >
                                 {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                 <span className="group-focus-within/td:border-primary pointer-events-none absolute -inset-px z-10 group-first/tr:top-0 group-focus-within/td:border" />
                              </Td>
                           );
                        })}
                     </TRow>
                  );
               })}
            </TBody>
         </Table>
      </TableWrapper>
   );
}
