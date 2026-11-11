document.addEventListener('DOMContentLoaded', function () {
    'use strict';
    const source = document.getElementById('pqrStatsData'); if (!source) return;
    const data = JSON.parse(source.textContent), colors = ['#17365d', '#205b88', '#1595a3', '#76a82b', '#d49a25', '#aa5867', '#64839b', '#456a64', '#89739c'];
    Object.keys(data.groups).forEach(function (key) {
        const el = document.getElementById('pqrChart-' + key); if (!el) return;
        let rows = data.groups[key]; if (key !== 'meses' && rows.length > 12) rows = rows.slice(0, 12);
        const options = {
            chart: {type: key === 'meses' ? 'area' : 'bar', height: 320, fontFamily: 'inherit', foreColor: '#526a80', toolbar: {show: false}, animations: {enabled: false}},
            series: [{name: data.unit || 'PQR', data: rows.map(r => Number(r.cantidad))}], colors: key === 'meses' ? ['#1595a3'] : colors,
            plotOptions: {bar: {horizontal: key !== 'meses', borderRadius: 4, distributed: key !== 'meses', barHeight: '66%'}},
            dataLabels: {enabled: false}, legend: {show: false}, stroke: {curve: 'straight', width: key === 'meses' ? 2 : 0},
            xaxis: {categories: rows.map(r => r.etiqueta.replace(/_/g, ' ')), min: key === 'meses' ? undefined : 0, tickAmount: key === 'meses' ? undefined : 4, decimalsInFloat: 0, labels: {formatter: key === 'meses' ? undefined : v => Math.round(Number(v)).toLocaleString('es-CO')}},
            yaxis: {min: key === 'meses' ? 0 : undefined, labels: {maxWidth: 195}}, grid: {borderColor: '#e6edf3'}, tooltip: {y: {formatter: n => Number(n).toLocaleString('es-CO') + ' ' + (data.unit || 'PQR')}}, noData: {text: 'Sin datos para estos filtros'},
            responsive: [{breakpoint: 480, options: {chart: {height: 310}, yaxis: {labels: {maxWidth: 125, style: {fontSize: '10px'}}}}}]
        };
        new ApexCharts(el, options).render();
    });
    const filters = document.getElementById('pqrStatsFilters');
    const initial = Array.from(filters.elements).filter(el => el.name).map(el => [el, el.value]);
    document.getElementById('pqrStatsFilter').addEventListener('hide.bs.modal', function () {
        initial.forEach(function (entry) {
            const el = entry[0]; el.value = entry[1];
            if (el._flatpickr) el._flatpickr.setDate(entry[1] || null, false);
        });
        if (window.jQuery && jQuery(filters).data('validator')) jQuery(filters).validate().resetForm();
        filters.querySelectorAll('.is-invalid,.is-valid').forEach(el => el.classList.remove('is-invalid', 'is-valid'));
    });
    document.getElementById('pqrStatsFilter').addEventListener('hidden.bs.modal', function () {
        requestAnimationFrame(function () {
            const trigger = document.querySelector('[data-bs-target="#pqrStatsFilter"]');
            if (trigger) trigger.focus({preventScroll: true});
        });
    });
    if (window.PqrValidation) PqrValidation.init(filters);
    filters.addEventListener('submit', function (event) { if (window.PqrValidation && !PqrValidation.validForm(filters)) event.preventDefault(); });
});
