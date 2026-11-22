'use client';

import { esEAN13Valido } from '@stock/shared';
import JsBarcode from 'jsbarcode';
import { useEffect, useRef } from 'react';

interface Props {
  codigo: string;
  /** Alto total (barras + números), en milímetros. El ancho sale solo según el código. */
  altoMm: number;
}

/**
 * Código de barras en SVG (se imprime nítido a cualquier tamaño).
 * EAN-13 si el código lo es (los internos y casi todos los de fábrica); si no, Code 128,
 * que acepta cualquier texto. Las dos los lee cualquier pistola.
 */
export function CodigoBarras({ codigo, altoMm }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  // Code 128 acepta los caracteres ASCII visibles; con otros (una ñ, un acento) no se puede dibujar.
  const imprimible = esEAN13Valido(codigo) || /^[\x20-\x7e]+$/.test(codigo);

  useEffect(() => {
    const svg = ref.current;
    if (!svg || !imprimible) return;
    try {
      JsBarcode(svg, codigo, {
        format: esEAN13Valido(codigo) ? 'EAN13' : 'CODE128',
        width: 2,
        height: 50,
        fontSize: 18,
        textMargin: 1,
        margin: 0,
        background: 'transparent',
        lineColor: '#000',
        font: 'ui-monospace, Consolas, monospace',
      });
      // Se escala con CSS: el viewBox mantiene la proporción y el alto lo define la etiqueta.
      const ancho = parseFloat(svg.getAttribute('width') ?? '0');
      const alto = parseFloat(svg.getAttribute('height') ?? '0');
      svg.setAttribute('viewBox', `0 0 ${ancho} ${alto}`);
      svg.removeAttribute('width');
      svg.removeAttribute('height');
    } catch (error) {
      console.error('No se pudo dibujar el código de barras', codigo, error);
    }
  }, [codigo, imprimible]);

  if (!imprimible) {
    return <span style={{ fontSize: '7pt' }}>Código no imprimible: {codigo}</span>;
  }
  return (
    <svg
      ref={ref}
      role="img"
      aria-label={`Código de barras ${codigo}`}
      style={{ display: 'block', height: `${altoMm}mm`, width: 'auto', maxWidth: '100%' }}
    />
  );
}
