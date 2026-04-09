"use server";

import { NewNotFoundException } from "@/infra/errors";
import DatabaseService from "@/core/services/database.service";
import db from "@/db";
import { authenticate } from "@/models/auth";
import { redirect } from "next/navigation";
import { failure, success } from "./@base";
import { and, eq, gte } from "drizzle-orm";
import { databasesTable } from "@/db/schema";

export async function getAllDatabasesCreated() {
   const session = await authenticate();
   if (!session?.user) redirect("/auth/sign-in");

   const service = DatabaseService.build(db);
   const found = await service.get(and(eq(databasesTable.owner_id, session.user.id)));

   const error = NewNotFoundException.create({ message: "Database not found" });
   if (!found) return failure(error);

   return success({
      count: found.length,
      databases: found,
   });
}

export async function getDatabasesCreated(rangeInDays = 30) {
   const session = await authenticate();
   if (!session?.user) redirect("/auth/sign-in");

   const service = DatabaseService.build(db);
   const since = new Date(Date.now() - rangeInDays * 24 * 60 * 60 * 1000);
   const found = await service.get(
      and(eq(databasesTable.owner_id, session.user.id), gte(databasesTable.created_at, since)),
   );

   const error = NewNotFoundException.create({ message: "Database not found" });
   if (!found) return failure(error);

   return success({
      count: found.length,
      databases: found,
   });
}

export async function getDatabasesPerDate(rangeInDays = 90) {
   const session = await authenticate();
   if (!session?.user) redirect("/auth/sign-in");

   const service = DatabaseService.build(db);
   const since = new Date(Date.now() - rangeInDays * 24 * 60 * 60 * 1000);
   const found = await service.getGrouped(
      databasesTable.created_at,
      and(eq(databasesTable.owner_id, session.user.id), gte(databasesTable.created_at, since)),
   );

   const error = NewNotFoundException.create({ message: "Database not found" });
   if (!found) return failure(error);

   return success({
      count: found.length,
      databases: found,
   });
}
