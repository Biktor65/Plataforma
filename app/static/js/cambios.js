import {
    resetInputStyles, handleCentroChange, handleJefeZonaChangeCambios, verificarCondicionesCliente,
    vaciarTablaClientesAgregados, clientesAgregados, contadorCambios, incrementarContador,
    incrementarContadorCambios, disminiurContadorCambios, descargarClientesExcel, limpirContadorCambios, limpirContador,
    handleJefeZonaChange
} from './utils.js';

let estadoBoton = 'Desactivar';

export function loadCambiosData(data) {
    const transformedData = data.map(item => ({
        ...item,
        Centro: item.Centro || 'No Aplica',
        JefeZona: item.JefeZona || 'No Aplica'
    }));
    const centroSelect = $('#centroCambios');
    const centros = [...new Set(transformedData.map(item => item.Centro))];
    centros.forEach(centro => centroSelect.append(new Option(centro, centro)));

    const agregarButton = $('#agregarCambios');

    // Configuración de eventos sin Select2
    centroSelect.on('change', function () {
        handleCentroChange(data, $(this).val(), '#jefeZonaCambios', '#clienteCambios');
    });

    $('#jefeZonaCambios').on('change', function () {
        const centro = $('#centroCambios').val();
        const jefeZona = $('#jefeZonaCambios').val();

        if (estadoBoton === 'Activar') {
            handleJefeZonaChange(data, centro, jefeZona, '#clienteCambios'); // Mostrar todos los clientes para Activar
        } else {
            handleJefeZonaChangeCambios(data, centro, jefeZona, '#clienteCambios'); // Mostrar solo los aplicables a PromorackPI
        }
    });

    $('#clienteCambios').on('change', function () {
        handleClienteChange(data, $('#centroCambios').val(), $('#jefeZonaCambios').val(), $(this).val());
    });

    // Eventos de los botones
    $('#verificarCambios').on('click', function () {
        verifyClienteCambios(data, $('#clienteCambios').val());
    });

    $('#agregarCambios').on('click', function () {
        agregarClienteCambios(data);
    });

    $('#vaciarTablaCambios').on('click', function () {
        vaciarTablaClientesAgregados();
        limpirContador();
        mostrarNotificacion('Éxito', 'La tabla ha sido vaciada correctamente.', 'success');
    });

    $('#descargarExcelCambios').on('click', function () {
        descargarClientesExcel();
        limpirContadorCambios();
        limpirContador();
        mostrarNotificacion('Éxito', 'El archivo Excel ha sido descargado correctamente.', 'success');
    });
}

// Maneja el cambio en el campo de Cliente
function handleClienteChange(data, selectedCentro, selectedJefeZona, selectedCliente) {
    const clienteData = data.find(item =>
        (item.Centro || 'No Aplica') === (selectedCentro || 'No Aplica') &&
        (item.JefeZona || 'No Aplica') === (selectedJefeZona || 'No Aplica') &&
        item.CODCliente === selectedCliente
    );
    const agregarButton = $('#agregarCambios');

    if (!clienteData) {
        $('#resultadoCambios').text('No Aplica: Cliente no encontrado en la base de datos')
            .removeClass('aplica')
            .addClass('no-aplica alert alert-danger')
            .show();
        $('#agregarCambios, #verificarCambios').prop('disabled', true);
        $('#rutaCambios, #NombreComercial, #NombreClienteLegal').val('');
        return;
    }

    // Actualiza los campos de cliente si se encuentra
    $('#rutaCambios').val(clienteData.CODTerritorio);
    $('#NombreComercial').val(clienteData.NombreComercial);
    $('#NombreClienteLegal').val(clienteData.NombreClienteLegal);
    $('#resultadoCambios').hide();

    if ($('#agregarCambios').text() === 'Desactivar') {
        agregarButton.prop('disabled', false);
    }
}

