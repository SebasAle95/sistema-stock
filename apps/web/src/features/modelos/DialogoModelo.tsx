'use client';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
  erroresDeCampos,
  erroresDeCamposDeApi,
  esquemaAgregarCombinaciones,
  esquemaEditarModelo,
  esquemaNuevoModelo,
  nombreVariante,
  parsearNumero,
  type Categoria,
  type ErroresDeCampos,
  type Modelo,
} from '@stock/shared';
import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { CampoDinero } from '@/components/CampoDinero';
import { useSesion } from '@/features/auth/SesionProvider';
import { Ganancia } from '@/features/productos/DialogoProducto';
import { SelectorCategoria } from '@/features/productos/SelectorCategoria';
import { api, ErrorDeApi, mensajeDeError } from '@/lib/apiClient';
import { claveCombinacion, GrillaStock, unidades } from './GrillaStock';
import { SelectorCurva } from './SelectorCurva';

type Props = (
  | { modo: 'crear' }
  /** Nombre, categoría, precio, costo y stock mínimo: se aplican a todas las combinaciones. */
  | { modo: 'editar'; modelo: Modelo }
  /** Talles o colores nuevos para un modelo que ya existe. */
  | { modo: 'agregar'; modelo: Modelo }
) & {
  categorias: Categoria[];
  alCrearCategoria: (categoria: Categoria) => void;
  alCerrar: () => void;
  alGuardar: (modelo: Modelo, mensaje: string) => void;
};

const texto = (valor: number | null | undefined) => (valor === null || valor === undefined ? '' : String(valor));
const plural = (n: number, uno: string, varios: string) => (n === 1 ? `1 ${uno}` : `${n} ${varios}`);

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <Box component="section">
      <Typography variant="overline" component="h2" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
        {titulo}
      </Typography>
      {children}
    </Box>
  );
}

