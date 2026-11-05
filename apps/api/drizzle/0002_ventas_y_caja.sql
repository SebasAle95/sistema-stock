CREATE TYPE "public"."tipo_movimiento_caja" AS ENUM('ingreso', 'egreso');--> statement-breakpoint
CREATE TABLE "cajas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"numero" integer GENERATED ALWAYS AS IDENTITY (sequence name "cajas_numero_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"abierta_por" uuid NOT NULL,
	"abierta_en" timestamp with time zone DEFAULT now() NOT NULL,
	"monto_inicial" numeric(12, 2) NOT NULL,
	"cerrada_por" uuid,
	"cerrada_en" timestamp with time zone,
	"efectivo_esperado" numeric(12, 2),
	"efectivo_contado" numeric(12, 2),
	"diferencia" numeric(12, 2),
	"nota_cierre" text
);
--> statement-breakpoint
ALTER TABLE "cajas" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "movimientos_caja" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"caja_id" uuid NOT NULL,
	"tipo" "tipo_movimiento_caja" NOT NULL,
	"monto" numeric(12, 2) NOT NULL,
	"motivo" text NOT NULL,
	"usuario_id" uuid NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "movimientos_caja" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "venta_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venta_id" uuid NOT NULL,
	"producto_id" uuid NOT NULL,
	"nombre" text NOT NULL,
	"cantidad" integer NOT NULL,
	"precio_unitario" numeric(12, 2) NOT NULL,
	"costo_unitario" numeric(12, 2),
	"subtotal" numeric(12, 2) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "venta_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "ventas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"numero" integer GENERATED ALWAYS AS IDENTITY (sequence name "ventas_numero_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"caja_id" uuid NOT NULL,
	"usuario_id" uuid NOT NULL,
	"total" numeric(12, 2) NOT NULL,
	"medio_pago" text NOT NULL,
	"monto_recibido" numeric(12, 2),
	"vuelto" numeric(12, 2),
	"anulada" boolean DEFAULT false NOT NULL,
	"anulada_por" uuid,
	"anulada_en" timestamp with time zone,
	"motivo_anulacion" text,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ventas" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "cajas" ADD CONSTRAINT "cajas_abierta_por_usuarios_id_fk" FOREIGN KEY ("abierta_por") REFERENCES "public"."usuarios"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cajas" ADD CONSTRAINT "cajas_cerrada_por_usuarios_id_fk" FOREIGN KEY ("cerrada_por") REFERENCES "public"."usuarios"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movimientos_caja" ADD CONSTRAINT "movimientos_caja_caja_id_cajas_id_fk" FOREIGN KEY ("caja_id") REFERENCES "public"."cajas"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movimientos_caja" ADD CONSTRAINT "movimientos_caja_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venta_items" ADD CONSTRAINT "venta_items_venta_id_ventas_id_fk" FOREIGN KEY ("venta_id") REFERENCES "public"."ventas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venta_items" ADD CONSTRAINT "venta_items_producto_id_productos_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_caja_id_cajas_id_fk" FOREIGN KEY ("caja_id") REFERENCES "public"."cajas"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_anulada_por_usuarios_id_fk" FOREIGN KEY ("anulada_por") REFERENCES "public"."usuarios"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cajas_una_sola_abierta" ON "cajas" USING btree (("cerrada_en" is null)) WHERE "cajas"."cerrada_en" is null;--> statement-breakpoint
CREATE INDEX "cajas_abierta_en_index" ON "cajas" USING btree ("abierta_en");--> statement-breakpoint
CREATE INDEX "movimientos_caja_caja_id_index" ON "movimientos_caja" USING btree ("caja_id");--> statement-breakpoint
CREATE INDEX "venta_items_venta_id_index" ON "venta_items" USING btree ("venta_id");--> statement-breakpoint
CREATE INDEX "venta_items_producto_id_index" ON "venta_items" USING btree ("producto_id");--> statement-breakpoint
CREATE INDEX "ventas_creado_en_index" ON "ventas" USING btree ("creado_en");--> statement-breakpoint
CREATE INDEX "ventas_caja_id_index" ON "ventas" USING btree ("caja_id");--> statement-breakpoint
ALTER TABLE "movimientos_stock" ADD CONSTRAINT "movimientos_stock_venta_id_ventas_id_fk" FOREIGN KEY ("venta_id") REFERENCES "public"."ventas"("id") ON DELETE restrict ON UPDATE no action;