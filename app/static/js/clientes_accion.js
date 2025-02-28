$(document).ready(function () {
    // Configuración de DataTables para la tabla de clientes
    let table = $('#clientesAccionTable').DataTable({
        "processing": true,
        "serverSide": true,
        "ajax": {
            "url": "/admin/fetch_clientes_accion_paginated",
            "type": "GET",
            "data": function (d) {
                d.searchValue = $('#searchTable').val();  // Enviar el valor de búsqueda al backend
            }
        },
        "columns": [
            { "data": "CODCLIENTE" },
            { "data": "Descripcion" },
            { "data": "NombreClienteLegal" },
            { "data": "NombreComercial" },
            {
                "data": null,
                "className": "text-center",
                "render": function (data, type, row) {
                    return `
                        <button class="btn btn-link btn-primary btn-sm" data-bs-toggle="modal" data-bs-target="#editClienteModal${row.CODCLIENTE}${row.CODAccionComercial}">
                            <i class="fa fa-edit"></i>
                        </button>
                        <form action="${row.delete_url}" method="POST" onsubmit="return confirmDelete();" style="display:inline;">
                            <button type="submit" class="btn btn-link btn-danger btn-sm">
                                <i class="fa fa-times"></i>
                            </button>
                        </form>
                    `;
                }
            }
        ],
        "paging": true,
        "searching": false,  // Desactiva la búsqueda interna de DataTables
        "ordering": false,
        "info": false,
        "lengthChange": false,
        "pageLength": 10,
        "language": {
            "zeroRecords": "No hay resultados",
            "search": "Buscar:",
            "paginate": {
                "first": "Primero",
                "last": "Último",
                "next": "Siguiente",
                "previous": "Anterior"
            }
        }
    });

    // Actualizar la tabla cuando el usuario escriba en el campo de búsqueda de la tabla
    $('#searchTable').on('keyup', function () {
        table.ajax.reload();  // Recargar los datos con el nuevo valor de búsqueda
    });
});

// Función para mostrar sugerencias en la barra de búsqueda de la tabla
function fetchSuggestionsTable() {
    const input = document.getElementById('searchTable');
    const filter = input.value.trim().toLowerCase();
    const suggestions = document.getElementById('suggestionsTable');

    if (filter.length > 0 && /^\d*$/.test(filter)) {
        fetch(`/admin/fetch_clientes_accion/${filter}`)
            .then(response => response.json())
            .then(data => {
                suggestions.innerHTML = '';
                if (data.length > 0) {
                    data.forEach(item => {
                        const div = document.createElement('div');
                        div.classList.add('suggestion-item');
                        div.innerText = `${item.CODCLIENTE} - ${item.NombreComercial}`;
                        div.onclick = () => {
                            input.value = item.CODCLIENTE;
                            suggestions.style.display = 'none';
                            table.ajax.reload(); // Recargar la tabla con el cliente seleccionado
                        };
                        suggestions.appendChild(div);
                    });
                    suggestions.style.display = 'block';
                } else {
                    suggestions.style.display = 'none';
                }
            });
    } else {
        suggestions.style.display = 'none';
    }
}

// Evento para la barra de búsqueda de la tabla
document.getElementById('searchTable').addEventListener('input', fetchSuggestionsTable);

// Función para mostrar sugerencias en la barra de búsqueda del modal
function fetchSuggestionsModal() {
    const input = document.getElementById('searchModal');
    const filter = input.value.trim().toLowerCase();
    const suggestions = document.getElementById('suggestionsModal');

    if (filter.length > 0 && /^\d*$/.test(filter)) {
        fetch(`/admin/fetch_clientes/${filter}`)
            .then(response => response.json())
            .then(data => {
                suggestions.innerHTML = '';
                if (data.length > 0) {
                    data.forEach(item => {
                        const div = document.createElement('div');
                        div.classList.add('suggestion-item');
                        div.innerText = `${item.CODCLIENTE} - ${item.NombreComercial}`;
                        div.onclick = () => {
                            input.value = item.CODCLIENTE;
                            suggestions.style.display = 'none';
                            fetchClientDataModal(item.CODCLIENTE); // Actualizar la información del cliente en el modal
                        };
                        suggestions.appendChild(div);
                    });
                    suggestions.style.display = 'block';
                } else {
                    suggestions.style.display = 'none';
                }
            });
    } else {
        suggestions.style.display = 'none';
    }
}