export function DialogoModelo(props: Props) {
  const { modo, categorias, alCrearCategoria, alCerrar, alGuardar } = props;
  const modelo = props.modo === 'crear' ? undefined : props.modelo;
  const { tienePermiso } = useSesion();
  const verCostos = tienePermiso('productos.ver_costos');
  const tema = useTheme();
  const pantallaChica = useMediaQuery(tema.breakpoints.down('sm'));

  const [datos, setDatos] = useState({
    nombre: modelo?.nombre ?? '',
    categoriaId: modelo?.categoria?.id ?? null,
    precioVenta: texto(modelo?.precioVenta),
    precioCosto: texto(modelo?.precioCosto),
    stockMinimo: texto(modelo?.stockMinimo ?? 0),
  });
  const [talles, setTalles] = useState<string[]>(modelo?.talles ?? []);
  const [colores, setColores] = useState<string[]>(modelo?.colores ?? []);
  const [stocks, setStocks] = useState<Record<string, string>>({});
  const [errores, setErrores] = useState<ErroresDeCampos>({});
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const existentes = useMemo(
    () => new Map((modelo?.variantes ?? []).map((v) => [claveCombinacion(v.talle, v.color), v.stock])),
    [modelo],
  );

  function cambiar<C extends keyof typeof datos>(campo: C, valor: (typeof datos)[C]) {
    setDatos((actuales) => ({ ...actuales, [campo]: valor }));
    setErrores((actuales) => ({ ...actuales, [campo]: undefined }));
  }

  const numeros = {
    precioVenta: parsearNumero(datos.precioVenta),
    precioCosto: parsearNumero(datos.precioCosto),
    stockMinimo: parsearNumero(datos.stockMinimo) ?? 0,
  };

  /** Las combinaciones de la grilla que todavía no existen, con su stock inicial. */
  function combinacionesNuevas() {
    const filas = colores.length > 0 ? colores : [null];
    const columnas = talles.length > 0 ? talles : [null];
    return filas.flatMap((color) =>
      columnas.flatMap((talle) => {
        const clave = claveCombinacion(talle, color);
        return existentes.has(clave) ? [] : [{ talle, color, stockInicial: unidades(stocks[clave]) }];
      }),
    );
  }

  /** Datos del modelo que cambiaron (al editar no se manda lo que quedó igual). */
  function cambiosDelModelo(): Record<string, unknown> {
    const todos: Record<string, unknown> = {
      nombre: datos.nombre.trim(),
      categoriaId: datos.categoriaId,
      precioVenta: numeros.precioVenta,
      stockMinimo: numeros.stockMinimo,
      ...(verCostos ? { precioCosto: numeros.precioCosto } : {}),
    };
    if (!modelo) return todos;
    const anteriores: Record<string, unknown> = {
      nombre: modelo.nombre,
      categoriaId: modelo.categoria?.id ?? null,
      precioVenta: modelo.precioVenta,
      stockMinimo: modelo.stockMinimo,
      precioCosto: modelo.precioCosto ?? null,
    };
    return Object.fromEntries(Object.entries(todos).filter(([campo, valor]) => valor !== anteriores[campo]));
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setMensaje(null);

    if (modo !== 'agregar') {
      const invalidos = Object.entries(numeros).filter(([, n]) => n !== null && Number.isNaN(n));
      if (invalidos.length > 0) {
        setErrores(Object.fromEntries(invalidos.map(([campo]) => [campo, 'Ingresá un número válido'])));
        return;
      }
    }

    const combinaciones = combinacionesNuevas();
    if (modo !== 'editar') {
      if (talles.length === 0 && colores.length === 0) {
        setMensaje('Elegí al menos un talle o un color.');
        return;
      }
      if (combinaciones.length === 0) {
        setMensaje('Elegí al menos un talle o un color nuevo.');
        return;
      }
      if (combinaciones.some((c) => c.stockInicial === null)) {
        setMensaje('Revisá el stock marcado en rojo: tiene que ser un número entero.');
        return;
      }
    }

    let cuerpo: unknown;
    if (modo === 'crear') {
      const validacion = esquemaNuevoModelo.safeParse({ ...cambiosDelModelo(), combinaciones });
      if (!validacion.success) {
        const deCampos = erroresDeCampos(validacion.error);
        setErrores(deCampos);
        if (deCampos.combinaciones) setMensaje(deCampos.combinaciones);
        return;
      }
      cuerpo = validacion.data;
    } else if (modo === 'editar') {
      const cambios = cambiosDelModelo();
      if (Object.keys(cambios).length === 0) {
        alCerrar();
        return;
      }
      const validacion = esquemaEditarModelo.safeParse(cambios);
      if (!validacion.success) {
        setErrores(erroresDeCampos(validacion.error));
        return;
      }
      cuerpo = validacion.data;
    } else {
      const validacion = esquemaAgregarCombinaciones.safeParse({ combinaciones });
      if (!validacion.success) {
        setMensaje(erroresDeCampos(validacion.error).combinaciones ?? 'Revisá los talles y colores.');
        return;
      }
      cuerpo = validacion.data;
    }

    setEnviando(true);
    try {
      if (modo === 'crear') {
        const creado = await api.post<Modelo>('/modelos', cuerpo);
        alGuardar(creado, `"${creado.nombre}" creado con ${plural(creado.variantes.length, 'combinación', 'combinaciones')}.`);
      } else if (modo === 'editar' && modelo) {
        const editado = await api.patch<Modelo>(`/modelos/${modelo.id}`, cuerpo);
        alGuardar(editado, `"${editado.nombre}" guardado en sus ${editado.variantes.length} combinaciones.`);
      } else if (modelo) {
        const ampliado = await api.post<Modelo>(`/modelos/${modelo.id}/combinaciones`, cuerpo);
        alGuardar(ampliado, `${plural(combinaciones.length, 'combinación agregada', 'combinaciones agregadas')} a "${ampliado.nombre}".`);
      }
    } catch (error) {
      const deCampos = error instanceof ErrorDeApi ? erroresDeCamposDeApi(error.detalles) : {};
      if (Object.keys(deCampos).length > 0 && !deCampos.combinaciones) setErrores(deCampos);
      else setMensaje(deCampos.combinaciones ?? mensajeDeError(error));
      setEnviando(false);
    }
  }

  const ejemplo = nombreVariante(datos.nombre.trim() || 'Remera básica', colores[0] ?? 'Negro', talles[0] ?? 'M');
  const titulos = { crear: 'Nuevo modelo', editar: 'Editar modelo', agregar: 'Agregar talles o colores' };
  const botones = { crear: 'Crear modelo', editar: 'Guardar', agregar: 'Agregar' };

  const camposDelModelo = (
    <Stack spacing={2.5}>
      <TextField
        label="Nombre del modelo"
        fullWidth
        autoFocus
        value={datos.nombre}
        onChange={(e) => cambiar('nombre', e.target.value)}
        error={Boolean(errores.nombre)}
        helperText={errores.nombre ?? `Sin talle ni color. Cada combinación se va a llamar "${ejemplo}".`}
      />
      <SelectorCategoria
        categorias={categorias}
        valor={datos.categoriaId}
        alCambiar={(id) => cambiar('categoriaId', id)}
        alCrear={alCrearCategoria}
        error={errores.categoriaId}
      />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <CampoDinero
          label="Precio de venta"
          fullWidth
          valor={datos.precioVenta}
          alCambiar={(v) => cambiar('precioVenta', v)}
          error={Boolean(errores.precioVenta)}
          helperText={errores.precioVenta}
        />
        {verCostos && (
          <CampoDinero
            label="Precio de costo"
            fullWidth
            valor={datos.precioCosto}
            alCambiar={(v) => cambiar('precioCosto', v)}
            error={Boolean(errores.precioCosto)}
            helperText={errores.precioCosto ?? 'Opcional. Solo lo ven los administradores.'}
          />
        )}
      </Stack>
      <Ganancia venta={numeros.precioVenta} costo={numeros.precioCosto} />
      <TextField
        label="Stock mínimo por combinación"
        value={datos.stockMinimo}
        onChange={(e) => cambiar('stockMinimo', e.target.value)}
        error={Boolean(errores.stockMinimo)}
        helperText={errores.stockMinimo ?? 'Avisa cuando de un talle y color quedan estas unidades o menos.'}
        slotProps={{ htmlInput: { inputMode: 'numeric' } }}
        sx={{ maxWidth: { sm: 280 } }}
      />
    </Stack>
  );

  const curva = (
    <>
      <Seccion titulo="Talles y colores">
        <SelectorCurva
          talles={talles}
          colores={colores}
          alCambiarTalles={setTalles}
          alCambiarColores={setColores}
          tallesFijos={modelo?.talles}
          coloresFijos={modelo?.colores}
          bloquearTalles={
            modelo && modelo.talles.length === 0 ? 'Este modelo no tiene talles. Para otra curva, creá otro modelo.' : undefined
          }
          bloquearColores={
            modelo && modelo.colores.length === 0 ? 'Este modelo no tiene colores. Para otra curva, creá otro modelo.' : undefined
          }
        />
      </Seccion>
      {(talles.length > 0 || colores.length > 0) && (
        <Seccion titulo={modo === 'agregar' ? 'Stock de las combinaciones nuevas' : 'Stock de cada combinación'}>
          <GrillaStock talles={talles} colores={colores} valores={stocks} alCambiar={setStocks} existentes={existentes} />
        </Seccion>
      )}
    </>
  );

  return (
    <Dialog
      open
      onClose={enviando ? undefined : alCerrar}
      fullWidth
      maxWidth={modo === 'editar' ? 'sm' : 'md'}
      fullScreen={pantallaChica && modo !== 'editar'}
    >
      <Box component="form" noValidate onSubmit={enviar}>
        <DialogTitle>
          {titulos[modo]}
          {modelo && modo === 'agregar' && (
            <Typography sx={{ color: 'text.secondary' }}>{modelo.nombre}</Typography>
          )}
        </DialogTitle>
        <DialogContent dividers={modo !== 'editar'}>
          <Stack spacing={3} sx={{ pt: modo === 'editar' ? 1 : 0 }}>
            {mensaje && <Alert severity="error">{mensaje}</Alert>}

            {modo === 'crear' && (
              <>
                <Seccion titulo="Datos del modelo">{camposDelModelo}</Seccion>
                <Divider />
                {curva}
                <Alert severity="info" variant="outlined">
                  Cada combinación recibe su código para imprimir la etiqueta. Si una prenda ya trae código de fábrica,
                  después lo escaneás tocando esa combinación.
                </Alert>
              </>
            )}

            {modo === 'editar' && modelo && (
              <>
                {camposDelModelo}
                <Alert severity="info" variant="outlined">
                  Los cambios se aplican a las {modelo.variantes.length} combinaciones. Si alguna tenía un precio propio y
                  cambiás el precio acá, queda con el nuevo.
                </Alert>
              </>
            )}

            {modo === 'agregar' && curva}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button color="inherit" onClick={alCerrar} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" loading={enviando}>
            {botones[modo]}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
