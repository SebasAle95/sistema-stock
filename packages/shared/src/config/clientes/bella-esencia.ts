import type { ConfigNegocio } from '../tipos';

/** Bella Esencia: local de indumentaria (Tucumán). */
export const bellaEsencia: ConfigNegocio = {
  id: 'bella-esencia',
  nombre: 'Bella Esencia',
  nombreCorto: 'Bella Esencia',
  lema: 'Moda que nace de vos',
  moneda: 'ARS',
  locale: 'es-AR',
  zonaHoraria: 'America/Argentina/Tucuman',
  mediosDePago: [
    { id: 'efectivo', nombre: 'Efectivo' },
    { id: 'debito', nombre: 'Débito' },
    { id: 'credito', nombre: 'Crédito' },
    { id: 'transferencia', nombre: 'Transferencia' },
    { id: 'mercado_pago', nombre: 'Mercado Pago' },
  ],
  // Provisorio: foto de perfil de Instagram (150 px). Reemplazar por el archivo original de la marca.
  logo: { src: '/clientes/bella-esencia/logo.png', alt: 'Bella Esencia, moda que nace de vos' },
  // Rosa del logo (#f88086) como acento; el principal es un rosa más profundo para que el texto blanco se lea.
  tema: {
    primario: '#c74552',
    secundario: '#f88086',
  },
  estilo: 'boutique',
  funcionalidades: ['variantes', 'devoluciones'],
};
