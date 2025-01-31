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
            modal.hide();
            // Limpiar el formulario
            document.getElementById('cambiarContraseñaForm').reset();
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
        } else {
            const errorData = await response.json();
            alert(`Error al actualizar el perfil: ${errorData.error || 'Error desconocido'}`);
        }
    } catch (error) {
        console.error('Error al realizar la solicitud:', error);
        alert('Hubo un error al conectar con el servidor.');
    }
}

document.addEventListener('DOMContentLoaded', obtenerPerfil);