# 🇲🇽 México 2027 · Planificador compartido

Web del viaje: https://pedrogarrido.github.io/mexico-2027/

## Diseño · Mexicano elegante

La web conserva las flores y el papel picado de `fiesta.css`, y aplica encima la paleta **Mexicano elegante** mediante `elegante.css`, cargado al final en `index.html`. Así se puede ajustar o revertir el aspecto sin modificar lógica, datos ni Supabase.

- Crema `#FFF8F2`: fondo general.
- Burdeos `#65083F`: profundidad, navegación y velo del banner.
- Rosa mexicano `#B91070`: botones y selección activa.
- Turquesa `#009D98`: indicadores y foco accesible.
- Amarillo cempasúchil `#F5B82E`: detalles festivos y énfasis.
- Ciruela `#30172F`: texto principal.

Los tokens centrales `--mx-*` se definen en `elegante.css`. Los KPI comparten fondos neutros con una línea de acento; el banner mantiene su fotografía original con un degradado burdeos también en móvil. La hoja incluye estilos de impresión.


## Estado (20 de noviembre de 2026)

- Frontend publicado con GitHub Pages.
- **Supabase conectado** mediante la clave publicable desde `config.js`.
- Tablas `trip_documents` y `trip_editors` creadas con RLS. La auditoría de seguridad no detectó avisos en el momento de la configuración.
- **Datos iniciales cargados en la base de datos** (18 planes, 11 actividades, 21 tareas, 8 personas, 7 referencias de reservas, 3 partidas de presupuesto y 5 notas).
- Lectura pública activada; acceso anónimo sin escritura.
- **Pendiente:** añadir correos autorizados a `trip_editors` y configurar el dominio de GitHub Pages en Authentication → URL Configuration para iniciar sesión por email.
- Las modificaciones realizadas anteriormente en el navegador no se han importado: si existían, conservan su copia local y deben exportarse a JSON para migrarlas.

## Activar la edición por correo

1. La base de datos y conexión pública ya están preparadas. **No hace falta volver a ejecutar `schema.sql` ni crear otro proyecto.**
2. Elige el correo que quieres autorizar como editor. Agrégalo desde SQL Editor (o pídele a ChatGPT que lo haga con autorización):
   ```sql
   insert into public.trip_editors(email)
   values (lower('CORREO-DEL-EDITOR'))
   on conflict do nothing;
   ```
3. En **Supabase → Authentication → URL Configuration**, configura la Site URL a `https://pedrogarrido.github.io/mexico-2027/` e incluye `https://pedrogarrido.github.io/mexico-2027/**` en Redirect URLs permitidas.
4. Comprueba que **Authentication → Providers → Email** está habilitado y permite enviar un enlace mágico de acceso. El servicio de correo predeterminado tiene límites; para uso intensivo puede hacer falta SMTP propio.
5. Abre la web, pulsa **Acceder para editar** y confirma el enlace enviado al correo autorizado.
6. La información inicial **ya está publicada** en `trip_documents`: no necesitas pulsar ningún botón de inicialización.
7. Prueba un cambio desde una sesión autorizada y observa el resultado desde otra ventana. La consulta se refresca al cargar o cada 30 segundos.

## Antes de migrar los datos locales

Si alguien ha editado la versión anterior, debe entrar en ella y exportar su **copia JSON** antes de activar Supabase. Después, un editor autorizado puede importarla desde **Datos y copias de seguridad** y publicarla como versión común. **La importación reemplaza todo el documento compartido**, así que conviene exportar antes una copia actual.

## Privacidad y seguridad

- **Cualquier persona con la URL puede leer el contenido compartido**, incluidas las notas y la sección de reservas.
- Solo las cuentas con correos añadidos a `trip_editors` pueden escribir (reglas RLS en PostgreSQL); esconder botones en el frontend no es la medida de seguridad principal.
- Nunca guardes números de pasaporte, tarjetas, localizadores de vuelo, documentos o datos financieros sensibles ni claves `secret/service_role` en el repositorio ni en las notas compartidas.
- La aplicación usa guardado con revisión: si dos personas actualizan la misma versión, se rechaza la segunda modificación y se vuelven a cargar los datos.
- El refresco automático es **sondeo cada 30 segundos**, no tiempo real.
- El proyecto de GitHub Pages sigue siendo estático; no expone credenciales de administrador.

## Actualizaciones desde ChatGPT

Podemos seguir actualizando el código en GitHub. Una vez que se carguen datos reales en Supabase, **editar solo el HTML o el objeto STARTER no actualizará los datos ya existentes en PostgreSQL**. Para cambiar el planning común desde ChatGPT habrá que usar el conector autorizado de Supabase o acceder con un usuario editor y aplicar allí la modificación.
