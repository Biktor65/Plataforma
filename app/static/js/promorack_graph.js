// Función para obtener datos del dashboard
async function fetchDashboardData() {
    try {
        const response = await fetch('/usuario/api/dashboard_data');
        if (!response.ok) {
            throw new Error('Error al obtener los datos');
        }
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        return []; // Retorna un array vacío en caso de error
    }
}

// Función para calcular el total de ventas
function calcularTotalVentas(data, campo) {
    return data.reduce((sum, cliente) => sum + parseFloat(cliente[campo]), 0);
}

// Función para calcular el crecimiento
function calcularCrecimiento(totalActual, totalAnterior) {
    return ((totalActual - totalAnterior) / totalAnterior * 100).toFixed(2);
}

// Función para contar clientes activos en Fase 5
function contarClientesActivosFase5(data) {
    return data.filter(cliente => 
        cliente.FASE === "FASE V" && cliente.ESTADO_COMPRA === "CON COMPRA"
    ).length;
}

// Función para calcular la mejor ruta
function calcularMejorRuta(data) {
    const rutas = data.reduce((acc, cliente) => {
        acc[cliente.RUTA] = (acc[cliente.RUTA] || 0) + 1;
        return acc;
    }, {});

    const mejorRuta = Object.keys(rutas).reduce((a, b) => rutas[a] > rutas[b] ? a : b);
    const cantidadClientes = rutas[mejorRuta];

    return { mejorRuta, cantidadClientes };
}

// Función para calcular ventas por fase
function calcularVentasPorFase(data) {
    return data.reduce((acc, cliente) => {
        const fase = cliente.FASE;
        acc[fase] = (acc[fase] || 0) + parseFloat(cliente.AACT);
        return acc;
    }, {});
}

// Función para calcular el crecimiento por fase
function calcularCrecimientoFase(ventasPorFase, faseActual, faseAnterior) {
    return ((ventasPorFase[faseActual] - ventasPorFase[faseAnterior]) / ventasPorFase[faseAnterior] * 100).toFixed(2);
}

