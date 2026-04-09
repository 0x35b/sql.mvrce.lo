import { SQL, sql } from "drizzle-orm";
import {
   integer,
   pgTable,
   varchar,
   timestamp,
   index,
   uniqueIndex,
   serial,
   text,
   boolean,
   AnyPgColumn,
   uuid,
} from "drizzle-orm/pg-core";

export const rolesTable = pgTable("roles", {
   id: serial().primaryKey(),
   created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
   updated_at: timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
   permissions: text()
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
   status: integer().notNull().default(1),
});

export const usersTable = pgTable("users", {
   id: serial().primaryKey(),
   created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
   updated_at: timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
   name: varchar({ length: 255 }).notNull(),
   magic_key: varchar({ length: 16 }),
   code: varchar({ length: 128 })
      .notNull()
      .default(sql`'uuid_generate_v4()'`),
   affiliate_code: varchar({ length: 128 }),
   role_id: integer()
      .notNull()
      .references(() => rolesTable.id, {
         onUpdate: "cascade",
         onDelete: "restrict",
      }),
   verified: boolean().notNull().default(false),
   status: integer().notNull().default(1),
   last_login_at: timestamp({ withTimezone: true }),
});

export const userEmailsTable = pgTable(
   "user_emails",
   {
      id: serial().primaryKey(),
      created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
      updated_at: timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
      user_id: integer()
         .notNull()
         .references(() => usersTable.id, {
            onUpdate: "cascade",
            onDelete: "cascade",
         }),
      email: varchar({ length: 255 }).notNull(),
      main: boolean().notNull().default(false),
   },
   (table) => [uniqueIndex("emailUniqueIndex").on(lower(table.email))],
);

// table for share database between users
export const sharedDatabasesTable = pgTable(
   "user_databases",
   {
      id: serial().primaryKey(),
      created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
      updated_at: timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
      permissions: text()
         .array()
         .notNull()
         .default(sql`'{}'::text[]`),
      user_id: integer()
         .notNull()
         .references(() => usersTable.id, {
            onUpdate: "cascade",
            onDelete: "cascade",
         }),
      database_id: uuid()
         .notNull()
         .references(() => databasesTable.id, {
            onUpdate: "cascade",
            onDelete: "cascade",
         }),
   },
   (table) => [uniqueIndex("userDatabaseUniqueIndex").on(table.user_id, table.database_id)],
);

export type DatabasesTable = typeof databasesTable;
export const databasesTable = pgTable(
   "databases",
   {
      id: uuid()
         .primaryKey()
         .default(sql`gen_random_uuid()`),
      created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
      updated_at: timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
      name: varchar({ length: 255 }).notNull(),
      description: varchar({ length: 512 }),
      owner_id: integer()
         .notNull()
         .references(() => usersTable.id, {
            onUpdate: "cascade",
            onDelete: "cascade",
         }),

      connection: integer().notNull().default(0),
      host: varchar({ length: 255 }).notNull(),
      port: integer().notNull(),
      database: varchar({ length: 255 }).notNull(),
      username: varchar({ length: 255 }).notNull(),
      password: varchar({ length: 255 }).notNull().default(""),
      ssl: boolean().notNull().default(false),
      status: integer().notNull().default(1),
   },
   (table) => [index("owner_idx").on(table.owner_id)],
);

export const scripsTable = pgTable("scripts", {
   id: serial().primaryKey(),
   created_at: timestamp().notNull().defaultNow(),
   updated_at: timestamp().$onUpdate(() => new Date()),
   name: varchar({ length: 255 }).notNull(),
   script: text().notNull().default(""),
   database_id: uuid()
      .notNull()
      .references(() => databasesTable.id, {
         onUpdate: "cascade",
         onDelete: "cascade",
      }),
});

export function lower(email: AnyPgColumn): SQL {
   return sql`lower(${email})`;
}
