import { getDatabases } from "@/models/databases";
import TerminalsWorkspace from "./terminals-workspace";

export default async function Page() {
   const [databases = []] = await getDatabases();

   return <TerminalsWorkspace databases={databases ?? []} />;
}
