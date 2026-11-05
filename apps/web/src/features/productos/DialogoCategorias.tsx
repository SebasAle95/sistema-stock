'use client';

import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { esquemaCategoria, erroresDeCampos, type Categoria } from '@stock/shared';
import { useState, type FormEvent } from 'react';
import { api, mensajeDeError } from '@/lib/apiClient';

interface Props {
  categorias: Categoria[];
  /** Se llama después de cada cambio, para recargar categorías y productos. */
  alCambiar: () => void;
  alCerrar: () => void;
}

/** Alta, renombre y baja de categorías. */
export function DialogoCategorias({ categorias, alCambiar, alCerrar }: Props) {
  const [nueva, setNueva] = useState('');
  const [edicion, setEdicion] = useState<{ id: string; nombre: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function ejecutar(accion: () => Promise<unknown>) {
    setError(null);
    setOcupado(true);
    try {
      await accion();
      alCambiar();
      return true;
    } catch (e) {
      setError(mensajeDeError(e));
      return false;
    } finally {
      setOcupado(false);
    }
  }

  async function agregar(evento: FormEvent) {
    evento.preventDefault();
    const validacion = esquemaCategoria.safeParse({ nombre: nueva });
    if (!validacion.success) return setError(erroresDeCampos(validacion.error).nombre ?? 'Nombre inválido');
    if (await ejecutar(() => api.post('/categorias', validacion.data))) setNueva('');
  }

  async function guardarEdicion() {
    if (!edicion) return;
    const validacion = esquemaCategoria.safeParse({ nombre: edicion.nombre });
    if (!validacion.success) return setError(erroresDeCampos(validacion.error).nombre ?? 'Nombre inválido');
    if (await ejecutar(() => api.patch(`/categorias/${edicion.id}`, validacion.data))) setEdicion(null);
  }

  async function eliminar(categoria: Categoria) {
    const aviso =
      categoria.cantidadProductos > 0
        ? `¿Eliminar "${categoria.nombre}"? Sus ${categoria.cantidadProductos} productos quedan sin categoría.`
        : `¿Eliminar "${categoria.nombre}"?`;
    if (window.confirm(aviso)) await ejecutar(() => api.delete(`/categorias/${categoria.id}`));
  }

  return (
    <Dialog open onClose={alCerrar} fullWidth maxWidth="xs">
      <DialogTitle>Categorías</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}

          <Stack component="form" direction="row" spacing={1} onSubmit={agregar} sx={{ pt: 1 }}>
            <TextField
              label="Nueva categoría"
              size="small"
              fullWidth
              value={nueva}
              onChange={(e) => setNueva(e.target.value)}
              placeholder="Por ejemplo: Bebidas"
            />
            <Button type="submit" variant="contained" disabled={ocupado}>
              Agregar
            </Button>
          </Stack>

          {categorias.length === 0 ? (
            <Typography sx={{ color: 'text.secondary', py: 2, textAlign: 'center' }}>Todavía no hay categorías.</Typography>
          ) : (
            <List dense disablePadding>
              {categorias.map((categoria) =>
                edicion?.id === categoria.id ? (
                  <ListItem key={categoria.id} disableGutters sx={{ gap: 1 }}>
                    <TextField
                      size="small"
                      fullWidth
                      autoFocus
                      value={edicion.nombre}
                      onChange={(e) => setEdicion({ ...edicion, nombre: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') void guardarEdicion();
                        if (e.key === 'Escape') setEdicion(null);
                      }}
                    />
                    <IconButton aria-label="Guardar" onClick={() => void guardarEdicion()} disabled={ocupado}>
                      <CheckIcon />
                    </IconButton>
                    <IconButton aria-label="Cancelar" onClick={() => setEdicion(null)}>
                      <CloseIcon />
                    </IconButton>
                  </ListItem>
                ) : (
                  <ListItem
                    key={categoria.id}
                    disableGutters
                    secondaryAction={
                      <>
                        <Tooltip title="Renombrar">
                          <IconButton aria-label={`Renombrar ${categoria.nombre}`} onClick={() => setEdicion(categoria)}>
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton aria-label={`Eliminar ${categoria.nombre}`} onClick={() => void eliminar(categoria)}>
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    }
                  >
                    <ListItemText
                      primary={categoria.nombre}
                      secondary={`${categoria.cantidadProductos} ${categoria.cantidadProductos === 1 ? 'producto' : 'productos'}`}
                    />
                  </ListItem>
                ),
              )}
            </List>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={alCerrar}>Listo</Button>
      </DialogActions>
    </Dialog>
  );
}
