CREATE TYPE "public"."tipo_movimiento_stock" AS ENUM('inicial', 'ingreso', 'ajuste', 'merma', 'venta', 'anulacion_venta');--> statement-breakpoint
CREATE TABLE "categorias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "categorias" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "movimientos_stock" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"producto_id" uuid NOT NULL,
	"tipo" "tipo_movimiento_stock" NOT NULL,
	"cantidad" integer NOT NULL,
	"stock_resultante" integer NOT NULL,
	"costo_unitario" numeric(12, 2),
	"nota" text,
	"venta_id" uuid,
	"usuario_id" uuid NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "movimientos_stock" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "productos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"nombre_busqueda" text NOT NULL,
	"codigo_barras" text,
	"categoria_id" uuid,
	"precio_venta" numeric(12, 2) NOT NULL,
	"precio_costo" numeric(12, 2),
	"stock" integer DEFAULT 0 NOT NULL,
	"stock_minimo" integer DEFAULT 0 NOT NULL,
	"controla_stock" boolean DEFAULT true NOT NULL,
	"acceso_rapido" boolean DEFAULT false NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "productos_codigoBarras_unique" UNIQUE("codigo_barras")
);
--> statement-breakpoint
ALTER TABLE "productos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "movimientos_stock" ADD CONSTRAINT "movimientos_stock_producto_id_productos_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movimientos_stock" ADD CONSTRAINT "movimientos_stock_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productos" ADD CONSTRAINT "productos_categoria_id_categorias_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "categorias_nombre_unico" ON "categorias" USING btree (lower("nombre"));--> statement-breakpoint
CREATE INDEX "movimientos_stock_producto_id_creado_en_index" ON "movimientos_stock" USING btree ("producto_id","creado_en");--> statement-breakpoint
CREATE INDEX "movimientos_stock_creado_en_index" ON "movimientos_stock" USING btree ("creado_en");--> statement-breakpoint
CREATE INDEX "productos_categoria_id_index" ON "productos" USING btree ("categoria_id");--> statement-breakpoint
CREATE INDEX "productos_nombre_busqueda_index" ON "productos" USING btree ("nombre_busqueda");