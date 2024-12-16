$(document).ready(function() {
    // Inicializa el select2 para el campo de "Cliente" y "Ruta"
    $('#cliente, #ruta').select2();

    $('.intro-checkbox').on('change', function() {
        if ($(this).is(':checked')) {
            $('.intro-checkbox').not(this).prop('checked', false);
        }
    });

    function cargarClientes() {
        $.ajax({
            url: '/usuario/api/clientes', 
            method: 'GET',
            dataType: 'json',
            success: function(data) {
                data.forEach(function(cliente) {
                    $('#cliente').append(new Option(`${cliente.CODCliente} - ${cliente.NombreClienteLegal}`, JSON.stringify(cliente)));
                });
            },
            error: function(error) {
                console.error('Error al cargar los clientes:', error);
            }
        });
    }
    

    $('#cliente').on('change', function() {
        const cliente = JSON.parse($(this).val());
        $('#identidad').val(cliente.NumeroIdentidadCliente);
        $('#nombreNegocio').val(cliente.NombreComercial);
        $('#direccion').val(cliente.DireccionNegocio);
    });

    function calcularTotal() {
        let totalCantidad = 0;
        let totalSuma = 0;

        $('tbody tr').each(function() {
            const cantidad = parseFloat($(this).find('.cantidad').val()) || 0;
            const precio = parseFloat($(this).find('.precio').val()) || 0;
            const total = cantidad * precio;
            $(this).find('.total').val(total);

            totalCantidad += cantidad;
            totalSuma += total;
        });

        $('#totalCantidad').val(totalCantidad);
        $('#totalSuma').val(totalSuma);
    }

    $(document).on('input', '.cantidad', calcularTotal);

    const today = new Date().toISOString().split('T')[0];
    $('#fecha').val(today);

    cargarClientes();

    function enviarFormulario() {
        const formData = new FormData(document.getElementById('envaseForm'));
    
        // Enviar los datos usando AJAX
        $.ajax({
            type: "POST",
            url: "/usuario/enviar_formulario",
            data: formData,
            contentType: false,
            processData: false,
            success: function(response) {
                // Mostrar la alerta de éxito
                alert("Datos enviados exitosamente.");
                
                // Limpiar el formulario
                document.getElementById('envaseForm').reset();
                
                // Opcional: Reinicia también los campos select2
                $('#cliente, #ruta').val(null).trigger('change');
    
                // Opcional: Reinicia los valores calculados
                $('#totalCantidad').val('');
                $('#totalSuma').val('');
            },
            error: function() {
                alert("Ocurrió un error al enviar los datos. Inténtalo de nuevo.");
            }
        });
    }
    

    $(document).on('click', '#envaseForm button[type="button"]', enviarFormulario);
});
