import { resetInputStyles, esCodigoRepetido, vaciarTablaClientesAgregados, 
clientesAgregados, descargarClientesExcel, handleCentroChange, handleJefeZonaChange,
verificarCondicionesCliente,incrementarContador,contadorClientes,
disminiurContador,limpirContador,limpirContadorCambios} from './utils.js';


export function loadPromorackData(data) {
    const transformedData = data.map(item => ({
        ...item,
        Centro: item.Centro || 'No Aplica',
        JefeZona: item.JefeZona || 'No Aplica'
    }));    
    const centroSelect = $('#Centro');
    const centros = [...new Set(transformedData.map(item => item.Centro))];
    centros.forEach(Centro => centroSelect.append(new Option(Centro, Centro)));

    centroSelect.select2().on('change', function() {
        handleCentroChange(data, $(this).val(), '#jefeZona', '#cliente');
    });

    $('#jefeZona').select2().on('change', function() {
        handleJefeZonaChange(data, $('#Centro').val(), $(this).val(), '#cliente');
    });

    $('#cliente').select2().on('change', function() {
        handleClienteChange(data, $('#Centro').val(), $('#jefeZona').val(), $(this).val());
    });

    $('#verificar').on('click', function() {
        verifyCliente(data, $('#cliente').val());
    });

    $('#agregar').on('click', function() {
        agregarCliente(data);
    });
    $('#vaciarTablaPromorack').on('click', function() {
        vaciarTablaClientesAgregados();
        limpirContador(); 
    });

    $('#descargarExcel').on('click', function() {
        descargarClientesExcel(); 
        limpirContador(); 
        limpirContadorCambios(); 
    });
}

function actualizarContadorClientes() {
    $('#contadorPromorack').text(`: ${contadorClientes}`);
}




function handleClienteChange(data, selectedCentro, selectedJefeZona, selectedCliente) { 
    const clienteData = data.find(item => 
        (item.Centro || 'No Aplica') === (selectedCentro || 'No Aplica') &&
        (item.JefeZona || 'No Aplica') === (selectedJefeZona || 'No Aplica') &&
        item.CODCliente === selectedCliente
    );

    if (!clienteData) {
        $('#resultado').text('No Aplica: Cliente no encontrado en la base de datos').removeClass('aplica').addClass('no-aplica').show();
        $('#agregar, #verificar').prop('disabled', true);
        $('#NombreComercial, #NombreClienteLegal, #Cluster, #DireccionNegocio').addClass('highlight-background');
        return;
    }

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
    const clienteDataList = data.filter(item => item.CODCliente === selectedCliente);

    const resultadoElement = $('#resultado');
    const agregarButton = $('#agregar');
    const mensajeElement = $('#mensaje');

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
        agregarButton.prop('disabled', false);
        mensajeElement.hide();
    } else {
        resultadoElement.text(`No Aplica: ${mensaje}`).removeClass('aplica').addClass('no-aplica').show();
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

    $('#clientesAgregados tbody').append(`
        <tr>
            <td>${Centro}</td>
            <td>${jefeZona}</td>
            <td>${ruta}</td>
            <td>${codigoCliente}</td>
            <td>${NombreComercial}</td>
            <td>${NombreClienteLegal}</td>
            <td class="${['mantener', 'optimizar'].includes(Cluster.toLowerCase()) ? 'highlight-background' : ''}">${Cluster}</td>
            <td><button class="remove-button">Eliminar</button></td>
        </tr>
    `);

    incrementarContador()
    actualizarContadorClientes();
    $('#descargarExcel').prop('disabled', false); 

    $('#clientesAgregados .remove-button').last().on('click', function() {
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

