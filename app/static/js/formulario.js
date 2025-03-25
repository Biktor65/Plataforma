document.addEventListener("DOMContentLoaded", function () {
    obtenerFormulariosDiarios();
    cargarGraficoFormularios();
    cargarGraficoComparacionAprobados(); 
});

function cargarGraficoComparacionAprobados() {
    fetch('/admin/api/comparacion_aprobados')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error("Error al cargar datos:", data.error);
                return;
            }

            const ctx = document.getElementById('chartAprobadosPendientes').getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Aprobados', 'Pendientes'],
                    datasets: [{
                        label: 'Cantidad de Formularios',
                        data: [data.Aprobados, data.Pendientes],
                        backgroundColor: [
                            'rgba(75, 192, 192, 0.7)',  // Aprobados (verde)
                            'rgba(255, 159, 64, 0.7)'   // Pendientes (naranja)
                        ],
                        borderColor: [
                            'rgba(75, 192, 192, 1)',
                            'rgba(255, 159, 64, 1)'
                        ],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Cantidad'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Estado'
                            }
                        }
                    }
                }
            });
        })
        .catch(error => console.error("Error al obtener datos:", error));
}

function obtenerFormulariosDiarios() {
    fetch('/admin/api/formularios_diarios')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error("Error al cargar datos:", data.error);
                return;
            }

            document.getElementById("formulariosHoy").textContent = data.hoy;

            let porcentaje = data.porcentaje;
            let porcentajeDiv = document.getElementById("porcentajeCambio");
            
            if (porcentaje > 0) {
                porcentajeDiv.classList.add("text-success");
                porcentajeDiv.classList.remove("text-danger");
                porcentajeDiv.innerHTML = `<i class="fa fa-chevron-up"></i> +${porcentaje}%`;
            } else if (porcentaje < 0) {
                porcentajeDiv.classList.add("text-danger");
                porcentajeDiv.classList.remove("text-success");
                porcentajeDiv.innerHTML = `<i class="fa fa-chevron-down"></i> ${porcentaje}%`;
            } else {
                porcentajeDiv.classList.remove("text-success", "text-danger");
                porcentajeDiv.innerHTML = `0%`;
            }
        })
        .catch(error => console.error("Error al obtener datos:", error));
}

function cargarGraficoFormularios() {
    fetch('/admin/api/formularios_por_fecha')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error("Error al cargar datos:", data.error);
                return;
            }

            const labels = data.map(item => item.fecha);
            const valores = data.map(item => item.total);

            const ctx = document.getElementById('myChart').getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Formularios Enviados',
                        data: valores,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderWidth: 2,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        x: { title: { display: true, text: 'Fecha' } },
                        y: { title: { display: true, text: 'Total Formularios' }, beginAtZero: true }
                    }
                }
            });
        })
        .catch(error => console.error("Error al obtener datos:", error));
}



function descargarFormulario(formularioID) {
    window.location.href = `/admin/formularios/descargar/${formularioID}`;
}

function editarFormulario(formularioID) {
    fetch(`/admin/api/formularios/${formularioID}`)
        .then(response => response.json())
        .then(data => {
            const modalTitle = document.getElementById('editarFormularioModalLabel');
            modalTitle.setAttribute('data-formulario-id', formularioID);

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
            Swal.fire({
                title: "Error",
                text: "No se pudo cargar el formulario: " + error.message,
                icon: "error",
                confirmButtonText: "Aceptar",
                confirmButtonColor: "#dc3545"
            });
        });
}

function mostrarEliminarIcono(fila) {
    const icono = fila.querySelector('.delete-icon');
    if (icono) {
        icono.style.display = "inline-block";
    }
}

function ocultarEliminarIcono(fila) {
    const icono = fila.querySelector('.delete-icon');
    if (icono) {
        icono.style.display = "none";
    }
}

function eliminarFila(icono) {
    const fila = icono.closest('tr');
    const detalleID = fila.getAttribute('data-id');

    if (!detalleID) {
        Swal.fire({
            title: "Error",
            text: "No se encontró el ID del registro.",
            icon: "error",
            confirmButtonText: "Aceptar",
            confirmButtonColor: "#dc3545"
        });
        return;
    }

    Swal.fire({
        title: "¿Estás seguro?",
        text: "¡No podrás revertir esta acción!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#28a745",
        cancelButtonColor: "#dc3545"
    }).then((result) => {
        if (result.isConfirmed) {
            filasParaEliminar.push(detalleID);
            fila.classList.add("fila-eliminada");
            Swal.fire({
                title: "¡Eliminado!",
                text: "El registro ha sido eliminado.",
                icon: "success",
                confirmButtonText: "Aceptar",
                confirmButtonColor: "#28a745"
            });
        }
    });
}

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

function guardarCambios() {
    const formularioID = document.getElementById('editarFormularioModalLabel').getAttribute('data-formulario-id');

    if (!formularioID) {
        Swal.fire({
            title: "Error",
            text: "No se encontró el ID del formulario.",
            icon: "error",
            confirmButtonText: "Aceptar",
            confirmButtonColor: "#dc3545"
        });
        return;
    }

    const tbody = document.getElementById('tablaDetalles');
    const rows = tbody.querySelectorAll('tr:not(.fila-eliminada)');
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
            Swal.fire({
                title: "Error",
                text: data.error,
                icon: "error",
                confirmButtonText: "Aceptar",
                confirmButtonColor: "#dc3545"
            });
        } else {
            Swal.fire({
                title: "¡Guardado!",
                text: "Los cambios se han guardado correctamente.",
                icon: "success",
                confirmButtonText: "Aceptar",
                confirmButtonColor: "#28a745"
            }).then(() => {
                location.reload();
            });
        }
    })
    .catch(error => {
        Swal.fire({
            title: "Error",
            text: "Error al guardar cambios: " + error.message,
            icon: "error",
            confirmButtonText: "Aceptar",
            confirmButtonColor: "#dc3545"
        });
    });
}

let filasParaEliminar = [];

function aprobarFormulario(formularioID) {
    if (!formularioID) {
        Swal.fire({
            title: "Error",
            text: "No se proporcionó un ID de formulario válido.",
            icon: "error",
            confirmButtonText: "Aceptar",
            confirmButtonColor: "#dc3545"
        });
        return;
    }

    Swal.fire({
        title: "¿Estás seguro?",
        text: "¿Deseas aprobar este formulario?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, aprobar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#28a745",
        cancelButtonColor: "#dc3545"
    }).then((result) => {
        if (result.isConfirmed) {
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
                Swal.fire({
                    title: "¡Aprobado!",
                    text: "El formulario ha sido aprobado con éxito.",
                    icon: "success",
                    confirmButtonText: "Aceptar",
                    confirmButtonColor: "#28a745"
                }).then(() => {
                    location.reload();
                });
            })
            .catch(error => {
                Swal.fire({
                    title: "Error",
                    text: "Error al aprobar el formulario: " + error.message,
                    icon: "error",
                    confirmButtonText: "Aceptar",
                    confirmButtonColor: "#dc3545"
                });
            });
        }
    });
}
