"use server";

import {
   BadRequestException,
   InternalServerException,
   NewBadRequestException,
   NewInternalServerException,
   NewNotFoundException,
} from "@/infra/errors";
import { createPSQLDatabase } from "@/lib/database-factory";
import databaseSchema, { DatabaseSchema } from "@/dtos/databases.dto";
import z from "zod";
import { createServerAction } from "zsa";
import DatabaseService from "@/core/services/database.service";
import db from "@/db";
import { authenticate } from "@/models/auth";
import { redirect } from "next/navigation";
import to from "@/helpers/to";
import credentialsSchema, { ICredentials } from "@/dtos/credentials";
import { failure, success } from "./@base";
import { eq } from "drizzle-orm";
import { databasesTable } from "@/db/schema";

export const testDatabase = createServerAction()
   .input(
      z.object({
         ...databaseSchema.shape,
         name: z.string().max(64, "Too large"),
      }),
   )
   .onInputParseError(async (error) => {
      console.error(error);
      throw new BadRequestException("Invalid database!");
   })
   .handler(async ({ input }) => {
      const { connection, ...credentials } = input;
      if (connection === 1) {
      }
      const client = createPSQLDatabase(credentials);

      try {
         await client?.connect();
      } catch (error) {
         console.error(error);

         throw new InternalServerException({ cause: error });
      } finally {
         await client?.end();
      }
   });

export async function testDatabaseConnection(data: ICredentials) {
   const session = await authenticate();
   if (!session?.user) redirect("/auth/sign-in");

   const validation = credentialsSchema.safeParse(data);
   if (!validation.success)
      return {
         success: false,
         error: new BadRequestException("Invalid credentials.", { cause: validation.error }).toJSON(),
      } as const;

   const { ...credentials } = validation.data;

   const client = createPSQLDatabase(credentials);

   const connected = await to(client?.connect());
   await client?.end();

   if (connected.success) return { success: true } as const;

   console.error(connected.error);
   return {
      success: false,
      error: new BadRequestException("Can't connect to the database", { cause: connected.error }).toJSON(),
   };
}

export async function getDatabases() {
   const session = await authenticate();
   if (!session?.user) redirect("/auth/sign-in");

   const service = DatabaseService.build(db);
   const found = await service.get(eq(databasesTable.owner_id, session.user.id));

   const error = NewNotFoundException.create({ message: "Database not found" });
   if (!found) return failure(error);

   return success(found);
}

const uuidSchema = z
   .string({ required_error: "ID is required" })
   .min(1, "ID can't be blank")
   .uuid("ID must be a valid UUID");

export async function findDatabase(id: string) {
   const session = await authenticate();
   if (!session?.user) redirect("/auth/sign-in");

   const validation = uuidSchema.safeParse(id);
   if (!validation.success) {
      const error = NewBadRequestException.create({
         message: validation.error.message,
         cause: validation.error,
      });
      return failure(error);
   }

   const service = DatabaseService.build(db);
   const found = await service.find(validation.data);

   const error = NewNotFoundException.create({ message: "Database not found" });
   if (!found) return failure(error);

   return success(found);
}

export async function createDatabase(data: StrictOmit<DatabaseSchema, "id" | "owner_id">) {
   const session = await authenticate();
   if (!session?.user) redirect("/auth/sign-in");

   const validation = databaseSchema.omit({ id: true, owner_id: true }).safeParse(data);
   if (!validation.success) return failure(new BadRequestException(validation.error.message));

   const service = DatabaseService.build(db);
   const response = await to(service.create({ ...validation.data, owner_id: session.user.id }));

   if (!response.success)
      return failure(
         NewInternalServerException.create({
            message: "Failed to create database",
            cause: response.error,
         }),
      );

   return success(JSON.parse(JSON.stringify(response.data)), 201);
}

export async function updateDatabase(id: string, data: StrictOmit<DatabaseSchema, "id" | "owner_id">) {
   const session = await authenticate();
   if (!session?.user) redirect("/auth/sign-in");

   const validation = databaseSchema.omit({ id: true }).safeParse(data);
   if (!validation.success) {
      const error = NewBadRequestException.create({ message: validation.error.message });
      return failure(error);
   }

   const service = DatabaseService.build(db);
   const response = await to(service.update(id, { ...validation.data, owner_id: session.user.id }));

   if (!response.success) {
      const error = NewInternalServerException.create({ cause: response.error });
      return failure(error);
   }

   return success(response.data);
}

export async function connectDatabase(uuid: string) {
   const session = await authenticate();
   if (!session?.user) redirect("/auth/sign-in");

   const validation = uuidSchema.safeParse(uuid);
   if (!validation.success) {
      const error = NewBadRequestException.create({
         message: validation.error.message,
         cause: validation.error,
      });
      return failure(error);
   }

   const service = DatabaseService.build(db);
   const found = await to(service.find(validation.data));
   if (!found.success) {
      const error = NewNotFoundException.create({ message: "Database not found", cause: found.error });
      return failure(error);
   }

   const client = createPSQLDatabase(found.data);
   const connection = await to(client?.connect());

   if (!connection.success) {
      const error = NewInternalServerException.create({
         message: "Failed to connect to database",
         cause: connection.error,
      });
      return failure(error);
   }
   const queries = await to(
      Promise.all([
         client.query<{ table_name: string }>(
            `SELECT table_name FROM information_schema.tables as ist WHERE ist.table_schema = 'public' AND ist.table_type = 'BASE TABLE' ORDER BY table_name`,
         ),
         client.query<{ table_name: string }>(
            `SELECT table_name FROM information_schema.views as isv where isv.table_schema = 'public' ORDER BY table_name`,
         ),
         client.query<{ indexname: string }>(`SELECT indexname FROM pg_indexes WHERE schemaname = 'public'`),
         client.query<{ sequencename: string }>(`SELECT sequencename FROM pg_sequences WHERE schemaname = 'public'`),
      ]),
   );

   if (!queries.success) {
      const error = NewInternalServerException.create({
         message: "Failed to fetch database metadata",
         cause: queries.error,
      });
      return failure(error);
   }

   const [tables, views, indexes, sequences] = queries.data;
   const data = {
      tables: tables.rows,
      views: views.rows,
      indexes: indexes.rows,
      sequences: sequences.rows,
   };

   return success(data);
}
