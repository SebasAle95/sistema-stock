'use client';

import { useEffect, useRef } from 'react';

/** Una lectora "teclea" mucho más rápido que una persona: más de este intervalo entre teclas = persona. */
const MS_MAXIMO_ENTRE_TECLAS = 80;
const LARGO_MINIMO = 4;

function esCampoDeTexto(elemento: EventTarget | null): boolean {
  if (!(elemento instanceof HTMLElement)) return false;
  return elemento.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(elemento.tagName);
}

/**
 * Detecta lecturas de la pistola de código de barras en cualquier parte de la pantalla.
 *
 * Las lectoras USB funcionan como un teclado: escriben el código muy rápido y
 * apretan Enter. Este hook junta esas teclas y, al llegar el Enter, llama a
 * `alLeer(codigo)`. Si el foco está en un campo de texto no hace nada: ahí el
 * campo recibe el código y maneja su propio Enter.
 */
export function useLectorCodigoBarras(alLeer: (codigo: string) => void, activo = true) {
  const callback = useRef(alLeer);

  useEffect(() => {
    callback.current = alLeer;
  }, [alLeer]);

  useEffect(() => {
    if (!activo) return;

    let buffer = '';
    let ultimaTecla = 0;

    function alTeclear(evento: KeyboardEvent) {
      if (esCampoDeTexto(evento.target) || evento.ctrlKey || evento.altKey || evento.metaKey) return;

      const ahora = performance.now();
      if (ahora - ultimaTecla > MS_MAXIMO_ENTRE_TECLAS) buffer = '';
      ultimaTecla = ahora;

      if (evento.key === 'Enter') {
        if (buffer.length >= LARGO_MINIMO) {
          evento.preventDefault(); // que el Enter no "toque" el botón que tenga el foco
          callback.current(buffer);
        }
        buffer = '';
        return;
      }

      if (evento.key.length === 1) buffer += evento.key;
    }

    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [activo]);
}

/** true si lo escrito en un buscador parece un código de barras (solo números, 4 o más). */
export function pareceCodigoDeBarras(texto: string): boolean {
  return /^\d{4,64}$/.test(texto.trim());
}
