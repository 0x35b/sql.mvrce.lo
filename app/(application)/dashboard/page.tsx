import Card from "@/components/card";
import { buttonVariants } from "@/components/ui/button";
import { getAllDatabasesCreated, getDatabasesCreated } from "@/controllers/statistics.controller";
import Link from "next/link";
import DatabasesPerDay from "./databases-per-day";
import { DAY_DURATION } from "@/constants/globals";

const MONTHS = 4;
export default async function Page() {
   const today = new Date();
   const databases = await getAllDatabasesCreated();

   const since = new Date(today.getFullYear(), today.getMonth() - MONTHS, 1, 0, 0, 0, 0);
   const days = Math.floor((today.getTime() - since.getTime()) / DAY_DURATION);

   const databasesRange = await getDatabasesCreated(days);
   if (!databases.success) return <div>Error loading databases</div>;

   return (
      <div className="flex grow flex-col justify-start gap-4 self-stretch p-4 contain-size">
         <div className="grid grid-cols-1 gap-4 self-stretch md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            <Card.Root>
               <Card.Header>
                  <p className="text-sm text-gray-600">Registered databases</p>
               </Card.Header>
               <Card.Content>
                  <span className="block text-3xl font-bold">{databases.data.count}</span>
                  <span className="block text-xs opacity-70">+{0} this month</span>
               </Card.Content>
            </Card.Root>
         </div>

         <Card.Root className="col-span-full h-fit">
            <Card.Header>
               <p className="text-sm text-gray-600">Databases overtime</p>
            </Card.Header>
            <Card.Content>
               <DatabasesPerDay data={databasesRange?.data?.databases ?? []} since={since} range={days} />
            </Card.Content>
         </Card.Root>

         <Link href="/databases" className={buttonVariants({ intent: "primary", size: "lg" })}>
            Go to databases
         </Link>
      </div>
   );
}