// Alternar estado del botón
function alternarEstadoBoton() {
    if (estadoBoton === 'Desactivar') {
        $('#verificarCambios').removeClass('btn-desactivar').addClass('btn-activar btn-success').show().prop('disabled', false);
        $('#agregarCambios').removeClass('btn-desactivar').addClass('btn-activar btn-primary').text('Activar').show();
        estadoBoton = 'Activar';
    } else {
        $('#verificarCambios').removeClass('btn-activar').addClass('btn-desactivar btn-secondary').hide();
        $('#agregarCambios').removeClass('btn-activar').addClass('btn-desactivar btn-primary').text('Desactivar').prop('disabled', false).show();
        estadoBoton = 'Desactivar';
    }
}

// Verifica si el cliente cumple con las condiciones
function verifyClienteCambios(data, selectedCliente) {
    const clienteDataList = data.filter(item => item.CODCliente === selectedCliente);

    const resultadoElement = $('#resultadoCambios');
    const agregarButton = $('#agregarCambios');
    const mensajeElement = $('#mensajeCambios');

    if (!clienteDataList.length) {
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
        resultadoElement.text('Aplica')
            .removeClass('no-aplica')
            .addClass('aplica alert alert-success')
            .show();
        agregarButton.prop('disabled', false).show();
        mensajeElement.hide();
    } else {
        resultadoElement.text(`No Aplica: ${mensaje}`)
            .removeClass('aplica')
            .addClass('no-aplica alert alert-danger')
            .show();
        agregarButton.prop('disabled', true);
        mensajeElement.show();
    }
}

// Agrega el cliente a la lista de Cambios
function agregarClienteCambios(data) {
    const agregarButton = $('#agregarCambios');
    const centro = $('#centroCambios').val();
    const jefeZona = $('#jefeZonaCambios').val();
    const ruta = $('#rutaCambios').val();
    const cliente = $('#clienteCambios').val();
    const NombreComercial = $('#NombreComercial').val();
    const NombreClienteLegal = $('#NombreClienteLegal').val();
    const codigoCliente = cliente.slice(0, 13);

    const nuevoCliente = {
        Centro: centro,
        JefeZona: jefeZona,
        Ruta: ruta,
        CODCliente: codigoCliente,
        Nombre_de_Cliente: NombreComercial,
        Nombre_de_Negocio: NombreClienteLegal,
        Accion: estadoBoton
    };

    clientesAgregados.push(nuevoCliente);

    // Agregar fila con animación
    $('#clientesAgregados tbody').append(`
        <tr class="fade-in">
            <td>${centro}</td>
            <td>${jefeZona}</td>
            <td>${ruta}</td>
            <td>${codigoCliente}</td>
            <td>${NombreClienteLegal}</td>
            <td>${NombreComercial}</td>
            <td>${estadoBoton}</td>
            <td><button class="remove-button btn btn-danger btn-sm">Eliminar</button></td>
        </tr>
    `).hide().fadeIn(500);

    // Habilitar botón de descargar Excel
    $('#descargarExcelCambios').prop('disabled', false);

    // Manejar eliminación de fila
    $('.remove-button').last().on('click', function () {
        $(this).closest('tr').fadeOut(500, function () {
            $(this).remove();
        });
        disminiurContadorCambios();
        $('#contadorCambios').text(`: ${contadorCambios}`);
        $('#descargarExcelCambios').prop('disabled', clientesAgregados.length === 0);
    });

    // Resetear campos y actualizar estado
    resetInputStyles();
    $('#rutaCambios, #NombreComercial, #NombreClienteLegal').val('');
    $('#resultadoCambios, #mensajeCambios').hide();
    $('#agregarCambios, #verificarCambios').prop('disabled', true);

    alternarEstadoBoton();
    incrementarContadorCambios();
    agregarButton.prop('disabled', true);
    $('#contadorCambios').text(`: ${contadorCambios}`);

    // Notificación de éxito
    mostrarNotificacion('Éxito', 'El cliente ha sido agregado correctamente.', 'success');
}

// Función para mostrar notificaciones con SweetAlert 1.x
function mostrarNotificacion(titulo, mensaje, tipo) {
    swal({
        title: titulo,
        text: mensaje,
        icon: tipo, // 'success', 'error', 'warning', 'info'
        button: "Aceptar"
    });
}