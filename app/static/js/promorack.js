import {
    resetInputStyles, esCodigoRepetido, vaciarTablaClientesAgregados,
    clientesAgregados, descargarClientesExcel, handleCentroChange, handleJefeZonaChange,
    verificarCondicionesCliente, incrementarContador, contadorClientes,
    disminiurContador, limpirContador, limpirContadorCambios
} from './utils.js';

export function loadPromorackData(data) {
    console.log("Datos cargados:", data); // Depuración: Verifica los datos cargados

    const transformedData = data.map(item => ({
        ...item,
        Centro: item.Centro || 'No Aplica',
        JefeZona: item.JefeZona || 'No Aplica'
    }));

    const centroSelect = $('#Centro');
    const centros = [...new Set(transformedData.map(item => item.Centro))];
    centros.forEach(Centro => centroSelect.append(new Option(Centro, Centro)));

    // Configuración de eventos sin Select2
    centroSelect.on('change', function () {
        const centro = $(this).val();
        console.log("Centro seleccionado:", centro); // Depuración: Verifica el centro seleccionado
        handleCentroChange(data, centro, '#jefeZona', '#cliente');
    });

    $('#jefeZona').on('change', function () {
        const jefeZona = $(this).val();
        const centro = $('#Centro').val();
        console.log("Jefe de Zona seleccionado:", jefeZona); // Depuración: Verifica el jefe de zona seleccionado
        handleJefeZonaChange(data, centro, jefeZona, '#cliente');
    });

    $('#cliente').on('change', function () {
        const cliente = $(this).val();
        const centro = $('#Centro').val();
        const jefeZona = $('#jefeZona').val();
        console.log("Cliente seleccionado:", cliente); // Depuración: Verifica el cliente seleccionado
        handleClienteChange(data, centro, jefeZona, cliente);
    });

    // Eventos de los botones
    $('#verificar').on('click', function () {
        const cliente = $('#cliente').val();
        console.log("Verificando cliente:", cliente); // Depuración: Verifica el cliente a verificar
        verifyCliente(data, cliente);
    });

    $('#agregar').on('click', function () {
        console.log("Agregando cliente..."); // Depuración: Verifica que se esté agregando un cliente
        agregarCliente(data);
    });

    $('#vaciarTablaPromorack').on('click', function () {
        console.log("Vaciando tabla..."); // Depuración: Verifica que se esté vaciando la tabla
        vaciarTablaClientesAgregados();
        limpirContador();
    });

    $('#descargarExcel').on('click', function () {
        console.log("Descargando Excel..."); // Depuración: Verifica que se esté descargando el Excel
        descargarClientesExcel();
        limpirContador();
        limpirContadorCambios();
    });
}

function actualizarContadorClientes() {
    $('#contadorPromorack').text(`: ${contadorClientes}`);
}

function handleClienteChange(data, selectedCentro, selectedJefeZona, selectedCliente) {
    console.log("Buscando cliente...", { selectedCentro, selectedJefeZona, selectedCliente }); // Depuración: Verifica los parámetros de búsqueda

    const clienteData = data.find(item =>
        (item.Centro || 'No Aplica') === (selectedCentro || 'No Aplica') &&
        (item.JefeZona || 'No Aplica') === (selectedJefeZona || 'No Aplica') &&
        item.CODCliente === selectedCliente
    );

    if (!clienteData) {
        console.log("Cliente no encontrado"); // Depuración: Verifica si no se encontró el cliente
        $('#resultado').text('No Aplica: Cliente no encontrado en la base de datos')
            .removeClass('aplica')
            .addClass('no-aplica alert alert-danger')
            .show();
        $('#agregar, #verificar').prop('disabled', true);
        $('#NombreComercial, #NombreClienteLegal, #Cluster, #DireccionNegocio').addClass('highlight-background');
        return;
    }

    console.log("Cliente encontrado:", clienteData); // Depuración: Verifica los datos del cliente encontrado

    // Asigna los valores del cliente encontrado a los campos
    $('#CODTerritorio').val(clienteData.CODTerritorio);
    $('#NombreComercial').val(clienteData.NombreClienteLegal);
    $('#NombreClienteLegal').val(clienteData.NombreComercial);
    $('#Cluster').val(clienteData.Cluster);
    $('#DireccionNegocio').val(clienteData.DireccionNegocio);

    // Destaca el campo Cluster si es 'mantener' o 'optimizar'
    if (['mantener', 'optimizar'].includes(clienteData.Cluster.toLowerCase())) {
        $('#Cluster').addClass('highlight-background');
    } else {
        $('#Cluster').removeClass('highlight-background');
    }

    $('#resultado, #mensaje').hide();
    $('#agregar').prop('disabled', true);
    $('#verificar').prop('disabled', false);
}

