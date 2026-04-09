import "server-only";

import { and, eq, SQL } from "drizzle-orm";
import { databasesTable, DatabasesTable } from "@/db/schema";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import to from "@/helpers/to";
import type { DatabaseSchema } from "@/dtos/databases.dto";
import { BadRequestException, NotFoundException, NotImplementedException } from "@/infra/errors";

import { AES, enc } from "crypto-js";
import { PgColumn } from "drizzle-orm/pg-core";

type CreateDatabaseSchema = StrictOmit<DatabaseSchema, "id">;
type UpdateDatabaseSchema = Partial<CreateDatabaseSchema>;

export default class DatabaseService {
   private readonly database: NodePgDatabase;
   private readonly table: DatabasesTable = databasesTable;

   private constructor(database: NodePgDatabase) {
      this.database = database;
   }

   static build(database: NodePgDatabase) {
      return new DatabaseService(database);
   }

   public async get(where?: SQL | undefined) {
      return await this.database.select().from(this.table).where(where);
   }

   public async getGrouped(groupBy: PgColumn | SQL<DatabasesTable>, where?: SQL | undefined) {
      return await this.database.select().from(this.table).where(where).groupBy(groupBy);
   }

   public async find(id: string) {
      const data = await this.database.select().from(this.table).where(eq(this.table.id, id));
      const secret = process.env.CRYPTO_KEY;

      if (!data) throw new NotFoundException("Database not found.");

      if (typeof secret !== "string" || secret.length === 0)
         throw new BadRequestException("Crypto key is not set in the environment variables.");

      const decrypted = AES.decrypt(data[0].password, secret).toString(enc.Utf8);
      data[0].password = decrypted;

      return data?.[0] || null;
   }

   public async create(data: CreateDatabaseSchema) {
      const secret = process.env.CRYPTO_KEY;
      if (typeof secret !== "string" || secret.length === 0)
         throw new BadRequestException("Crypto key is not set in the environment variables.");

      data.password = AES.encrypt(data.password, secret).toString();
      return await this.database.insert(this.table).values(data);
   }

   public async update(id: string, data: UpdateDatabaseSchema) {
      if (!data.owner_id) throw new BadRequestException("Owner ID is required for updating the database.");
      if (data.password) {
         const secret = process.env.CRYPTO_KEY;
         if (typeof secret !== "string" || secret.length === 0)
            throw new BadRequestException("Crypto key is not set in the environment variables.");

         data.password = AES.encrypt(data.password, secret).toString();
      }
      const response = await to(
         this.database
            .update(this.table)
            .set(data)
            .where(and(eq(this.table.id, id), eq(this.table.owner_id, data.owner_id))),
      );

      if (response.success) return response.data;
   }

   public async delete(id: string, ownerId: number) {
      await this.database.delete(this.table).where(and(eq(this.table.id, id), eq(this.table.owner_id, ownerId)));
   }

   public async share() {
      throw new NotImplementedException("Sharing databases is not implemented yet.");
   }
}
