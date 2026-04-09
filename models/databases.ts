"use server";

import databaseSchema from "@/dtos/databases.dto";
import credentialsSchema from "@/dtos/credentials";
import { authedProcedure } from "./auth";
import db from "@/db";
import { databasesTable } from "@/db/schema";
import {
   BadRequestException,
   InternalServerException,
   NewBadRequestException,
   NotFoundException,
} from "@/infra/errors";
import { and, asc, desc, eq } from "drizzle-orm";
import { GetTableParams } from "@/dtos/_default";
import { createServerAction } from "zsa";
import { z } from "zod";
import tryCatch from "@/helpers/try-catch";
import { createPSQLDatabase } from "@/lib/database-factory";

import { AES, enc } from "crypto-js";

export type GetDatabasesReturn = NonNullable<Awaited<ReturnType<typeof getDatabases>>[0]>;
export const getDatabases = authedProcedure.input(GetTableParams).handler(async ({ ctx, input }) => {
   try {
      const response = await db
         .select({ id: databasesTable.id, name: databasesTable.name, description: databasesTable.description })
         .from(databasesTable)
         .where(eq(databasesTable.owner_id, ctx.user?.id ?? 0))
         .orderBy(input?.orderBy === "asc" ? asc(databasesTable.id) : desc(databasesTable.id));
      return response;
   } catch (error) {
      console.error(error);
      throw new InternalServerException({ cause: error });
   }
});

export const findDatabase = authedProcedure.input(z.string().min(1, "Invalid ID")).handler(async ({ ctx, input }) => {
   try {
      const databases = await db
         .select()
         .from(databasesTable)
         .where(and(eq(databasesTable.id, input), eq(databasesTable.owner_id, ctx.user?.id ?? 0)));

      const database = databases?.[0];
      if (!database) throw new NotFoundException("Database doesn't exists.");

      database.password = AES.decrypt(database.password, process.env.CRYPTO_KEY ?? "").toString(enc.Utf8);
      return database;
   } catch (error) {
      throw new InternalServerException({ cause: error });
   }
});

export const createDatabase = authedProcedure.input(databaseSchema).handler(async ({ ctx, input }) => {
   if (input.id) throw new BadRequestException("Bad request! You can't create a database with a predefined ID.");
   const database: typeof databasesTable.$inferInsert = { ...input, owner_id: ctx.user?.id ?? 0 };

   if (database.password) database.password = AES.encrypt(database.password, process.env.CRYPTO_KEY || "").toString();

   try {
      await db.insert(databasesTable).values(database);
   } catch (error) {
      console.error(error);
      throw new InternalServerException({ cause: error });
   }
});

export const updateDatabase = authedProcedure.input(databaseSchema.partial()).handler(async ({ ctx, input }) => {
   if (!input.id) throw new BadRequestException("Bad request! ID is missing.");

   // Hold all the rows fetched with the query params passed.
   let rows = [];
   try {
      rows = await db
         .select({ id: databasesTable.id })
         .from(databasesTable)
         .where(and(eq(databasesTable.id, input.id), eq(databasesTable.owner_id, ctx.user?.id ?? 0)));
   } catch (error) {
      throw new InternalServerException({ cause: error });
   }

   if (!rows.length) throw new NotFoundException("Database doesn't exists.");

   const database = {
      ...input,
      password: input?.password?.length
         ? AES.encrypt(input.password, process.env.CRYPTO_KEY as string).toString()
         : undefined,
      owner_id: ctx.user?.id,
   };

   try {
      await db
         .update(databasesTable)
         .set(database)
         .where(and(eq(databasesTable.id, input.id), eq(databasesTable.owner_id, ctx.user?.id ?? 0)));
   } catch (error) {
      throw new InternalServerException({ cause: error });
   }
});

export const deleteDatabase = authedProcedure
   .input(z.string().min(1, "Invalid ID").uuid())
   .handler(async ({ ctx, input }) => {
      const { data, error } = await tryCatch(
         db
            .delete(databasesTable)
            .where(and(eq(databasesTable.id, input), eq(databasesTable.owner_id, ctx.user?.id ?? 0))),
      );

      if (error) throw new InternalServerException({ cause: error });

      if (!data.rowCount || data.rowCount <= 0) throw new NotFoundException("Database doesn`t exists.");
   });

type QueryField = {
   name: string;
   position: number;
   type: string;
   nullable: "YES" | "NO";
   default: string;
   key_type: string;
};

export type DatabaseTable = {
   table_name: string;
   column_name: string;
};

function inferQueryFieldType(value: unknown): QueryField["type"] {
   if (value === null || value === undefined) return "text";
   if (Array.isArray(value)) return value.every((item) => typeof item === "number") ? "_int4" : "_text";
   if (value instanceof Date) return "timestamptz";

   switch (typeof value) {
      case "boolean":
         return "bool";
      case "number":
         return Number.isInteger(value) ? "int8" : "numeric";
      case "object":
         return "jsonb";
      default:
         return "text";
   }
}

export const queryDatabase = authedProcedure
   .input(
      z.object({
         databaseId: z.string().min(1, "Invalid ID"),
         sql: z.string().min(1, "Invalid SQL"),
         params: z.array(z.string()).optional(),
      }),
   )
   .handler(async ({ input }) => {
      const [client, error] = await getConnection(input.databaseId);
      if (error) throw error;

      try {
         const result = await client?.query(input.sql, input.params);
         if (!result) return { count: 0, fields: [], rows: [] };

         const fields = result.fields.map<QueryField>((field, index) => {
            const firstValue = result.rows.find((row) => row && typeof row === "object" && field.name in row)?.[
               field.name
            ];

            return {
               name: field.name,
               position: index + 1,
               type: inferQueryFieldType(firstValue),
               nullable: "YES",
               default: "",
               key_type: "",
            };
         });

         return {
            count: result.count,
            rows: result.rows,
            fields,
         };
      } catch (error) {
         console.error(error);
         throw new InternalServerException({ cause: error });
      } finally {
         await client?.end();
      }
   });

