import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { negocio, type ConfigNegocio } from '@stock/shared';
import Image from 'next/image';
import type { ReactNode } from 'react';

const { logo, lema, nombre }: ConfigNegocio = negocio;

interface Props {
  titulo: string;
  subtitulo?: string;
  children: ReactNode;
}

/**
 * Login del estilo "boutique": pantalla partida, plana y sin efectos.
 * A un lado la marca sobre fondo claro; al otro, el formulario sobre blanco.
 * En celular, la marca arriba (más chica) y el formulario abajo.
 */
export function PantallaLoginBoutique({ titulo, subtitulo, children }: Props) {
  return (
    <Box
      component="main"
      sx={{
        minHeight: '100dvh',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1.1fr 1fr' },
        bgcolor: 'background.paper',
      }}
    >
      {/* Marca */}
      <Box
        sx={{
          bgcolor: 'background.default',
          // El color va explícito: con el ancho responsive, MUI no toma borderColor.
          borderRight: { md: '1px solid var(--mui-palette-divider)' },
          borderBottom: { xs: '1px solid var(--mui-palette-divider)', md: 'none' },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          px: 4,
          py: { xs: 4, md: 8 },
        }}
      >
        {logo ? (
          <Box sx={{ position: 'relative', width: { xs: 140, md: 220 }, height: { xs: 98, md: 154 } }}>
            <Image src={logo.src} alt={logo.alt} fill priority sizes="(min-width: 900px) 220px, 140px" style={{ objectFit: 'contain' }} />
          </Box>
        ) : (
          <Inventory2OutlinedIcon sx={{ fontSize: 72, color: 'primary.main' }} />
        )}
        <Box sx={{ display: { xs: 'none', md: 'block' }, mt: 5 }}>
          <Typography variant="h3" component="p">
            {nombre}
          </Typography>
          {lema && (
            <Typography
              sx={{ mt: 1.5, fontFamily: 'var(--font-titulos), Georgia, serif', fontStyle: 'italic', fontSize: '1.3rem', color: 'text.secondary' }}
            >
              {lema}
            </Typography>
          )}
          <Box sx={{ width: 40, height: 2, bgcolor: 'primary.main', mx: 'auto', mt: 4 }} />
        </Box>
      </Box>

      {/* Formulario */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', px: { xs: 3, sm: 6 }, py: { xs: 5, md: 8 } }}>
        <Box sx={{ width: '100%', maxWidth: 380 }}>
          <Typography variant="overline" sx={{ color: 'primary.main', display: 'block' }}>
            Sistema de stock y caja
          </Typography>
          <Typography variant="h4" component="h1" sx={{ mt: 0.5 }}>
            {titulo}
          </Typography>
          {subtitulo && <Typography sx={{ color: 'text.secondary', mt: 1 }}>{subtitulo}</Typography>}
          <Box sx={{ mt: 4 }}>{children}</Box>
        </Box>
      </Box>
    </Box>
  );
}
