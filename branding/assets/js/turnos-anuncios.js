(function (root) {
    'use strict';
    class TurnosAnuncios {
        constructor(anunciar, opciones) {
            this.anunciar = anunciar;
            this.now = (opciones && opciones.now) || Date.now;
            this.cola = [];
            this.vistos = new Map();
            this.activos = new Map();
            this.habilitado = false;
            this.ocupado = false;
            this.conectado = true;
        }
        fecha(valor) { return Date.parse(String(valor || '').replace(' ', 'T') + '-05:00'); }
        vigente(e, limitarEdad) {
            const fecha = this.fecha(e.creado_en);
            return Number.isFinite(fecha) && (!limitarEdad || this.now() - fecha <= 120000)
                && this.activos.get(Number(e.id)) === this.destino(e);
        }
        destino(e) { return [Number(e.modulo_id),Number(e.puesto_id||0),Number(e.etapa||1)].join(':'); }
        actualizar(eventos, activos) {
            const recuperando = !this.conectado;
            this.activos = new Map((activos || []).map(t => [Number(t.id), this.destino(t)]));
            for (const [id, fecha] of this.vistos) if (this.now() - fecha > 180000) this.vistos.delete(id);
            for (const e of eventos || []) {
                const id = String(e.evento_id);
                if (!this.vistos.has(id) && this.vigente(e, true)) {
                    this.vistos.set(id, this.now());
                    this.cola.push(e);
                }
            }
            this.cola = this.cola.filter(e => this.vigente(e, recuperando));
            this.conectado = true;
            this.procesar();
        }
        activar() { this.habilitado = true; this.procesar(); }
        desconectar() { this.conectado = false; }
        async procesar() {
            if (!this.habilitado || this.ocupado || !this.conectado) return;
            this.ocupado = true;
            try {
                while (this.habilitado && this.conectado && this.cola.length) {
                    const e = this.cola.shift();
                    if (!this.vigente(e)) continue;
                    try { await this.anunciar(e); }
                    catch (_) { this.cola.unshift(e); this.habilitado = false; }
                }
            } finally { this.ocupado = false; }
        }
    }
    root.TurnosAnuncios = TurnosAnuncios;
    if (typeof module !== 'undefined' && module.exports) module.exports = TurnosAnuncios;
})(typeof window !== 'undefined' ? window : globalThis);
