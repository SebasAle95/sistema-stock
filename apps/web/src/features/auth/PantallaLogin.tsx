'use client';

import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import LoginRoundedIcon from '@mui/icons-material/LoginRounded';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import { alpha, darken, lighten } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { negocio, type ConfigNegocio } from '@stock/shared';
import Image from 'next/image';
import type { ReactNode } from 'react';

// Tipado como la interfaz para que compile también en un negocio sin logo.
const { logo, tema }: ConfigNegocio = negocio;
const { primario, secundario } = tema;

/**
 * Fondo de la pantalla, armado con los colores del negocio. Son varias capas
 * apiladas: la primera de la lista queda adelante y la última, atrás.
 * Las líneas de la cancha están en public/fondo-cancha.svg.
 */
const fondo = [
  `radial-gradient(ellipse at 10% 12%, ${alpha(secundario, 0.4)}, transparent 50%)`,
  `radial-gradient(ellipse at 92% 92%, ${alpha(lighten(primario, 0.4), 0.45)}, transparent 55%)`,
  'url(/fondo-cancha.svg) center / cover no-repeat',
  `linear-gradient(160deg, ${darken(primario, 0.6)} 0%, ${primario} 55%, ${darken(primario, 0.4)} 100%)`,
].join(', ');

interface Props {
  titulo: string;
  subtitulo?: string;
  children: ReactNode;
}

/**
 * Pantalla del login: en escritorio, un panel de vidrio con el formulario a la
 * izquierda y la marca a la derecha; en celular, la marca arriba y el formulario abajo.
 */
export function PantallaLogin({ titulo, subtitulo, children }: Props) {
  return (
    <Box
      component="main"
      sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', p: { xs: 2, md: 4 }, background: fondo }}
    >
      {/* Panel de vidrio: solo existe desde md (900 px) para arriba */}
      <Box
        sx={{
          width: '100%',
          maxWidth: { xs: 440, md: 1080 },
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 400px) 1fr', lg: '440px 1fr' },
          alignItems: 'center',
          gap: { xs: 4, md: 6 },
          p: { md: 5, lg: 6 },
          borderRadius: '32px',
          bgcolor: { md: 'rgba(255, 255, 255, 0.06)' },
          border: { md: '1px solid rgba(255, 255, 255, 0.12)' },
          backdropFilter: { md: 'blur(14px)' },
          boxShadow: { md: '0 30px 80px rgba(0, 0, 0, 0.35)' },
        }}
      >
        <Marca />

        {/* `order: -1` lo pasa a la izquierda en escritorio, sin cambiar el orden de lectura */}
        <Card elevation={0} sx={{ order: { md: -1 }, borderRadius: '24px', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)' }}>
          <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
            <Stack spacing={1} sx={{ alignItems: 'center', textAlign: 'center', mb: 4 }}>
              <Avatar
                variant="rounded"
                sx={{ width: 56, height: 56, mb: 1, borderRadius: '16px', color: secundario, bgcolor: alpha(secundario, 0.14) }}
              >
                <LoginRoundedIcon />
              </Avatar>
              <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
                {titulo}
              </Typography>
              {subtitulo && (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {subtitulo}
                </Typography>
              )}
            </Stack>
            {children}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

/** Logo en un círculo blanco (con anillos, como el círculo central de la cancha), nombre y bajada. */
function Marca() {
  return (
    <Stack spacing={{ xs: 3, lg: 5 }} sx={{ alignItems: 'center', textAlign: 'center', color: 'common.white' }}>
      <Box
        sx={{
          width: { xs: 120, md: 220, lg: 300 },
          aspectRatio: '1',
          borderRadius: '50%',
          bgcolor: 'common.white',
          display: 'grid',
          placeItems: 'center',
          boxShadow:
            '0 0 0 10px rgba(255, 255, 255, 0.08), 0 0 0 22px rgba(255, 255, 255, 0.04), 0 24px 60px rgba(0, 0, 0, 0.45)',
        }}
      >
        {logo ? (
          // `fill` hace que la imagen ocupe esta caja; `objectFit: contain` la ajusta sin recortarla
          <Box sx={{ position: 'relative', width: '76%', height: '86%' }}>
            <Image
              src={logo.src}
              alt={logo.alt}
              fill
              sizes="(min-width: 1200px) 230px, (min-width: 900px) 170px, 92px"
              loading="eager"
              style={{ objectFit: 'contain' }}
            />
          </Box>
        ) : (
          <Inventory2OutlinedIcon sx={{ fontSize: { xs: 48, md: 96 }, color: primario }} />
        )}
      </Box>

      <Box>
        <Typography
          component="p"
          sx={{ fontWeight: 700, lineHeight: 1.2, fontSize: { xs: '1.5rem', md: '1.75rem', lg: '2.25rem' } }}
        >
          {negocio.nombre}
        </Typography>
        <Typography
          sx={{
            display: { xs: 'none', md: 'block' },
            mt: 1,
            fontSize: { md: '1.05rem', lg: '1.25rem' },
            color: lighten(secundario, 0.3),
          }}
        >
          Ventas, stock y caja en un solo lugar
        </Typography>
      </Box>
    </Stack>
  );
}
