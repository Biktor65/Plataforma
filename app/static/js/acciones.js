function confirmAdd(event) {
    event.preventDefault(); 

    Swal.fire({
        title: '¿Estás seguro?',
        text: "¿Estás seguro de que deseas agregar esta acción?",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, agregar',
        cancelButtonText: 'Cancelar',
    }).then((result) => {
        if (result.isConfirmed) {
            event.target.submit();
        }
    });
}

function confirmDelete(event) {
    event.preventDefault(); 

    Swal.fire({
        title: '¿Estás seguro?',
        text: "¿Estás seguro de que deseas eliminar esta acción?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
    }).then((result) => {
        if (result.isConfirmed) {
            event.target.submit();
        }
    });
}

function confirmUpdate(event) {
    event.preventDefault(); 

    Swal.fire({
        title: '¿Estás seguro?',
        text: "¿Estás seguro de que deseas actualizar esta acción?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, actualizar',
        cancelButtonText: 'Cancelar',
    }).then((result) => {
        if (result.isConfirmed) {
            event.target.submit();
        }
    });
}