import { getDatabaseTables } from "@/models/databases";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
   const id = (await context.params).id;

   const [tables, error] = await getDatabaseTables(id);
   if (error) return NextResponse.json(error);

   return NextResponse.json(tables);
}
