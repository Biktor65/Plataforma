import {resetInputStyles, handleCentroChange, handleJefeZonaChangeCambios, verificarCondicionesCliente, 
vaciarTablaClientesAgregados, clientesAgregados, contadorCambios, incrementarContador, 
incrementarContadorCambios,disminiurContadorCambios, descargarClientesExcel,limpirContadorCambios,limpirContador,
handleJefeZonaChange} from './utils.js';

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
    //

    const agregarButton = $('#agregarCambios');


    centroSelect.select2().on('change', function() {
        handleCentroChange(data, $(this).val(), '#jefeZonaCambios', '#clienteCambios');
    });

    $('#jefeZonaCambios').select2().on('change', function() {
        const centro = $('#centroCambios').val();
        const jefeZona = $('#jefeZonaCambios').val();

        if (estadoBoton === 'Activar') {
            handleJefeZonaChange(data, centro, jefeZona, '#clienteCambios'); // Mostrar todos los clientes para Activar
        } else {
            handleJefeZonaChangeCambios(data, centro, jefeZona, '#clienteCambios'); // Mostrar solo los aplicables a PromorackPI
        }
            
        //handleJefeZonaChangeCambios(data, $('#centroCambios').val(), $(this).val(), '#clienteCambios');
    });

    $('#clienteCambios').select2().on('change', function() {
        handleClienteChange(data, $('#centroCambios').val(), $('#jefeZonaCambios').val(), $(this).val());
    });

    $('#verificarCambios').on('click', function() {
        verifyClienteCambios(data, $('#clienteCambios').val());
    });

    $('#agregarCambios').on('click', function() {
        agregarClienteCambios(data);
    });

    $('#vaciarTablaCambios').on('click', function() {
        vaciarTablaClientesAgregados();
        limpirContador(); 
    });
    $('#descargarExcelCambios').on('click', function() {
        descargarClientesExcel(); 
        limpirContadorCambios();
        limpirContador();
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
            .addClass('no-aplica')
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

    if ($('#agregarCambios').text() === 'Desactivar'){
        agregarButton.prop('disabled',false)
    }
}

function alternarEstadoBoton() {
    if (estadoBoton === 'Desactivar') {
        // Cambia el estado a "Activar" después de desactivar y muestra el botón "Verificar"
        $('#verificarCambios').removeClass('btn-desactivar').addClass('btn-activar').show().prop('disabled', false);
        $('#agregarCambios').removeClass('btn-desactivar').addClass('btn-activar').text('Activar').show(); 
        estadoBoton = 'Activar';
    } else {
        // Cambia el estado a "Desactivar" y oculta el botón "Verificar"
        $('#verificarCambios').removeClass('btn-activar').addClass('btn-desactivar').hide(); 
        $('#agregarCambios').removeClass('btn-activar').addClass('btn-desactivar').text('Desactivar').prop('disabled', false).show();
        estadoBoton = 'Desactivar';
    }
}


// Verifica si el cliente cumple con las condiciones necesarias para aplicar Cambios
function verifyClienteCambios(data, selectedCliente) {
    const clienteDataList = data.filter(item => item.CODCliente === selectedCliente);

    const resultadoElement = $('#resultadoCambios');
    const agregarButton = $('#agregarCambios');
    const mensajeElement = $('#mensajeCambios');

    if (!clienteDataList.length) {
        resultadoElement.text('No Aplica: Cliente no encontrado en la base de datos').removeClass('aplica').addClass('no-aplica').show();
        agregarButton.prop('disabled', true);
        mensajeElement.hide();
        return;
    }

    const clusterPermitidos = ['BLINDAR', 'ROMPER', 'DESARROLLAR'];
    const descripcionesExcluidas = ['PlanLealtad', 'BigCola', 'PromorackPI', 'PromorackMP'];

    const { cumpleCondiciones, mensaje } = verificarCondicionesCliente(clienteDataList, clusterPermitidos, descripcionesExcluidas);

    if (cumpleCondiciones) {
        resultadoElement.text('Aplica').removeClass('no-aplica').addClass('aplica').show();
        agregarButton.prop('disabled', false).show(); // Habilita el botón "Activar" para aplicar cambios
        mensajeElement.hide();
    } else {
        resultadoElement.text(`No Aplica: ${mensaje}`).removeClass('aplica').addClass('no-aplica').show();
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


    $('#clientesAgregados tbody').append(`
        <tr>
            <td>${centro}</td>
            <td>${jefeZona}</td>
            <td>${ruta}</td>
            <td>${codigoCliente}</td>
            <td>${NombreClienteLegal}</td>
            <td>${NombreComercial}</td>
            <td>${estadoBoton}</td>
            <td><button class="remove-button">Eliminar</button></td>
        </tr>
    `);

    $('#descargarExcelCambios').prop('disabled', false); 

    // Maneja el evento de eliminación
    $('.remove-button').last().on('click', function() {
        const index = $(this).closest('tr').index(); // Obtiene el índice de la fila a eliminar
        clientesAgregados.splice(index, 1); // Elimina el cliente correspondiente de la lista clientesAgregados
        $(this).closest('tr').remove(); // Elimina la fila del DOM
    
        disminiurContadorCambios(); // Disminuye el contador de cambios
        $('#contadorCambios').text(`: ${contadorCambios}`); // Actualiza el contador en el DOM
    
        $('#descargarExcelCambios').prop('disabled', clientesAgregados.length === 0);
    });
    

    resetInputStyles();
    if (agregarButton.hasClass('btn-activar')) {
        // Cargar todos los clientes
        handleJefeZonaChangeCambios(data, centro, jefeZona, '#clienteCambios');
    } else {
        // Cargar solo los clientes que aplican a 'PromorackPI'
        handleJefeZonaChange(data, centro, jefeZona, '#clienteCambios');

    }
    //$('#clienteCambios').empty().append('<option value="">Selecciona un cliente</option>').prop('disabled', false).trigger('change');
    $('#rutaCambios, #NombreComercial, #NombreClienteLegal').val('');
    $('#resultadoCambios, #mensajeCambios').hide();
    $('#agregarCambios, #verificarCambios').prop('disabled', true);

    alternarEstadoBoton();

    incrementarContadorCambios();
    agregarButton.prop('disabled', true)
    $('#contadorCambios').text(`: ${contadorCambios}`);
}
