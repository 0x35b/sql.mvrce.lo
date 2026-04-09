"use server";

import { z } from "zod";

import { authedProcedure } from "@/models/auth";
import db from "@/db";
import { databasesTable } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { InternalServerException, NotFoundException } from "@/infra/errors";
import tryCatch from "@/helpers/try-catch";
import { createPSQLDatabase } from "@/lib/database-factory";

export const connectToDatabase = authedProcedure
   .input(z.string().min(1, "Invalid database ID"))
   .handler(async ({ ctx, input }) => {
      const { data: databases, error } = await tryCatch(
         db
            .select()
            .from(databasesTable)
            .where(and(eq(databasesTable.id, input), eq(databasesTable.owner_id, ctx.user?.id ?? 0))),
      );
      if (error) throw new InternalServerException({ cause: error });
      if (!databases?.length) throw new NotFoundException("Database doesn't exist.");

      const database = databases[0];

      const client = createPSQLDatabase(database);

      try {
         await client.connect();
         return true;
      } catch (error) {
         console.error(error);

         throw new InternalServerException({ cause: error });
      } finally {
         await client?.end();
      }
   });
