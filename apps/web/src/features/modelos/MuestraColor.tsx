import Box from '@mui/material/Box';

/** Tono aproximado de los colores más comunes, para el puntito al lado del nombre. */
const TONOS: Record<string, string> = {
  negro: '#1f1f1f',
  blanco: '#ffffff',
  gris: '#9a9a9a',
  beige: '#d9c4a6',
  marron: '#7b5136',
  azul: '#2b4c8c',
  celeste: '#8ec5e8',
  verde: '#4f7d4f',
  rosa: '#f2a7b8',
  rojo: '#c0392b',
  bordo: '#6d1a2a',
  amarillo: '#f2d15c',
  naranja: '#ef8a3c',
  violeta: '#7d5ba6',
  lila: '#c3a6d8',
  crema: '#f4ead5',
  camel: '#c19a6b',
  nude: '#e3bc9a',
  jean: '#4a6a8c',
  dorado: '#c9a54a',
  plateado: '#c0c0c0',
};

const clave = (color: string) =>
  color
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();

/**
 * Puntito con el tono del color. Si el nombre no es uno conocido ("Floreado"),
 * se muestra vacío: el nombre al lado es lo que identifica el color.
 */
export function MuestraColor({ color, tamano = 12 }: { color: string; tamano?: number }) {
  const tono = TONOS[clave(color)];
  return (
    <Box
      component="span"
      aria-hidden
      sx={{
        display: 'inline-block',
        flexShrink: 0,
        width: tamano,
        height: tamano,
        borderRadius: '50%',
        bgcolor: tono ?? 'transparent',
        // El borde hace visible el blanco sobre fondo claro y el negro sobre fondo oscuro.
        border: '1px solid',
        borderColor: 'text.disabled',
        borderStyle: tono ? 'solid' : 'dashed',
      }}
    />
  );
}