// Evento para la barra de búsqueda del modal
document.getElementById('searchModal').addEventListener('input', fetchSuggestionsModal);

// Función para actualizar la información del cliente en el modal
function fetchClientDataModal(codcliente) {
    fetch(`/admin/fetch_cliente/${codcliente}`)
        .then(response => {
            if (!response.ok) {
                alert('El cliente no existe en la tabla Clientes.');
                document.getElementById('client-info').style.display = 'none';
                return;
            }
            return response.json();
        })
        .then(data => {
            if (data) {
                document.getElementById('nombreLegal').innerText = data.NombreClienteLegal;
                document.getElementById('nombreComercial').innerText = data.NombreComercial;
                document.getElementById('promociones').innerText = data.Promociones?.join(', ') || 'NO PROMOCIÓN';
                document.getElementById('client-info').style.display = 'block';
            }
        })
        .catch(error => console.error('Error al obtener datos del cliente:', error));
}

// Ocultar sugerencias al hacer clic fuera de los campos de búsqueda
document.addEventListener('click', function (event) {
    const suggestionsTable = document.getElementById('suggestionsTable');
    const searchTable = document.getElementById('searchTable');
    const suggestionsModal = document.getElementById('suggestionsModal');
    const searchModal = document.getElementById('searchModal');

    if (event.target !== searchTable && event.target !== suggestionsTable) {
        suggestionsTable.style.display = 'none';
    }
    if (event.target !== searchModal && event.target !== suggestionsModal) {
        suggestionsModal.style.display = 'none';
    }
});

// Confirmación de eliminación
function confirmDelete() {
    return confirm("¿Estás seguro de que deseas eliminar esta acción?");
}

// Confirmación de actualización
function confirmUpdate() {
    return confirm("¿Estás seguro de que deseas actualizar este cliente y su acción comercial?");
}

document.getElementById('cargarExcelBtn').addEventListener('click', async () => {
    const fileInput = document.getElementById('excelFile');
    const file = fileInput.files[0];

    if (!file) {
        alert("Por favor, selecciona un archivo.");
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/admin/upload_excel', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            // Mostrar los datos verificados en el modal
            const datosVerificados = result.datos;
            const datosHTML = datosVerificados.map(dato => `
                <div class="mb-3">
                    <p><strong>Código Cliente:</strong> ${dato.codcliente}</p>
                    <p><strong>Acción Comercial:</strong> ${dato.accion_comercial}</p>
                    <hr>
                </div>
            `).join('');
            document.getElementById('datosVerificados').innerHTML = datosHTML;

            // Mostrar errores (si los hay)
            if (result.errores && result.errores.length > 0) {
                const erroresHTML = result.errores.map(error => `
                    <div class="alert alert-warning">${error}</div>
                `).join('');
                document.getElementById('datosVerificados').innerHTML += erroresHTML;
            }

            // Mostrar el modal
            const confirmModal = new bootstrap.Modal(document.getElementById('confirmModal'));
            confirmModal.show();

            // Manejar la confirmación
            document.getElementById('confirmarSubida').onclick = async () => {
                // Enviar los datos verificados al backend para insertarlos
                const insertResponse = await fetch('/admin/confirmar_subida', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datosVerificados)
                });

                if (insertResponse.ok) {
                    alert("Datos subidos correctamente.");
                    location.reload(); // Recargar la página para mostrar los nuevos datos
                } else {
                    alert("Error al subir los datos.");
                }

                // Cerrar el modal
                confirmModal.hide();
            };

        } else {
            alert(result.error || "Error al procesar el archivo.");
        }
    } catch (error) {
        alert("Error en la conexión con el servidor.");
    }
});