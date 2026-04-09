import DataTableToolbar from "@/components/data-table-toolbar";
import TableHeader from "../header";

export default function Layout({ children }: React.PropsWithChildren) {
   return (
      <div className="relative m-1.5 flex grow flex-col justify-between self-stretch max-md:mt-0">
         <TableHeader />
         <div className="absolute top-10.5 bottom-10.5 flex w-full flex-[1_1_0] flex-col overflow-hidden rounded-md bg-gray-100 shadow-sm ring-1 ring-gray-950/10">
            {children}
         </div>
         <DataTableToolbar />
      </div>
   );
}