// Función para crear una tarjeta de ventas
function crearTarjetaVentas(totalVentas, crecimiento) {
    return `
        <div class="col-sm-6 col-md-3">
            <div class="card card-stats card-round">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-icon">
                            <div class="icon-big text-center icon-success bubble-shadow-small">
                                <i class="fas fa-dollar-sign"></i>
                            </div>
                        </div>
                        <div class="col col-stats ms-3 ms-sm-0">
                            <div class="numbers">
                                <p class="card-category">Ventas Año Actual</p>
                                <h4 class="card-title">${totalVentas.toLocaleString()}</h4>
                                <p class="card-subtitle">vs Año Anterior</p>
                            </div>
                        </div>
                        <div class="col-auto">
                            <div class="badge ${crecimiento >= 0 ? 'bg-success' : 'bg-danger'} rounded-pill">
                                <i class="fas fa-arrow-${crecimiento >= 0 ? 'up' : 'down'}"></i> ${Math.abs(crecimiento)}%
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Función para crear una tarjeta de clientes activos en Fase 5
function crearTarjetaClientesFase5(clientesActivosFase5) {
    return `
        <div class="col-sm-6 col-md-3">
            <div class="card card-stats card-round">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-icon">
                            <div class="icon-big text-center icon-primary bubble-shadow-small">
                                <i class="fas fa-users"></i>
                            </div>
                        </div>
                        <div class="col col-stats ms-3 ms-sm-0">
                            <div class="numbers">
                                <p class="card-category">Clientes Activos</p>
                                <h4 class="card-title">${clientesActivosFase5}</h4>
                                <p class="card-subtitle">Fase 5</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Función para crear una tarjeta de la mejor ruta
function crearTarjetaMejorRuta(mejorRuta, cantidadClientes) {
    const tarjetaHTML = `
        <div class="col-sm-6 col-md-3">
            <div class="card card-stats card-round">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-icon">
                            <div class="icon-big text-center icon-info bubble-shadow-small">
                                <i class="fas fa-route"></i>
                            </div>
                        </div>
                        <div class="col col-stats ms-3 ms-sm-0">
                            <div class="numbers">
                                <p class="card-category">Mejor Ruta</p>
                                <h4 class="card-title">${mejorRuta}</h4>
                                <p class="card-subtitle">${cantidadClientes} Clientes</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    const contenedorTarjetas = document.getElementById('contenedor-tarjetas');
    contenedorTarjetas.innerHTML += tarjetaHTML;
}

// Función para crear una tarjeta de crecimiento por fase
function crearTarjetaCrecimientoFaseVentas(fase, crecimiento) {
    const tarjetaHTML = `
        <div class="col-sm-6 col-md-3">
            <div class="card card-stats card-round">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-icon">
                            <div class="icon-big text-center icon-warning bubble-shadow-small">
                                <i class="fas fa-chart-line"></i>
                            </div>
                        </div>
                        <div class="col col-stats ms-3 ms-sm-0">
                            <div class="numbers">
                                <p class="card-category">Crecimiento ${fase}</p>
                                <h4 class="card-title">${crecimiento}%</h4>
                                <p class="card-subtitle">Fase Actual: 6</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    const contenedorTarjetas = document.getElementById('contenedor-tarjetas');
    contenedorTarjetas.innerHTML += tarjetaHTML;
}

// Función principal para crear gráficos y tarjetas
async function createCharts() {
    const data = await fetchDashboardData();
    if (!data.length) return; // Si no hay datos, no hacer nada

    // Calcular métricas principales
    const totalVentasActual = calcularTotalVentas(data, 'AACT');
    const totalVentasAnterior = calcularTotalVentas(data, 'AA');
    const crecimiento = calcularCrecimiento(totalVentasActual, totalVentasAnterior);

    // Crear tarjetas
    const tarjetaVentasHTML = crearTarjetaVentas(totalVentasActual, crecimiento);
    const clientesActivosFase5 = contarClientesActivosFase5(data);
    const tarjetaClientesFase5HTML = crearTarjetaClientesFase5(clientesActivosFase5);

    // Calcular y crear tarjeta de mejor ruta
    const { mejorRuta, cantidadClientes } = calcularMejorRuta(data);
    crearTarjetaMejorRuta(mejorRuta, cantidadClientes);

    // Calcular y crear tarjeta de crecimiento por fase
    const ventasPorFase = calcularVentasPorFase(data);
    const fases = Object.keys(ventasPorFase);
    if (fases.length > 1) {
        const crecimientoFase = calcularCrecimientoFase(ventasPorFase, fases[1], fases[0]);
        crearTarjetaCrecimientoFaseVentas(fases[1], crecimientoFase);
    }

    // Insertar tarjetas en el contenedor
    const contenedorTarjetas = document.getElementById('contenedor-tarjetas');
    contenedorTarjetas.innerHTML += tarjetaVentasHTML + tarjetaClientesFase5HTML;

    // Crear gráficos adicionales
    crearGraficosAdicionales(data);
}

// Función para crear gráficos adicionales
function crearGraficosAdicionales(data) {
    // Gráfico de clientes positivos vs negativos
    const clientesPositivos = data.filter(cliente => cliente.CLIENTES_NEGATIVOS === "POSITIVOS").length;
    const clientesNegativos = data.filter(cliente => cliente.CLIENTES_NEGATIVOS === "NEGATIVOS").length;

    const ctxClientes = document.getElementById('clientesChart').getContext('2d');
    new Chart(ctxClientes, {
        type: 'pie',
        data: {
            labels: ['Clientes Positivos', 'Clientes Negativos'],
            datasets: [{
                label: 'Clientes',
                data: [clientesPositivos, clientesNegativos],
                backgroundColor: [
                    'rgba(5, 250, 250, 0.2)',
                    'rgba(246, 8, 59, 0.2)'
                ],
                borderColor: [
                    'rgb(0, 109, 109)',
                    'rgb(246, 5, 57)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Clientes Positivos vs Negativos'
                }
            }
        }
    });

    // Gráfico de segmentación
    const segmentaciones = [...new Set(data.map(item => item.SEGMENTACION))];
    const conteoSegmentaciones = segmentaciones.map(seg => 
        data.filter(item => item.SEGMENTACION === seg).length
    );

    const ctxSegmentacion = document.getElementById('segmentacionChart').getContext('2d');
    new Chart(ctxSegmentacion, {
        type: 'doughnut',
        data: {
            labels: segmentaciones,
            datasets: [{
                label: 'Clientes por Segmentación',
                data: conteoSegmentaciones,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)', 
                    'rgba(75, 192, 192, 0.6)', 
                    'rgba(255, 206, 86, 0.6)', 
                    'rgba(153, 102, 255, 0.6)', 
                    'rgba(255, 159, 64, 0.6)',  
                    'rgba(199, 199, 199, 0.6)' 
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(199, 199, 199, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Distribución de Clientes por Segmentación'
                }
            }
        }
    });

    // Gráfico de estado de compra por jefe de zona
    const jefesZona = [...new Set(data.map(item => item.JEFEZONA))];
    const jefesZonaAbreviados = jefesZona.map(abreviarNombre);
    
    const conCompra = jefesZona.map(jefe => 
        data.filter(item => item.JEFEZONA === jefe && item.ESTADO_COMPRA === "CON COMPRA").length
    );
    const sinCompra = jefesZona.map(jefe => 
        data.filter(item => item.JEFEZONA === jefe && item.ESTADO_COMPRA === "SIN COMPRA").length
    );
    
    const ctxEstadoCompra = document.getElementById('estadoCompraChart').getContext('2d');
    new Chart(ctxEstadoCompra, {
        type: 'bar',
        data: {
            labels: jefesZonaAbreviados, 
            datasets: [
                {
                    label: 'Con Compra',
                    data: conCompra,
                    backgroundColor: 'rgb(54, 162, 235)', 
                    borderColor: 'rgb(54, 162, 235)',     
                    borderWidth: 1
                },
                {
                    label: 'Sin Compra',
                    data: sinCompra,
                    backgroundColor: 'rgb(255, 99, 132)', 
                    borderColor: 'rgb(255, 99, 132)',     
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    stacked: true,
                    display: true, 
                    ticks: {
                        display: true 
                    },
                    grid: {
                        display: false 
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    grid: {
                        display: true 
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top', 
                },
                title: {
                    display: true,
                    text: 'Estado de Compra por Jefe de Zona'
                },
                tooltip: {
                    callbacks: {
                        title: (context) => {
                            return `Jefe de Zona: ${jefesZona[context[0].dataIndex]}`;
                        },
                        label: (context) => {
                            return `${context.dataset.label}: ${context.raw}`;
                        }
                    }
                }
            }
        }
    });

    // Gráfico de rutas con más clientes por fase
    const datosPorFase = data.reduce((acc, item) => {
        const fase = item.FASE;
        if (!acc[fase]) {
            acc[fase] = [];
        }
        acc[fase].push(item);
        return acc;
    }, {});

    const topRutasPorFase = Object.keys(datosPorFase).map(fase => {
        const datosFase = datosPorFase[fase];

        const conteoPorRuta = datosFase.reduce((acc, item) => {
            const ruta = item.RUTA;
            acc[ruta] = (acc[ruta] || 0) + 1;
            return acc;
        }, {});

        const rutasOrdenadas = Object.entries(conteoPorRuta)
            .sort((a, b) => b[1] - a[1]) // Ordenar de mayor a menor
            .slice(0, 5); // Tomar solo las top 5

        return {
            fase,
            rutas: rutasOrdenadas.map(([ruta, count]) => ({ ruta, count }))
        };
    });

    const fases = topRutasPorFase.map(item => item.fase);
    const rutas = [...new Set(topRutasPorFase.flatMap(item => item.rutas.map(r => r.ruta)))];

    const coloresSolidos = [
        'rgb(54, 162, 235)', // Azul
        'rgb(255, 99, 132)',  // Rojo
        'rgb(75, 192, 192)',  // Verde azulado
        'rgb(255, 206, 86)',  // Amarillo
        'rgb(153, 102, 255)'  // Morado
    ];

    const datasets = rutas.map((ruta, index) => {
        const color = coloresSolidos[index % coloresSolidos.length]; // Asigna colores de la paleta
        return {
            label: ruta,
            data: fases.map(fase => {
                const faseData = topRutasPorFase.find(item => item.fase === fase);
                const rutaData = faseData.rutas.find(r => r.ruta === ruta);
                return rutaData ? rutaData.count : 0;
            }),
            backgroundColor: color, // Color sólido
            borderColor: color,     // Mismo color para el borde
            borderWidth: 1
        };
    });

    const ctxRutas = document.getElementById('rutasChart').getContext('2d');
    new Chart(ctxRutas, {
        type: 'bar',
        data: {
            labels: fases,
            datasets: datasets
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    display: true, 
                    offset: true,  
                    grid: {
                        display: false 
                    },
                    ticks: {
                        display: true 
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Número de Clientes'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false,
                },
                title: {
                    display: true,
                    text: 'Rutas con más clientes por fase'
                }
            }
        }
    });
}

// Función para abreviar nombres
function abreviarNombre(nombreCompleto) {
    const partes = nombreCompleto.split(' '); 
    const primerNombre = partes[0];
    const primeraLetraApellido = partes[1] ? partes[1][0] : ''; 
    return `${primerNombre} ${primeraLetraApellido}.`;
}

// Iniciar la creación de gráficos cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', createCharts);