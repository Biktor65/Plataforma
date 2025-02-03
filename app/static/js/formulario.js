function editarFormulario(formularioID) {
    window.location.href = `/admin/formularios/editar/${formularioID}`;
}

function aprobarFormulario(formularioID) {
    fetch(`/admin/actualizar_estado/${formularioID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Estado: 'Aprobado' })
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => { throw new Error(text) });
        }
        return response.json();
    })
    .then(data => {
        alert('Formulario aprobado con éxito');
        location.reload();
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al aprobar el formulario: ' + error.message);
    });
}

function descargarFormulario(formularioID) {
    window.location.href = `/admin/formularios/descargar/${formularioID}`;
}

function editarFormulario(formularioID) {
    fetch(`/admin/api/formularios/${formularioID}`)
        .then(response => response.json())
        .then(data => {
            // Llenar los campos de solo lectura (Formulario)
            document.getElementById('formularioID').value = data.FormularioID;
            document.getElementById('usuarioID').value = data.UsuarioID;
            document.getElementById('estado').value = data.Estado;
            document.getElementById('fechaCreacion').value = data.FechaCreacion;

            // Llenar los detalles editables (FormularioData)
            const detallesDiv = document.getElementById('detallesFormulario');
            detallesDiv.innerHTML = '';  // Limpiar contenido anterior
            if (data.detalles) {
                data.detalles.forEach(detalle => {
                    const detalleHTML = `
                        <div class="mb-3">
                            <label class="form-label">Detalle ID: ${detalle.DetalleID}</label>
                            <input type="text" class="form-control" name="centro" value="${detalle.Centro}">
                            <input type="text" class="form-control" name="jefeZona" value="${detalle.JefeZona}">
                            <input type="text" class="form-control" name="ruta" value="${detalle.Ruta}">
                            <input type="text" class="form-control" name="codCliente" value="${detalle.CODCliente}">
                            <input type="text" class="form-control" name="nombreCliente" value="${detalle.NombreCliente}">
                            <input type="text" class="form-control" name="nombreNegocio" value="${detalle.NombreNegocio}">
                            <input type="text" class="form-control" name="cluster" value="${detalle.Cluster}">
                            <button class="btn btn-danger btn-sm" onclick="eliminarDetalle(${detalle.DetalleID})">Eliminar</button>
                        </div>
                    `;
                    detallesDiv.innerHTML += detalleHTML;
                });
            }

            // Mostrar el modal
            new bootstrap.Modal(document.getElementById('editarFormularioModal')).show();
        })
        .catch(error => console.error('Error:', error));
}

function guardarCambios() {
    const formularioID = document.getElementById('formularioID').value;

    const detalles = [];
    document.querySelectorAll('#detallesFormulario .mb-3').forEach(detalle => {
        detalles.push({
            DetalleID: detalle.querySelector('label').textContent.split(': ')[1],
            Centro: detalle.querySelector('input[name="centro"]').value,
            JefeZona: detalle.querySelector('input[name="jefeZona"]').value,
            Ruta: detalle.querySelector('input[name="ruta"]').value,
            CODCliente: detalle.querySelector('input[name="codCliente"]').value,
            NombreCliente: detalle.querySelector('input[name="nombreCliente"]').value,
            NombreNegocio: detalle.querySelector('input[name="nombreNegocio"]').value,
            Cluster: detalle.querySelector('input[name="cluster"]').value
        });
    });

    fetch(`/actualizar_formulario/${formularioID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Detalles: detalles })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        location.reload();
    })
    .catch(error => console.error('Error:', error));
}