(function (window, document) {
  'use strict';
  if (window.TurnosAvisos) return;

  var pendientes = [], visibles = 0, contenedor, observador;
  var iniciado = false, detenido = false;
  var MAX_VISIBLES = 3;

  function ubicar() {
    if (!contenedor) return;
    var encabezado = document.getElementById('page-topbar');
    var borde = encabezado ? encabezado.getBoundingClientRect().bottom : 0;
    contenedor.style.top = Math.max(12, borde + 12) + 'px';
  }

  function hayDialogo() {
    return document.hidden || !!document.querySelector('.swal2-container, .modal.show, .modal.showing');
  }

  function vaciar() {
    if (!iniciado || detenido || hayDialogo()) return;
    while (pendientes.length && visibles < MAX_VISIBLES) presentar(pendientes.shift());
  }

  function presentar(aviso) {
    var elemento = document.createElement('div');
    elemento.className = 'toast turnos-aviso turnos-aviso--' + aviso.tipo;
    elemento.setAttribute('role', 'status');
    elemento.setAttribute('aria-atomic', 'true');
    var cabecera = document.createElement('div');
    cabecera.className = 'toast-header';
    var icono = document.createElement('i');
    icono.className = aviso.tipo === 'success' ? 'ri-checkbox-circle-line' : 'ri-information-line';
    icono.setAttribute('aria-hidden', 'true');
    var titulo = document.createElement('strong');
    titulo.className = 'me-auto';
    titulo.textContent = aviso.titulo;
    var cerrar = document.createElement('button');
    cerrar.type = 'button';
    cerrar.className = 'btn-close';
    cerrar.setAttribute('data-bs-dismiss', 'toast');
    cerrar.setAttribute('aria-label', 'Cerrar aviso');
    var cuerpo = document.createElement('div');
    cuerpo.className = 'toast-body';
    cuerpo.textContent = aviso.mensaje;
    cabecera.append(icono, titulo, cerrar);
    elemento.append(cabecera, cuerpo);
    contenedor.appendChild(elemento);
    visibles++;
    ubicar();

    var instancia = new window.bootstrap.Toast(elemento, {autohide: true, delay: 3000, animation: false});
    elemento.addEventListener('hidden.bs.toast', function () {
      instancia.dispose();
      elemento.remove();
      visibles--;
      aviso.resolver();
      vaciar();
    }, {once: true});
    instancia.show();
  }

  function iniciar() {
    if (iniciado || detenido) return;
    contenedor = document.createElement('div');
    contenedor.className = 'toast-container turnos-avisos';
    contenedor.setAttribute('aria-live', 'polite');
    contenedor.setAttribute('aria-atomic', 'false');
    document.body.appendChild(contenedor);
    iniciado = true;
    ubicar();
    // SweetAlert agrega y retira su contenedor directamente de body. No se altera
    // su API ni sus promesas; los avisos esperan a que termine el diálogo.
    observador = new MutationObserver(function () { if (pendientes.length) vaciar(); });
    observador.observe(document.body, {childList: true});
    document.addEventListener('hidden.bs.modal', vaciar);
    document.addEventListener('visibilitychange', vaciar);
    window.addEventListener('resize', ubicar);
    vaciar();
  }

  window.TurnosAvisos = Object.freeze({
    mostrar: function (titulo, mensaje, tipo) {
      tipo = tipo || 'success';
      if (tipo !== 'success' && tipo !== 'info') {
        throw new TypeError('Los errores y advertencias deben conservar su diálogo.');
      }
      return new Promise(function (resolver) {
        if (detenido) { resolver(); return; }
        pendientes.push({titulo: String(titulo || ''), mensaje: String(mensaje || ''), tipo: tipo, resolver: resolver});
        vaciar();
      });
    }
  });

  window.addEventListener('pagehide', function () {
    detenido = true;
    if (observador) observador.disconnect();
    document.removeEventListener('hidden.bs.modal', vaciar);
    document.removeEventListener('visibilitychange', vaciar);
    window.removeEventListener('resize', ubicar);
    pendientes.length = 0;
    if (contenedor) {
      contenedor.querySelectorAll('.toast').forEach(function (elemento) {
        var instancia = window.bootstrap.Toast.getInstance(elemento);
        if (instancia) instancia.dispose();
      });
      contenedor.remove();
    }
    contenedor = null;
    visibles = 0;
    iniciado = false;
  });
  window.addEventListener('pageshow', function (evento) {
    if (evento.persisted) { detenido = false; iniciar(); }
  });
  // La plantilla carga Bootstrap después de la vista, antes de DOMContentLoaded.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar, {once: true});
  else iniciar();
})(window, document);
