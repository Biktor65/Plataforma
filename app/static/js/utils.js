export let contadorCambios = 0;
export let clientesAgregados = []
export let contadorClientes = 0;

export function disableFields(fields) {
    fields.forEach(field => $(field).prop('disabled', true));
}

// utils.js
export function handleCentroChange(data, selectedCentro, jefeZonaSelector, clienteSelector) {
    const jefeZonaSelect = $(jefeZonaSelector);
    jefeZonaSelect.empty().append('<option value="">Selecciona un jefe de zona</option>');
    $(clienteSelector).empty().append('<option value="">Selecciona un cliente</option>').prop('disabled', true);

    resetInputStyles();
    disableFields([clienteSelector]);

    // Convertir valores null a 'No Aplica' en Centro
    const centros = data.map(item => ({
        ...item,
        Centro: item.Centro || 'No Aplica',
        JefeZona: item.JefeZona || 'No Aplica'
    }));

    const jefesZona = [...new Set(
        centros
            .filter(item => !selectedCentro || item.Centro === selectedCentro)
            .map(item => item.JefeZona)
    )];

    jefesZona.forEach(jefeZona => {
        jefeZonaSelect.append(new Option(jefeZona, jefeZona));
    });

    jefeZonaSelect.prop('disabled', false).select2();
}

export function handleJefeZonaChange(data, selectedCentro, selectedJefeZona, clienteSelector) {
    const clienteSelect = $(clienteSelector);
    clienteSelect.empty().append('<option value="">Selecciona un cliente</option>');

    resetInputStyles();
    disableFields([clienteSelector]);

    const clientes = data
        .filter(item => 
            (item.Centro || 'No Aplica') === (selectedCentro || 'No Aplica') &&
            (item.JefeZona || 'No Aplica') === (selectedJefeZona || 'No Aplica')
        );

    clientes.forEach(cliente => {
        const displayText = `${cliente.CODCliente} - ${cliente.NombreComercial}`;
        clienteSelect.append(new Option(displayText, cliente.CODCliente));
    });

    clienteSelect.prop('disabled', clientes.length === 0).select2();
}

export function handleJefeZonaChangeCambios(data, selectedCentro, selectedJefeZona, clienteSelector) {
    const clienteSelect = $(clienteSelector);
    clienteSelect.empty().append('<option value="">Selecciona un cliente</option>');

    resetInputStyles();
    disableFields([clienteSelector]);

    const clientes = data
        .filter(item => 
            (item.Centro || 'No Aplica') === (selectedCentro || 'No Aplica') &&
            (item.JefeZona || 'No Aplica') === (selectedJefeZona || 'No Aplica') &&
            item.Descripcion === 'PromorackPI'
        );

    clientes.forEach(cliente => {
        const displayText = `${cliente.CODCliente} - ${cliente.NombreComercial}`;
        clienteSelect.append(new Option(displayText, cliente.CODCliente));
    });

    clienteSelect.prop('disabled', clientes.length === 0).select2();
}

// utils.js

export function verificarCondicionesCliente(clienteDataList, clusterPermitidos, descripcionesExcluidas) {
    let mensaje = '';
    let cumpleCondiciones = true;

    // Verifica si algún cliente tiene un cluster no permitido
    const clienteConClusterNoPermitido = clienteDataList.find(cliente => !clusterPermitidos.includes(cliente.Cluster));
    if (clienteConClusterNoPermitido) {
        mensaje += `Cluster ${clienteConClusterNoPermitido.Cluster} no está permitido. `;
        cumpleCondiciones = false;
    }

    // Verifica si algún cliente tiene una descripción no permitida
    const clienteConDescripcionNoPermitida = clienteDataList.find(cliente => descripcionesExcluidas.includes(cliente.Descripcion));
    if (clienteConDescripcionNoPermitida) {
        mensaje += `Pertenece a ${clienteConDescripcionNoPermitida.Descripcion}.`;
        cumpleCondiciones = false;
    }

    return {
        cumpleCondiciones,
        mensaje
    };
}


export function resetInputStyles() {
    $('#nombreNegocio, #nombreCliente, #tipoCluster, #direccion').removeClass('highlight-background').css('background-color', 'white');
}

export function esCodigoRepetido(codigoCliente) {
    if (!Array.isArray(clientesAgregados)) {
        clientesAgregados = []; 
    }
    return clientesAgregados.some(cliente => cliente.CODCliente === codigoCliente);
}

export function vaciarTablaClientesAgregados() {
    clientesAgregados = [];
    $('#clientesAgregados tbody').empty();
    $('#descargarExcel').prop('disabled', true);
    $('#contadorPromorack').text(`: 0`);
}

export async function descargarClientesExcel() {
    console.log(clientesAgregados);

    if (clientesAgregados.length === 0) {
        alert("No hay clientes agregados para descargar.");
        return;
    }

    try {
        const usuarioResponse = await fetch('/auth/api/get_usuario_id', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        
        const responseData = await usuarioResponse.json();
    
        // Acceder al valor del UsuarioID
        const UsuarioID = responseData.UsuarioID;

        const respuesta = await fetch('/usuario/api/promorack/guardar_formulario', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                UsuarioID: UsuarioID,
                Detalles: clientesAgregados
            })
        });

        const data = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(data.error || 'Hubo un error al guardar los datos en la base de datos');
        }

        // Si los datos se guardan correctamente, proceder a la descarga del archivo Excel
        const clientesParaExcel = clientesAgregados.map(cliente => {
            const { DireccionNegocio, ...clienteSinDireccion } = cliente;
            return clienteSinDireccion;
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(clientesParaExcel);
        XLSX.utils.book_append_sheet(wb, ws, "Clientes Agregados");
        XLSX.writeFile(wb, "clientes_agregados.xlsx");

        // Vaciar tabla y reiniciar contador
        vaciarTablaClientesAgregados();
    } catch (error) {
        console.error('Error:', error);
        alert(error.message);
    }
}



export function incrementarContador() {
    contadorClientes++;
}

export function disminiurContador() {
    contadorClientes--;
}

export function incrementarContadorCambios() {
    contadorCambios++;
}

export function disminiurContadorCambios() {
    contadorCambios--;
}

export function limpirContador(){
    contadorClientes = 0;
}

export function limpirContadorCambios(){
    contadorCambios = 0;
}