function verifyCliente(data, selectedCliente) {
    console.log("Verificando condiciones del cliente:", selectedCliente); // Depuración: Verifica el cliente a verificar

    const clienteDataList = data.filter(item => item.CODCliente === selectedCliente);

    const resultadoElement = $('#resultado');
    const agregarButton = $('#agregar');
    const mensajeElement = $('#mensaje');

    if (!clienteDataList.length) {
        console.log("Cliente no encontrado en la lista"); // Depuración: Verifica si no se encontró el cliente
        resultadoElement.text('No Aplica: Cliente no encontrado en la base de datos')
            .removeClass('aplica')
            .addClass('no-aplica alert alert-danger')
            .show();
        agregarButton.prop('disabled', true);
        mensajeElement.hide();
        return;
    }

    const clusterPermitidos = ['BLINDAR', 'ROMPER', 'DESARROLLAR'];
    const descripcionesExcluidas = ['PlanLealtad', 'BigCola', 'PromorackPI', 'PromorackMP'];

    const { cumpleCondiciones, mensaje } = verificarCondicionesCliente(clienteDataList, clusterPermitidos, descripcionesExcluidas);

    if (cumpleCondiciones) {
        console.log("Cliente cumple condiciones"); // Depuración: Verifica si el cliente cumple las condiciones
        resultadoElement.text('Aplica')
            .removeClass('no-aplica')
            .addClass('aplica alert alert-success')
            .show();
        agregarButton.prop('disabled', false);
        mensajeElement.hide();
    } else {
        console.log("Cliente no cumple condiciones:", mensaje); // Depuración: Verifica por qué no cumple las condiciones
        resultadoElement.text(`No Aplica: ${mensaje}`)
            .removeClass('aplica')
            .addClass('no-aplica alert alert-danger')
            .show();
        agregarButton.prop('disabled', true);
        mensajeElement.show();
    }
}

function agregarCliente(data) {
    const Centro = $('#Centro').val();
    const jefeZona = $('#jefeZona').val();
    const ruta = $('#CODTerritorio').val();
    const cliente = $('#cliente').val();
    const NombreComercial = $('#NombreComercial').val();
    const NombreClienteLegal = $('#NombreClienteLegal').val();
    const Cluster = $('#Cluster').val();
    const DireccionNegocio = $('#DireccionNegocio').val();
    const codigoCliente = cliente.slice(0, 13);

    if (esCodigoRepetido(codigoCliente)) {
        console.log("Código de cliente repetido"); // Depuración: Verifica si el código está repetido
        $('#mensajeRepetido').show();
        return;
    }

    $('#mensajeRepetido').hide();

    const nuevoCliente = {
        Centro: Centro,
        JefeZona: jefeZona,
        Ruta: ruta,
        CODCliente: codigoCliente,
        Nombre_de_Cliente: NombreComercial,
        Nombre_de_Negocio: NombreClienteLegal,
        Cluster: Cluster,
        DireccionNegocio: DireccionNegocio
    };

    clientesAgregados.push(nuevoCliente);

    console.log("Cliente agregado:", nuevoCliente); // Depuración: Verifica el cliente agregado

    $('#clientesAgregados tbody').append(`
        <tr>
            <td>${Centro}</td>
            <td>${jefeZona}</td>
            <td>${ruta}</td>
            <td>${codigoCliente}</td>
            <td>${NombreComercial}</td>
            <td>${NombreClienteLegal}</td>
            <td class="${['mantener', 'optimizar'].includes(Cluster.toLowerCase()) ? 'highlight-background' : ''}">${Cluster}</td>
            <td><button class="remove-button btn btn-danger btn-sm">Eliminar</button></td>
        </tr>
    `);

    incrementarContador();
    actualizarContadorClientes();
    $('#descargarExcel').prop('disabled', false);

    $('#clientesAgregados .remove-button').last().on('click', function () {
        const index = $(this).closest('tr').index();
        clientesAgregados.splice(index, 1);
        $(this).closest('tr').remove();
        disminiurContador();
        actualizarContadorClientes();
        $('#descargarExcel').prop('disabled', clientesAgregados.length === 0);
    });

    resetInputStyles();
    handleJefeZonaChange(data, Centro, jefeZona); // Recarga los clientes para el jefe de zona
    $('#CODTerritorio, #NombreComercial, #NombreClienteLegal, #Cluster, #DireccionNegocio').val('');
    $('#resultado, #mensaje').hide();
    $('#agregar, #verificar').prop('disabled', true);
}