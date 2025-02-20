$(document).ready(function () {
    let table = $('#clientesAccionTable').DataTable({
        "processing": true,
        "serverSide": true,
        "ajax": {
            "url": "/admin/fetch_clientes_accion_paginated",
            "type": "GET",
            "data": function (d) {
                d.searchValue = $('#search').val();  // Captura el valor del input de búsqueda
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
                        <a href="/clientes_accion/edit/${row.CODCLIENTE}/${row.CODAccionComercial}" class="btn btn-link btn-primary btn-sm">
                            <i class="fa fa-edit"></i>
                        </a>
                        <form action="/clientes_accion/delete/${row.CODCLIENTE}/${row.CODAccionComercial}" method="POST" onsubmit="return confirmDelete();" style="display:inline;">
                            <button type="submit" class="btn btn-link btn-danger btn-sm">
                                <i class="fa fa-times"></i>
                            </button>
                        </form>
                    `;
                }
            }
        ],
        "paging": true,
        "searching": true,
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

    $('#search').on('keyup', function () {
        table.ajax.reload(); 
    });
});

// Confirmación de eliminación
function confirmDelete() {
    return confirm("¿Estás seguro de que deseas eliminar esta acción?");
}

function actualizarPaginacion(paginaActual, totalPaginas) {
    const paginacionDiv = document.getElementById('paginacion');
    paginacionDiv.innerHTML = ""; // Limpiar paginación

    if (totalPaginas > 1) {
        // Botón "Anterior"
        if (paginaActual > 1) {
            let prevButton = document.createElement('button');
            prevButton.classList.add("btn", "btn-outline-secondary", "me-2");
            prevButton.textContent = "Anterior";
            prevButton.onclick = () => cargarClientes(paginaActual - 1);
            paginacionDiv.appendChild(prevButton);
        }

        // Números de página
        for (let i = 1; i <= totalPaginas; i++) {
            let button = document.createElement('button');
            button.classList.add("btn", "btn-sm", i === paginaActual ? "btn-primary" : "btn-outline-secondary");
            button.textContent = i;
            button.onclick = () => cargarClientes(i);
            paginacionDiv.appendChild(button);
        }

        // Botón "Siguiente"
        if (paginaActual < totalPaginas) {
            let nextButton = document.createElement('button');
            nextButton.classList.add("btn", "btn-outline-secondary", "ms-2");
            nextButton.textContent = "Siguiente";
            nextButton.onclick = () => cargarClientes(paginaActual + 1);
            paginacionDiv.appendChild(nextButton);
        }
    }
}


function fetchSuggestions() {
    const input = document.getElementById('search');
    const filter = input.value.trim().toLowerCase();
    const table = document.getElementById("clientesAccionTable");
    const tr = table.getElementsByTagName('tr');
    const suggestions = document.getElementById('suggestions');

    // Filtrar la tabla en tiempo real
    for (let i = 1; i < tr.length; i++) {  
        let clienteCell = tr[i].getElementsByClassName('cliente-codigo')[0];
    
        if (clienteCell) {  // Verifica que la celda existe
            const clienteCodigo = clienteCell.textContent.toLowerCase();
            tr[i].style.display = clienteCodigo.indexOf(filter) > -1 ? "" : "none";
        }
    }

    if (filter.length > 0 && /^\d*$/.test(filter)) {
        fetch(`/admin/fetch_clientes_accion/${filter}`)
            .then(response => response.json())
            .then(data => {
                suggestions.innerHTML = '';
                if (data.length > 0) {
                    data.forEach(item => {
                        const div = document.createElement('div');
                        div.classList.add('suggestion-item', 'dropdown-item'); // Usa la clase de KaiAdmin
                        div.innerText = `${item.CODCLIENTE} - ${item.NombreComercial}`;
                        div.onclick = () => {
                            input.value = item.CODCLIENTE;
                            suggestions.style.display = 'none';
                            filterTable(item.CODCLIENTE);
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

function buscarClientes() {
    const codcliente = document.getElementById('codcliente').value.trim();
    const suggestions = document.getElementById('suggestions');

    if (codcliente.length === 0) {
        alert('Por favor, ingresa un código de cliente antes de buscar.');
        return;
    }

    fetch(`/admin/fetch_clientes/${codcliente}`)
        .then(response => response.json())
        .then(data => {
            suggestions.innerHTML = '';
            if (data.length > 0) {
                data.forEach(item => {
                    const div = document.createElement('div');
                    div.classList.add('suggestion-item', 'dropdown-item');
                    div.innerText = `${item.CODCLIENTE} - ${item.NombreComercial}`;
                    div.onclick = () => {
                        document.getElementById('codcliente').value = item.CODCLIENTE;
                        document.getElementById('nombreComercial').innerText = item.NombreComercial;
                        fetchClientData();
                        suggestions.style.display = 'none';
                    };
                    suggestions.appendChild(div);
                });
                suggestions.style.display = 'block';
            } else {
                suggestions.innerHTML = '<div class="dropdown-item text-muted">No se encontraron coincidencias.</div>';
                suggestions.style.display = 'block';
            }
        })
        .catch(error => {
            console.error('Error al buscar clientes:', error);
        });
}

function filterTable(codigo) {
    const table = document.getElementById("clientesAccionTable");
    const tr = table.getElementsByTagName('tr');

    for (let i = 1; i < tr.length; i++) {
        const clienteCodigo = tr[i].getElementsByClassName('cliente-codigo')[0].textContent.toLowerCase() || '';
        tr[i].style.display = clienteCodigo.indexOf(codigo.toLowerCase()) > -1 ? "" : "none";
    }
}

function fetchClientData() {
    const codcliente = document.getElementById('codcliente').value;
    if (codcliente) {
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
}

function validateForm() {
    const nombreLegal = document.getElementById('nombreLegal').innerText;
    const nombreComercial = document.getElementById('nombreComercial').innerText;

    if (!nombreLegal || !nombreComercial) {
        alert('Por favor, asegúrate de que el cliente exista antes de enviar el formulario.');
        return false;
    }
    return true;
}

function confirmDelete() {
    return confirm("¿Estás seguro de que deseas eliminar esta acción?");
}
