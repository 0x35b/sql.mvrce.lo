import "server-only";

import config from "@/config/site";
import {
   BadRequestException,
   InternalServerException,
   MethodNotAllowedException,
   NotFoundException,
} from "@/infra/errors";
import credentialsSchema, { ICredentials } from "@/dtos/credentials";
import { Client, FieldDef } from "pg";

interface Field {
   name: string;
   position: number;
   type: string;
   nullable: "YES" | "NO";
   default: string;
   key_type: string;
}
type Status = "connected" | "disconnected";

export type GetTableReturn<T = unknown> = { count: number; rows: T[]; fields: Field[] };
// export type GetPropertiesReturn = {};

interface IDatabase<TStatus extends Status> {
   status: TStatus;
   connect: () => Promise<IDatabase<"connected">>;
   query: <T extends Record<string, unknown>>(
      sql: string,
      params?: unknown[],
   ) => Promise<{ count: number; rows: T[]; fields: FieldDef[] }> | never;
   getTable: <T>(
      table: string,
      options?: { limit?: number; order?: string; sort?: string | number; offset?: number },
   ) => Promise<GetTableReturn<T>>;
   end: () => Promise<IDatabase<"disconnected">>;
}

export function createPSQLDatabase(input: ICredentials): IDatabase<"disconnected"> {
   const safe = credentialsSchema.safeParse(input);
   if (!safe.success) throw new Error(safe.error.message);
   return new PSQLDatabase(input);
}

class PSQLDatabase<TStatus extends Status = "disconnected"> implements IDatabase<TStatus> {
   public status: TStatus = "disconnected" as TStatus;
   private client: Client;

   constructor(credentials: ICredentials) {
      const { username } = credentials;

      const safe = credentialsSchema.safeParse(credentials);
      if (!safe.success) throw new BadRequestException("Invalid credentials: " + safe.error.message);

      this.client = new Client({
         ...safe.data,
         user: username,
         application_name: config.fullName,
         connectionTimeoutMillis: 10_000,
      });
   }

   public async connect(): Promise<IDatabase<"connected">> {
      if (!this.client) throw new NotFoundException(`Client doesn't exist. Try re-creating the database`);

      if (!(this.client instanceof Client)) throw new Error("Client is not an instance of pg.Client");

      try {
         await this.client.connect();
         this.status = "connected" as TStatus;
         return this as unknown as IDatabase<"connected">;
      } catch (error) {
         console.error("Error connecting to database:", error);
         this.status = "disconnected" as TStatus;
         throw new InternalServerException({ cause: error });
      }
   }

   public async query<T>(sql: string, params?: unknown[]): Promise<{ count: number; rows: T[]; fields: FieldDef[] }> {
      if (this.status !== "connected") throw new MethodNotAllowedException("You need to connect first!");

      const response = await this.client.query(sql, params);
      return { count: response?.rowCount ?? 0, rows: response.rows as T[], fields: response.fields };
   }

   public async getTable<T = unknown>(
      table: string,
      options: { limit?: number; order?: string; sort?: string | number; offset?: number } = {
         limit: 200,
         order: "ASC",
         sort: 1,
         offset: 0,
      },
   ): Promise<{ count: number; rows: T[]; fields: Field[] }> {
      try {
         const [fields, data] = await Promise.all([
            this.client.query<Field>(
               `SELECT
                     c.column_name as name,
                     c.ordinal_position as position,
                     c.udt_name as type,
                     c.is_nullable as nullable,
                     c.column_default as default,
                     tc.constraint_type as key_type
                  FROM
                     information_schema.columns AS c
                  LEFT JOIN
                     information_schema.key_column_usage AS kcu
                        ON c.table_schema = kcu.table_schema
                        AND c.table_name = kcu.table_name
                        AND c.column_name = kcu.column_name
                  LEFT JOIN
                     information_schema.table_constraints AS tc
                        ON kcu.constraint_schema = tc.constraint_schema
                        AND kcu.constraint_name = tc.constraint_name
                  WHERE
                     c.table_schema = 'public'
                     AND c.table_name = $1
                  ORDER BY
                     c.ordinal_position ASC`,
               [table],
            ),
            this.client.query(
               `SELECT * FROM ${table} ORDER BY ${typeof options.sort === "number" ? options.sort : `"${options.sort}"`} ${options.order} LIMIT ${options.limit}`,
            ),
         ]);

         return { count: data?.rowCount || 0, rows: data?.rows ?? [], fields: fields.rows };
      } catch (error) {
         console.error(error);
         throw new InternalServerException({ cause: error });
      }
   }

   public async end(): Promise<IDatabase<"disconnected">> {
      await this.client?.end();
      this.status = "disconnected" as TStatus;

      return this as IDatabase<"disconnected">;
   }
}
