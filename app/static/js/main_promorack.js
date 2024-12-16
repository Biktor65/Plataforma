import { loadPromorackData } from './promorack.js';
import { loadCambiosData } from './cambios.js';

async function loadData() {
    try {
        const response = await fetch('/usuario/api/promorack');
        const data = await response.json();
        console.log("Data cargada desde SQL:", data);

        loadPromorackData(data);
        loadCambiosData(data);
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

$(document).ready(function() {
    loadData();

    $('#tabPromorack').on('click', function() {
        toggleTabs(this, '#tabCambios', '#containerPromorack', '#containerCambios');
    });

    $('#tabCambios').on('click', function() {
        toggleTabs(this, '#tabPromorack', '#containerCambios', '#containerPromorack');
    });
});

function toggleTabs(activeTab, inactiveTab, activeContainer, inactiveContainer) {
    $(activeTab).addClass('active').prop('disabled', true);
    $(inactiveTab).removeClass('active').prop('disabled', false);
    $(activeContainer).addClass('active').show();
    $(inactiveContainer).removeClass('active').hide();
}

