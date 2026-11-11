(function (root) {
    'use strict';
    if (root.TurnosFecha) return;
    const zona = 'America/Bogota';
    const vacio = '—';
    const dos = n => String(n).padStart(2, '0');
    const reloj = new Intl.DateTimeFormat('en-GB', {
        timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
    });

    function horaSimple(value) {
        if (typeof value !== 'string') return null;
        const m = value.trim().match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
        if (!m || +m[1] > 23 || +m[2] > 59 || +(m[3] || 0) > 59) return null;
        return {hour: +m[1], minute: +m[2], second: +(m[3] || 0)};
    }

    function parse(value) {
        if (value instanceof Date) return Number.isFinite(value.getTime()) ? new Date(value.getTime()) : null;
        if (typeof value !== 'string') return null;
        const m = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?(Z|[+-]\d{2}(?::?\d{2})?)?$/i);
        if (!m) return null;
        const year = +m[1], month = +m[2], day = +m[3];
        const hour = +m[4], minute = +m[5], second = +(m[6] || 0);
        const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
        const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        if (year < 1 || month < 1 || month > 12 || day < 1 || day > days[month - 1] || hour > 23 || minute > 59 || second > 59) return null;
        let offset = m[8] || '-05:00';
        if (/^z$/i.test(offset)) offset = 'Z';
        else {
            const z = offset.match(/^([+-])(\d{2})(?::?(\d{2}))?$/);
            if (!z || +z[2] > 23 || +(z[3] || 0) > 59) return null;
            offset = z[1] + z[2] + ':' + (z[3] || '00');
        }
        const millis = (m[7] || '').padEnd(3, '0').slice(0, 3);
        const date = new Date(m[1] + '-' + m[2] + '-' + m[3] + 'T' + m[4] + ':' + m[5] + ':' + dos(second) + '.' + millis + offset);
        return Number.isFinite(date.getTime()) ? date : null;
    }

    function partes(value) {
        const date = parse(value);
        if (!date) return null;
        const p = {};
        reloj.formatToParts(date).forEach(part => { if (part.type !== 'literal') p[part.type] = part.value; });
        return {year: p.year.padStart(4, '0'), month: p.month, day: p.day, hour: +p.hour, minute: +p.minute, second: +p.second};
    }
    function horaDePartes(p, options) {
        return (p.hour % 12 || 12) + ':' + dos(p.minute) + (options && options.segundos ? ':' + dos(p.second) : '') + (p.hour < 12 ? ' a. m.' : ' p. m.');
    }
    function hora(value, options) {
        const p = horaSimple(value) || partes(value);
        return p ? horaDePartes(p, options) : vacio;
    }
    function hora24(value) {
        const p = horaSimple(value) || partes(value);
        return p ? dos(p.hour) + ':' + dos(p.minute) : '';
    }
    function fechaHora(value, options) {
        const p = partes(value);
        if (!p) return vacio;
        let fecha = p.year + '-' + p.month + '-' + p.day;
        if (options && options.fecha === 'local') fecha = p.day + '/' + p.month + '/' + p.year;
        if (options && options.fecha === 'local-corta') fecha = Number(p.day) + '/' + Number(p.month) + '/' + p.year;
        const separador = options && options.separador === ', ' ? ', ' : ' ';
        return fecha + separador + horaDePartes(p, options);
    }
    root.TurnosFecha = Object.freeze({zona, parse, hora, hora24, fechaHora});
})(window);
