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

// Función para redirigir a la edición del formulario
function editarFormulario(formularioID) {
    fetch(`/admin/api/formularios/${formularioID}`)
        .then(response => response.json())
        .then(data => {
            const modalTitle = document.getElementById('editarFormularioModalLabel');
            modalTitle.setAttribute('data-formulario-id', formularioID); // Guardamos el ID en el modal

            const tbody = document.getElementById('tablaDetalles');
            tbody.innerHTML = "";

            if (!data.Detalles || data.Detalles.length === 0) {
                tbody.innerHTML = `<tr><td colspan="8" class="text-center">No hay registros disponibles.</td></tr>`;
                return;
            }

            data.Detalles.forEach(detalle => {
                const row = document.createElement('tr');
                row.setAttribute('data-id', detalle.DetalleID);
                row.setAttribute('onmouseover', 'mostrarEliminarIcono(this)');
                row.setAttribute('onmouseout', 'ocultarEliminarIcono(this)');

                row.innerHTML = `
                    <td ondblclick="convertirEditable(this)">${detalle.Centro}</td>
                    <td ondblclick="convertirEditable(this)">${detalle.JefeZona}</td>
                    <td ondblclick="convertirEditable(this)">${detalle.Ruta}</td>
                    <td ondblclick="convertirEditable(this)">${detalle.CODCliente}</td>
                    <td ondblclick="convertirEditable(this)">${detalle.NombreCliente}</td>
                    <td ondblclick="convertirEditable(this)">${detalle.NombreNegocio}</td>
                    <td ondblclick="convertirEditable(this)">${detalle.Cluster}</td>
                    <td class="delete-icon-cell">
                        <i class="fas fa-trash text-danger delete-icon" onclick="eliminarFila(this)" style="display: none; cursor: pointer;"></i>
                    </td>
                `;
                tbody.appendChild(row);
            });

            var myModal = new bootstrap.Modal(document.getElementById('editarFormularioModal'));
            myModal.show();
        })
        .catch(error => {
            console.error('Error al obtener datos del formulario:', error);
            alert('No se pudo cargar el formulario.');
        });
}

// Función para mostrar el icono de eliminar cuando el mouse está sobre la fila
function mostrarEliminarIcono(fila) {
    const icono = fila.querySelector('.delete-icon');
    if (icono) {
        icono.style.display = "inline-block";
    }
}

// Función para ocultar el icono de eliminar cuando el mouse sale de la fila
function ocultarEliminarIcono(fila) {
    const icono = fila.querySelector('.delete-icon');
    if (icono) {
        icono.style.display = "none";
    }
}

// Función para eliminar una fila
function eliminarFila(icono) {
    const fila = icono.closest('tr');
    fila.remove();
}

// Función para hacer la celda editable al hacer doble clic
function convertirEditable(celda) {
    let valorActual = celda.innerText;
    let input = document.createElement("input");
    input.type = "text";
    input.value = valorActual;
    input.classList.add("form-control", "p-1");
    input.onblur = function () {
        celda.innerText = input.value;
    };
    celda.innerHTML = "";
    celda.appendChild(input);
    input.focus();
}

// Función para guardar los cambios en la base de datos
function guardarCambios() {
    const formularioID = document.getElementById('editarFormularioModalLabel').getAttribute('data-formulario-id');
    
    if (!formularioID) {
        alert("Error: No se encontró el ID del formulario.");
        return;
    }

    const tbody = document.getElementById('tablaDetalles');
    const rows = tbody.querySelectorAll('tr:not(.fila-eliminada)'); // Solo filas NO eliminadas
    const detalles = [];

    rows.forEach(row => {
        const detalleID = row.getAttribute('data-id');
        const celdas = row.querySelectorAll("td");
        detalles.push({
            DetalleID: detalleID,
            Centro: celdas[0].innerText,
            JefeZona: celdas[1].innerText,
            Ruta: celdas[2].innerText,
            CODCliente: celdas[3].innerText,
            NombreCliente: celdas[4].innerText,
            NombreNegocio: celdas[5].innerText,
            Cluster: celdas[6].innerText
        });
    });

    // Enviar cambios de edición y eliminaciones en la misma petición
    fetch(`/admin/actualizar_formulario/${formularioID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            Detalles: detalles,
            Eliminaciones: filasParaEliminar
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert('Error: ' + data.error);
        } else {
            alert('Cambios guardados correctamente');
            location.reload();  // Recargar la página para reflejar los cambios
        }
    })
    .catch(error => {
        console.error('Error al guardar cambios:', error);
        alert('Error al guardar cambios.');
    });
}

// Función para aprobar formulario
function aprobarFormulario(formularioID) {
    fetch(`/admin/actualizar_estado/${formularioID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Estado: 'Aprobado' })
    })
    .then(response => response.json())
    .then(data => {
        alert('Formulario aprobado con éxito');
        location.reload();
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al aprobar el formulario: ' + error.message);
    });
}

// Función para descargar formulario
function descargarFormulario(formularioID) {
    window.location.href = `/admin/formularios/descargar/${formularioID}`;
}

let filasParaEliminar = []; 

function eliminarFila(icono) {
    const fila = icono.closest('tr');
    const detalleID = fila.getAttribute('data-id');

    if (!detalleID) {
        alert("Error: No se encontró el ID del registro.");
        return;
    }

    if (!confirm("¿Estás seguro de que deseas eliminar este registro?")) {
        return;
    }

    filasParaEliminar.push(detalleID); 
    fila.classList.add("fila-eliminada"); 
}