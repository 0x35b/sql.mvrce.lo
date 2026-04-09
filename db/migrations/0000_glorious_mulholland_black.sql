CREATE TABLE "databases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"name" varchar(255) NOT NULL,
	"description" varchar(512),
	"owner_id" integer NOT NULL,
	"connection" integer DEFAULT 0 NOT NULL,
	"host" varchar(255) NOT NULL,
	"port" integer NOT NULL,
	"database" varchar(255) NOT NULL,
	"username" varchar(255) NOT NULL,
	"password" varchar(255) DEFAULT '' NOT NULL,
	"ssl" boolean DEFAULT false NOT NULL,
	"status" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"permissions" text[] DEFAULT '{}'::text[] NOT NULL,
	"status" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scripts" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	"name" varchar(255) NOT NULL,
	"script" text DEFAULT '' NOT NULL,
	"database_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_databases" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"permissions" text[] DEFAULT '{}'::text[] NOT NULL,
	"user_id" integer NOT NULL,
	"database_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_emails" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"user_id" integer NOT NULL,
	"email" varchar(255) NOT NULL,
	"main" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"name" varchar(255) NOT NULL,
	"magic_key" varchar(16),
	"code" varchar(128) DEFAULT 'uuid_generate_v4()' NOT NULL,
	"affiliate_code" varchar(128),
	"role_id" integer NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"status" integer DEFAULT 1 NOT NULL,
	"last_login_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "databases" ADD CONSTRAINT "databases_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "scripts" ADD CONSTRAINT "scripts_database_id_databases_id_fk" FOREIGN KEY ("database_id") REFERENCES "public"."databases"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "user_databases" ADD CONSTRAINT "user_databases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "user_databases" ADD CONSTRAINT "user_databases_database_id_databases_id_fk" FOREIGN KEY ("database_id") REFERENCES "public"."databases"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "user_emails" ADD CONSTRAINT "user_emails_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "owner_idx" ON "databases" USING btree ("owner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "userDatabaseUniqueIndex" ON "user_databases" USING btree ("user_id","database_id");--> statement-breakpoint
CREATE UNIQUE INDEX "emailUniqueIndex" ON "user_emails" USING btree (lower("email"));