export type GetDatabaseTablesReturn = NonNullable<Awaited<ReturnType<typeof getDatabaseTables>>[0]>;
export const getDatabaseTables = authedProcedure.input(z.string().min(1, "Invalid ID")).handler(async ({ input }) => {
   const [client, error] = await getConnection(input);
   if (error) throw error;

   try {
      const tables = await client?.query<DatabaseTable>(
         `SELECT ist.table_name, isc.column_name
         FROM information_schema.tables as ist
         LEFT JOIN information_schema.columns as isc ON ist.table_name = isc.table_name
         WHERE ist.table_schema = 'public' AND ist.table_type = 'BASE TABLE'
         ORDER BY ist.table_name`,
      );

      return tables.rows.reduce(
         (acc, cur) => {
            const exists = acc.find((x) => x.table_name === cur.table_name);
            if (!exists) {
               acc.push({ table_name: cur.table_name, columns: [cur.column_name] });
               return acc;
            }

            exists.columns.push(cur.column_name);

            return acc;
         },
         [] as { table_name: string; columns: string[] }[],
      );
   } catch (error) {
      console.error(error);
      throw new InternalServerException({ cause: error });
   } finally {
      await client?.end();
   }
});

export const connectDatabase = authedProcedure.input(z.string().min(1, "Invalid ID")).handler(async ({ input }) => {
   const [found, error] = await findDatabase(input);

   if (error) throw new InternalServerException({ cause: error });
   const client = createPSQLDatabase(found);

   try {
      await client?.connect();
   } catch (error) {
      console.error(error);
      throw new InternalServerException({ cause: error });
   }

   try {
      const [tables, views, indexes, sequences] = await Promise.all([
         client.query<{ table_name: string }>(
            `SELECT table_name FROM information_schema.tables as ist WHERE ist.table_schema = 'public' AND ist.table_type = 'BASE TABLE' ORDER BY table_name`,
         ),
         client.query<{ table_name: string }>(
            `SELECT table_name FROM information_schema.views as isv where isv.table_schema = 'public' ORDER BY table_name`,
         ),
         client.query<{ indexname: string }>(`SELECT indexname FROM pg_indexes WHERE schemaname = 'public'`),
         client.query<{ sequencename: string }>(`SELECT sequencename FROM pg_sequences WHERE schemaname = 'public'`),
      ]);
      const { id, name, description } = found;
      return {
         id,
         name,
         description,
         tables: tables.rows,
         views: views.rows,
         indexes: indexes.rows,
         sequences: sequences.rows,
      };
   } catch (error) {
      console.error(error);
      throw new InternalServerException({ cause: error });
   } finally {
      await client?.end();
   }
});

interface RowReturn {
   [k: string]: unknown;
   Column: string;
   Position: number;
   Type: string;
   Nullable: "YES" | "NO";
   Default: string | number | null;
   Comment: string | null;
}

export const getConnection = authedProcedure.input(z.string().min(1, "Invalid ID")).handler(async ({ input }) => {
   const [found, error] = await findDatabase(input);
   if (error) throw new InternalServerException({ cause: error });

   const client = createPSQLDatabase(found);

   try {
      await client?.connect();
      return client;
   } catch (error) {
      console.error(error);
      throw new InternalServerException({ cause: error });
   }
});

export const getDatabaseProperties = authedProcedure
   .input(z.object({ databaseId: z.string(), tableName: z.string() }))
   .onInputParseError(async (cause) => {
      const error = NewBadRequestException.create({
         message: "Invalid input",
         cause,
      });
      console.error(error);
      throw error;
   })
   .handler(async ({ input }) => {
      const { databaseId, tableName } = input;
      const [found, err] = await findDatabase(databaseId);

      if (err) throw err;

      const client = createPSQLDatabase(found);

      try {
         await client?.connect();
      } catch (error) {
         console.error(error);
         return;
      }

      if (client.status === "disconnected") {
         console.error("is disconnected, cant query");
         return;
      }

      try {
         const data = await client.query<RowReturn>(
            `SELECT c.column_name as "Column", c.ordinal_position as "Position", case when c.character_maximum_length > 0 then concat(c.udt_name,'(',c.character_maximum_length,')') else c.udt_name end as "Type", c.is_nullable as "Nullable", c.column_default as "Default", replace(pgd.description,'
      ','\n') as "Comment"
               FROM pg_catalog.pg_statio_all_tables as st
               INNER JOIN pg_catalog.pg_description pgd on pgd.objoid = st.relid
               RIGHT JOIN information_schema.columns c on pgd.objsubid = c.ordinal_position and c.table_schema = st.schemaname and c.table_name = st.relname
               WHERE c.table_schema = 'public' and c.table_name = $1
               ORDER BY c.ordinal_position`,
            [tableName],
         );
         if (!data) return;

         return data.rows;
      } catch (error) {
         if ((error as { code?: string })?.code === "42P01") {
            throw new NotFoundException();
         }
      }
   });

// Anonymous actions

export const testDatabase = createServerAction()
   .input(credentialsSchema)
   .onInputParseError(async (error) => {
      console.error(error);
      throw new BadRequestException("Invalid database!");
   })
   .handler(async ({ input }) => {
      // if (connection === 1) {
      // }
      const client = createPSQLDatabase(input);

      try {
         await client?.connect();
      } catch (error) {
         console.error(error);

         throw new InternalServerException({ cause: error });
      } finally {
         await client?.end();
      }
   });
