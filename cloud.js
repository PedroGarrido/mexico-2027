(function () {
  'use strict';
  const settings = window.MEXICO_SUPABASE || {};
  const configured = Boolean(settings.url && settings.publishableKey);
  const state = {
    configured, ready: !configured, error: '', docExists: false, revision: null,
    data: null, user: null, editor: false, busy: false
  };
  let client = null;
  let changeListener = null;
  let refreshing = false;

  function notify() { if (changeListener) changeListener(state); }
  function requireClient() {
    if (!configured) throw new Error('La base de datos todavía no está configurada.');
    if (!client) throw new Error('No se pudo cargar la librería de Supabase.');
    return client;
  }
  function validTrip(d) {
    return d && d.version === 1 && ['itinerary', 'activities', 'budget', 'bookings', 'tasks', 'people', 'notes']
      .every(key => Array.isArray(d[key]));
  }
  function explain(error) {
    return (error && (error.message || error.details || String(error))) || 'Error desconocido';
  }

  async function loadRemote() {
    const sb = requireClient();
    const { data, error } = await sb.from('trip_documents')
      .select('data, revision, updated_at')
      .eq('id', 'mexico-2027').maybeSingle();
    if (error) throw error;
    if (data && !validTrip(data.data)) throw new Error('Los datos compartidos tienen un formato no compatible.');
    state.docExists = Boolean(data);
    state.revision = data ? data.revision : null;
    state.data = data ? data.data : null;
    state.error = '';
    state.ready = true;
    notify();
    return state.data;
  }

  async function reloadAuth() {
    if (!client) return;
    try {
      const { data, error } = await client.auth.getUser();
      if (error && error.name !== 'AuthSessionMissingError') throw error;
      state.user = data && data.user ? data.user : null;
      state.editor = false;
      if (state.user && state.user.email) {
        const { data: allowed, error: allowedError } = await client
          .from('trip_editors').select('email')
          .eq('email', state.user.email.toLowerCase()).maybeSingle();
        if (allowedError) throw allowedError;
        state.editor = Boolean(allowed);
      }
      state.error = '';
    } catch (error) {
      state.editor = false;
      state.error = explain(error);
    }
    notify();
  }

  async function init() {
    if (!configured) return;
    try {
      if (!window.supabase || !window.supabase.createClient) {
        throw new Error('Falta la librería de Supabase. Comprueba que el navegador permite cargarla.');
      }
      client = window.supabase.createClient(settings.url, settings.publishableKey);
      client.auth.onAuthStateChange(() => {
        setTimeout(() => { void reloadAuth(); }, 0);
      });
      await Promise.all([loadRemote(), reloadAuth()]);
      setInterval(async () => {
        if (state.busy || document.getElementById('editForm') || document.getElementById('loginForm')) return;
        if (refreshing) return;
        refreshing = true;
        try { await loadRemote(); } catch (error) { state.error = explain(error); notify(); }
        finally { refreshing = false; }
      }, 30000);
    } catch (error) {
      state.error = explain(error);
      state.ready = true;
      notify();
    }
  }

  async function save(nextData) {
    const sb = requireClient();
    if (!state.editor || !state.docExists) throw new Error('No tienes permiso de edición o la base de datos no está inicializada.');
    if (state.busy) throw new Error('Hay otra operación de guardado en curso.');
    if (!validTrip(nextData)) throw new Error('Formato de datos no válido.');
    state.busy = true;
    notify();
    try {
      const { data, error } = await sb.from('trip_documents')
        .update({ data: nextData })
        .eq('id', 'mexico-2027')
        .eq('revision', state.revision)
        .select('revision').maybeSingle();
      if (error) throw error;
      if (!data) {
        await loadRemote();
        throw new Error('Alguien ha guardado una versión más reciente. Se ha recargado el viaje; revisa los cambios e inténtalo de nuevo.');
      }
      state.revision = data.revision;
      state.data = nextData;
      state.error = '';
      notify();
      return true;
    } finally {
      state.busy = false;
      notify();
    }
  }

  async function publishStarter(data) {
    const sb = requireClient();
    if (!state.editor || state.docExists) throw new Error('Solo un editor puede publicar los datos iniciales.');
    if (!validTrip(data)) throw new Error('Datos iniciales inválidos.');
    state.busy = true; notify();
    try {
      const { data: created, error } = await sb.from('trip_documents')
        .insert({ id: 'mexico-2027', data })
        .select('revision').single();
      if (error) throw error;
      state.docExists = true;
      state.revision = created.revision;
      state.data = data;
      state.error = '';
      notify();
    } finally {
      state.busy = false; notify();
    }
  }

  async function emailSignIn(email) {
    const sb = requireClient();
    const { error } = await sb.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin + window.location.pathname }
    });
    if (error) throw error;
  }
  async function signOut() {
    const sb = requireClient();
    const { error } = await sb.auth.signOut();
    if (error) throw error;
    state.user = null; state.editor = false; notify();
  }

  window.MexicoCloud = {
    state, init, loadRemote, reloadAuth, save, publishStarter, emailSignIn, signOut,
    onChange(fn) { changeListener = fn; },
    explain
  };
})();
