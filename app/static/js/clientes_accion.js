let offset = 100;
const limit = 100;

async function cargarMasClientes() {
    const response = await fetch(`/admin/fetch_clientes_accion_paginated?offset=${offset}&limit=${limit}`);
    const clientes = await response.json();

    if (response.ok) {
        const tbody = document.getElementById('clientesAccionBody');

        clientes.forEach(cliente => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="cliente-codigo">${cliente.CODCLIENTE}</td>
                <td>${cliente.Descripcion}</td>
                <td>${cliente.NombreClienteLegal}</td>
                <td>${cliente.NombreComercial}</td>
                <td class="text-center">
                    <a href="/clientes_accion/edit/${cliente.CODCLIENTE}/${cliente.CODAccionComercial}" class="btn btn-link btn-primary btn-sm">
                        <i class="fa fa-edit"></i>
                    </a>
                    <form action="/clientes_accion/delete/${cliente.CODCLIENTE}/${cliente.CODAccionComercial}" method="POST" onsubmit="return confirmDelete();" style="display:inline;">
                        <button type="submit" class="btn btn-link btn-danger btn-sm">
                            <i class="fa fa-times"></i>
                        </button>
                    </form>
                </td>
            `;

            // Agregar animación para que la fila aparezca suavemente
            row.style.opacity = "0";
            tbody.appendChild(row);
            setTimeout(() => {
                row.style.opacity = "1";
            }, 100);
        });

        offset += limit;

        if (clientes.length < limit) {
            document.getElementById('loadMoreBtn').style.display = 'none';
        }
    } else {
        console.error('Error al cargar más clientes:', clientes.error);
    }
}

document.getElementById('loadMoreBtn').addEventListener('click', cargarMasClientes);

function fetchSuggestions() {
    const input = document.getElementById('search');
    const filter = input.value.trim().toLowerCase();
    const table = document.getElementById("clientesAccionTable");
    const tr = table.getElementsByTagName('tr');
    const suggestions = document.getElementById('suggestions');

    // Filtrar la tabla en tiempo real
    for (let i = 1; i < tr.length; i++) {  
        const clienteCodigo = tr[i].getElementsByClassName('cliente-codigo')[0].textContent.toLowerCase() || '';
        tr[i].style.display = clienteCodigo.indexOf(filter) > -1 ? "" : "none";
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