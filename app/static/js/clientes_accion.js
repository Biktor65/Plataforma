let offset = 100;
const limit = 100

async function cargarMasClientes() {
    const response = await fetch(`/admin/fetch_clientes_accion_paginated?offset=${offset}&limit=${limit}`);
    const clientes = await response.json();

    if (response.ok) {
        const tbody = document.getElementById('clientesAccionBody');
        clientes.forEach(cliente => {
            const row = `
                <tr>
                    <td class="cliente-codigo">${cliente.CODCLIENTE}</td>
                    <td>${cliente.Descripcion}</td>
                    <td>${cliente.NombreClienteLegal}</td>
                    <td>${cliente.NombreComercial}</td>
                    <td>
                        <a href="/clientes_accion/edit/${cliente.CODCLIENTE}/${cliente.CODAccionComercial}" class="edit-link">Editar</a>
                        <form action="/clientes_accion/delete/${cliente.CODCLIENTE}/${cliente.CODAccionComercial}" method="POST" style="display:inline;" onsubmit="return confirmDelete();">
                            <button type="submit" class="btn btn-danger">Eliminar</button>
                        </form>
                    </td>
                </tr>
            `;
            tbody.insertAdjacentHTML('beforeend', row);
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

    // Filtrar la tabla
    for (let i = 1; i < tr.length; i++) {  // Skip the header row
        const clienteCodigo = tr[i].getElementsByClassName('cliente-codigo')[0].textContent.toLowerCase() || '';
        tr[i].style.display = clienteCodigo.indexOf(filter) > -1 ? "" : "none";
    }

    // Obtener sugerencias si hay texto de búsqueda
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
                            input.value = item.CODCLIENTE; // Mantiene el código en el input de búsqueda
                            suggestions.style.display = 'none'; // Oculta las sugerencias
                            filterTable(item.CODCLIENTE);  // Filtra la tabla usando el código seleccionado
                        };
                        suggestions.appendChild(div);
                    });
                    suggestions.style.display = 'block'; // Muestra las sugerencias
                } else {
                    suggestions.style.display = 'none'; // Oculta las sugerencias si no hay datos
                }
            });
    } else {
        suggestions.style.display = 'none'; // Ocultar sugerencias si no hay filtro
    }
}

function buscarClientes() {
    const codcliente = document.getElementById('codcliente').value.trim();
    const suggestions = document.getElementById('suggestions');

    if (codcliente.length === 0) {
        alert('Por favor, ingresa un código de cliente antes de buscar.');
        return;
    }

    // Realiza la búsqueda solo cuando se presione el botón de buscar
    fetch(`/admin/fetch_clientes/${codcliente}`)
        .then(response => response.json())
        .then(data => {
            suggestions.innerHTML = '';
            if (data.length > 0) {
                data.forEach(item => {
                    const div = document.createElement('div');
                    div.classList.add('suggestion-item');
                    div.innerText = `${item.CODCLIENTE} - ${item.NombreComercial}`;
                    div.onclick = () => {
                        document.getElementById('codcliente').value = item.CODCLIENTE; // Asigna el código en el input
                        document.getElementById('nombreComercial').innerText = item.NombreComercial; // Muestra el nombre comercial
                        fetchClientData(); //Actualiza la tabla
                        suggestions.style.display = 'none'; // Oculta las sugerencias
                    };
                    suggestions.appendChild(div);
                });
                suggestions.style.display = 'block'; // Muestra las sugerencias en una ventana emergente
            } else {
                suggestions.innerHTML = '<div class="no-suggestions">No se encontraron coincidencias.</div>';
                suggestions.style.display = 'block'; // Muestra un mensaje si no hay sugerencias
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
        // Obtener datos del cliente en la tabla Clientes
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
                    // Mostrar los datos del cliente
                    document.getElementById('nombreLegal').innerText = data.NombreClienteLegal;
                    document.getElementById('nombreComercial').innerText = data.NombreComercial;
                    
                    // Verificar si hay promociones y mostrarlas, si no, indicar que no hay
                    const promociones = data.Promociones && data.Promociones.length > 0 
                        ? data.Promociones.join(', ') 
                        : 'NO PROMOCIÓN';
                    document.getElementById('promociones').innerText = promociones;

                    // Mostrar la sección con los datos del cliente
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
    return confirm("¿Estás seguro de que deseas eliminar esta acción?");
}