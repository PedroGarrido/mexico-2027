# 🇲🇽 México 2027 · Planificador compartido

Web del viaje: https://pedrogarrido.github.io/mexico-2027/

## Estado

- Frontend publicado con GitHub Pages.
- Soporte de **Supabase preparado** (lectura pública, edición por correo autorizado, almacenamiento persistente, control de revisiones y refresco cada 30 segundos).
- **Aún no está conectado a ninguna base de datos**: `config.js` tiene URL y clave vacías. Hasta completar la configuración funciona en modo local y las ediciones **no se comparten**.
- El contenido del viaje sigue precargado en `index.html`. No se ha modificado ni borrado.
- El esquema de seguridad está en `supabase/schema.sql`.

## Activar Supabase

1. Crea un proyecto en https://supabase.com/dashboard o conecta Supabase a ChatGPT para que configuremos juntos el proyecto.
2. En el SQL Editor, ejecuta el contenido de `supabase/schema.sql` completo. No ejecutes instrucciones de permisos aisladas.
3. En SQL Editor, autoriza a la primera persona que podrá editar: `insert into public.trip_editors(email) values (lower('CORREO-DEL-EDITOR')) on conflict do nothing;`. Se pueden añadir otros correos más tarde. **No subas estos correos a GitHub.**
4. En **Authentication → URL Configuration**: Site URL `https://pedrogarrido.github.io/mexico-2027/` y añade esta misma URL a las redirecciones permitidas. Activa inicio de sesión por email con enlaces mágicos. Revisa límites de correo en el plan usado (puede requerir SMTP propio).
5. En **Project Settings → API** copia la URL del proyecto y la **publishable/anon key**, nunca la `service_role` ni una secret key. Edita `config.js`:

   ```javascript
   window.MEXICO_SUPABASE = {
     url: 'https://TU-PROYECTO.supabase.co',
     publishableKey: 'sb_publishable_...'
   };
   ```

6. Despliega los cambios en `main` (GitHub Pages lo publica automáticamente). Abre la web y entra en **Acceder para editar** con uno de los correos autorizados.
7. Desde **Datos y copias de seguridad**, el primer editor deberá pulsar **Publicar el itinerario inicial en Supabase**. Solo ocurre una vez. Hasta entonces, los visitantes ven la copia inicial en modo de consulta.
8. Confirma la edición desde dos navegadores diferentes: uno con acceso de editor y otro en modo consulta. La vista pública se refresca al abrir la web y, durante la sesión, cada 30 segundos.

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
