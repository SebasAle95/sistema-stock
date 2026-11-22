CREATE SEQUENCE "public"."codigos_internos_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE TABLE "modelos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"nombre_busqueda" text NOT NULL,
	"categoria_id" uuid,
	"precio_venta" numeric(12, 2) NOT NULL,
	"precio_costo" numeric(12, 2),
	"stock_minimo" integer DEFAULT 0 NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "modelos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "productos" ADD COLUMN "modelo_id" uuid;--> statement-breakpoint
ALTER TABLE "productos" ADD COLUMN "talle" text;--> statement-breakpoint
ALTER TABLE "productos" ADD COLUMN "color" text;--> statement-breakpoint
ALTER TABLE "modelos" ADD CONSTRAINT "modelos_categoria_id_categorias_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "modelos_nombre_busqueda_index" ON "modelos" USING btree ("nombre_busqueda");--> statement-breakpoint
ALTER TABLE "productos" ADD CONSTRAINT "productos_modelo_id_modelos_id_fk" FOREIGN KEY ("modelo_id") REFERENCES "public"."modelos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "productos_modelo_id_index" ON "productos" USING btree ("modelo_id");--> statement-breakpoint
CREATE UNIQUE INDEX "productos_modelo_talle_color_unico" ON "productos" USING btree ("modelo_id",coalesce(lower("talle"), ''),coalesce(lower("color"), '')) WHERE "productos"."modelo_id" is not null;