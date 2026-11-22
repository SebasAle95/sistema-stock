import Box from '@mui/material/Box';
import { formatearMoneda, negocio, type Producto } from '@stock/shared';
import { CodigoBarras } from './CodigoBarras';

/**
 * Formatos de impresión. Las medidas son las de las etiquetas autoadhesivas más comunes:
 * hoja A4 de 24 (3 columnas × 8 filas de 70 × 37 mm) y rollo de etiquetadora de 50 × 25 mm.
 */
export const FORMATOS = {
  a4: { nombre: 'Hoja A4 de 24 etiquetas (70 × 37 mm)', ancho: 70, alto: 37, columnas: 3, porHoja: 24 },
  rollo: { nombre: 'Rollo de etiquetadora (50 × 25 mm)', ancho: 50, alto: 25, columnas: 1, porHoja: 1 },
} as const;

export type Formato = keyof typeof FORMATOS;

interface Props {
  producto: Producto & { codigoBarras: string };
  formato: Formato;
  conPrecio: boolean;
}

/**
 * Una etiqueta: marca, precio, prenda (modelo, color y talle) y código de barras.
 * Siempre negro sobre blanco, aunque la pantalla esté en modo oscuro: es lo que se imprime.
 */
export function Etiqueta({ producto, formato, conPrecio }: Props) {
  const { ancho, alto } = FORMATOS[formato];
  const chica = formato === 'rollo';
  const titulo = producto.modelo?.nombre ?? producto.nombre;
  const detalle = producto.modelo
    ? [producto.color, producto.talle ? `Talle ${producto.talle}` : null].filter(Boolean).join(' · ')
    : null;

  const unaLinea = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as const;

  return (
    <Box
      sx={{
        width: `${ancho}mm`,
        height: `${alto}mm`,
        p: chica ? '1.5mm 2.5mm' : '2.5mm 3.5mm',
        boxSizing: 'border-box',
        bgcolor: '#fff',
        color: '#000',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        breakInside: 'avoid',
        lineHeight: 1.2,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '2mm' }}>
        <Box sx={{ ...unaLinea, fontSize: chica ? '5.5pt' : '6.5pt', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          {negocio.nombreCorto}
        </Box>
        {conPrecio && (
          <Box sx={{ fontSize: chica ? '10pt' : '12pt', fontWeight: 700, whiteSpace: 'nowrap' }}>
            {formatearMoneda(producto.precioVenta)}
          </Box>
        )}
      </Box>
      <Box sx={{ ...unaLinea, fontSize: chica ? '7.5pt' : '9pt', fontWeight: 600, mt: '0.5mm' }}>{titulo}</Box>
      {detalle && <Box sx={{ ...unaLinea, fontSize: chica ? '7pt' : '8.5pt' }}>{detalle}</Box>}
      <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'center' }}>
        <CodigoBarras codigo={producto.codigoBarras} altoMm={chica ? 10 : 14} />
      </Box>
    </Box>
  );
}
