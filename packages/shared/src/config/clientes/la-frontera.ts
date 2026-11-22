import type { ConfigNegocio } from '../tipos';

/** Cantina de La Frontera Fútbol 5 (stock.hardhouse.com.ar). */
export const laFrontera: ConfigNegocio = {
  id: 'la-frontera',
  nombre: 'Sistema de Stock',
  nombreCorto: 'Stock',
  lema: 'Ventas, stock y caja en un solo lugar',
  moneda: 'ARS',
  locale: 'es-AR',
  zonaHoraria: 'America/Argentina/Buenos_Aires',
  mediosDePago: [
    { id: 'efectivo', nombre: 'Efectivo' },
    { id: 'transferencia', nombre: 'Transferencia' },
    { id: 'mercado_pago', nombre: 'Mercado Pago' },
  ],
  logo: { src: '/clientes/la-frontera/logo.png', alt: 'La Frontera Fútbol 5' },
  fondoLogin: '/clientes/la-frontera/fondo-login.svg',
  // Colores sacados del logo de La Frontera: azul petróleo y naranja.
  tema: {
    primario: '#1c3949',
    secundario: '#f6662f',
  },
  funcionalidades: [],
};
