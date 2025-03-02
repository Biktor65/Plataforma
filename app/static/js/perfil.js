async function cambiarContraseña() {
    const contraseñaActual = document.getElementById('contraseña_actual').value.trim();
    const nuevaContraseña = document.getElementById('nueva_contraseña').value.trim();
    const confirmarContraseña = document.getElementById('confirmar_contraseña').value.trim();

    if (!contraseñaActual || !nuevaContraseña || !confirmarContraseña) {
        alert('Todos los campos son obligatorios.');
        return;
    }

    if (nuevaContraseña !== confirmarContraseña) {
        alert('La nueva contraseña y la confirmación no coinciden.');
        return;
    }

    const data = {
        contraseña_actual: contraseñaActual,
        nueva_contraseña: nuevaContraseña,
        confirmar_contraseña: confirmarContraseña
    };

    try {
        const response = await fetch('/auth/perfil_data', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            alert('Contraseña actualizada correctamente.');
            // Cerrar el modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('cambiarContraseñaModal'));
            if (modal) {
                modal.hide();
            }
            // Limpiar el formulario
            const form = document.getElementById('cambiarContraseñaForm');
            if (form) {
                form.reset();
            }
        } else {
            const errorData = await response.json();
            alert(`Error al actualizar la contraseña: ${errorData.error || 'Error desconocido'}`);
        }
    } catch (error) {
        console.error('Error al realizar la solicitud:', error);
        alert('Hubo un error al conectar con el servidor.');
    }
}

async function obtenerPerfil() {
    try {
        const response = await fetch('/auth/perfil_data', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            const data = await response.json();
            document.getElementById('id').value = data.usuario_id || '';
            document.getElementById('usuario').value = data.usuario || '';
        } else {
            console.error('Error al obtener el perfil:', response.statusText);
        }
    } catch (error) {
        console.error('Error al realizar la solicitud:', error);
    }
}

async function actualizarPerfil() {
    const usuario = document.getElementById('usuario').value.trim();

    if (!usuario) {
        alert('El campo de usuario no puede estar vacío.');
        return;
    }

    const data = {
        usuario,
    };

    try {
        const response = await fetch('/auth/perfil_data', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            alert('Perfil actualizado correctamente.');
            document.getElementById('usuario').value = data.usuario;
            window.location.reload();

        } else {
            const errorData = await response.json();
            alert(`Error al actualizar el perfil: ${errorData.error || 'Error desconocido'}`);
        }
    } catch (error) {
        console.error('Error al realizar la solicitud:', error);
        alert('Hubo un error al conectar con el servidor.');
    }
}

function cargarDetalles(formularioId) {
    fetch(`/admin/api/formularios/${formularioId}`)
    .then(response => response.json())
    .then(data => {
        document.getElementById('modalId').textContent = formularioId;
        const detalles = document.getElementById('detallesFormulario');
        
        let html = `
            <div class="mb-3">
                <h5>Estado: <span class="badge ${obtenerClaseEstado(data.Estado)}">${data.Estado}</span></h5>
                <p>Fecha de creación: ${new Date(data.FechaCreacion).toLocaleString()}</p>
            </div>`;
        
        if(data.Detalles && data.Detalles.length > 0) {
            html += `<div class="row">`;
            data.Detalles.forEach((detalle, index) => {
                html += `
                <div class="col-md-6 mb-3">
                    <div class="card">
                        <div class="card-header">
                            <h6>Registro ${index + 1}</h6>
                        </div>
                        <div class="card-body">
                            <p><strong>Centro:</strong> ${detalle.Centro || 'N/A'}</p>
                            <p><strong>Jefe de Zona:</strong> ${detalle.JefeZona || 'N/A'}</p>
                            <p><strong>Ruta:</strong> ${detalle.Ruta || 'N/A'}</p>
                            <p><strong>Código Cliente:</strong> ${detalle.CODCliente || 'N/A'}</p>
                            <p><strong>Nombre Cliente:</strong> ${detalle.NombreCliente || 'N/A'}</p>
                        </div>
                    </div>
                </div>`;
            });
            html += `</div>`;
        }
        
        detalles.innerHTML = html;
    })
    .catch(error => {
        console.error('Error:', error);
        detalles.innerHTML = '<div class="alert alert-danger">Error al cargar los detalles</div>';
    });
}
function obtenerClaseEstado(estado) {
    switch(estado) {
        case 'Aprobado': return 'bg-success';
        case 'Rechazado': return 'bg-danger';
        default: return 'bg-warning';
    }
}

document.addEventListener('DOMContentLoaded', obtenerPerfil);