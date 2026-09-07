"use strict";


/* =========================================================
   GESTIÓN DE PRODUCTOS ENOLÓGICOS
   ========================================================= */


/* =========================================================
   CONFIGURACIÓN
   ========================================================= */

const STORAGE_KEY =
    "gestion_productos_enologicos_v1";


const PROVEEDORES = [

    "VIDEYNOL",
    "ENOLVIZ",
    "SYS",
    "VASON",
    "LAMOTHE",
    "FUSIÓN VINICAS",
    "CECOGA"

];


const CLASES = [

    "Levadura",
    "Nutrición",
    "Encima",
    "Chips fermentación",
    "Duelas",
    "Tanino",
    "Clarificante",
    "Conservante",
    "Regulador",
    "Otros"

];


const UNIDADES = [

    "mg",
    "g",
    "Kg",
    "ml",
    "L",
    "hL",
    "g/L",
    "g/hL",
    "Kg/L",
    "Kg/hL",
    "ml/L",
    "ml/hL",
    "mg/L"

];


/* =========================================================
   DATOS
   ========================================================= */

let datos = {

    productos: [],

    movimientos: []

};


let ultimoMovimientoEliminado = null;


/* =========================================================
   INICIO
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    iniciarPrograma
);


/* =========================================================
   INICIAR PROGRAMA
   ========================================================= */

function iniciarPrograma() {

    try {

        cargarDatos();

        rellenarSelects();

        instalarEventos();

        actualizarTodo();

        mostrarPagina("inicio");

        console.log(
            "Programa iniciado correctamente."
        );

    }

    catch (error) {

        console.error(
            "ERROR AL INICIAR EL PROGRAMA:",
            error
        );

        alert(
            "Se ha producido un error al iniciar el programa.\n\n" +
            error.message
        );
    }
}


/* =========================================================
   CARGAR DATOS
   ========================================================= */

function cargarDatos() {

    const guardado =
        localStorage.getItem(
            STORAGE_KEY
        );


    if (!guardado) {

        datos = {

            productos: [],

            movimientos: []

        };

        return;
    }


    try {

        const recuperado =
            JSON.parse(
                guardado
            );


        datos = normalizarDatos(
            recuperado
        );

    }

    catch (error) {

        console.error(
            "Error leyendo localStorage:",
            error
        );


        datos = {

            productos: [],

            movimientos: []

        };


        alert(
            "Los datos guardados no se han podido leer. " +
            "Se ha iniciado el programa vacío."
        );
    }
}


/* =========================================================
   NORMALIZAR DATOS
   ========================================================= */

function normalizarDatos(
    entrada
) {

    const resultado = {

        productos: [],

        movimientos: []

    };


    if (
        entrada &&
        Array.isArray(
            entrada.productos
        )
    ) {

        resultado.productos =
            entrada.productos.map(
                producto => {

                    const nuevo = {

                        id:
                            producto.id ||
                            generarId(),

                        nombre:
                            String(
                                producto.nombre ||
                                ""
                            ),

                        proveedor:
                            String(
                                producto.proveedor ||
                                ""
                            ),

                        clase:
                            String(
                                producto.clase ||
                                "Otros"
                            ),

                        unidad:
                            String(
                                producto.unidad ||
                                ""
                            ),

                        dosis:
                            String(
                                producto.dosis ||
                                ""
                            ),

                        caracteristicas:
                            String(
                                producto.caracteristicas ||
                                ""
                            ),

                        stockMinimo:
                            numeroSeguro(
                                producto.stockMinimo
                            ),

                        lotes: []

                    };


                    if (
                        Array.isArray(
                            producto.lotes
                        )
                    ) {

                        nuevo.lotes =
                            producto.lotes.map(
                                lote => ({

                                    id:
                                        lote.id ||
                                        generarId(),

                                    nombre:
                                        String(
                                            lote.nombre ||
                                            lote.lote ||
                                            ""
                                        ),

                                    cantidadInicial:
                                        numeroSeguro(
                                            lote.cantidadInicial
                                        )

                                })
                            );
                    }


                    /*
                       Compatibilidad por si hubiera
                       algún producto sin lotes.
                    */

                    if (
                        nuevo.lotes.length === 0
                    ) {

                        nuevo.lotes.push({

                            id:
                                generarId(),

                            nombre:
                                "SIN LOTE",

                            cantidadInicial:
                                0

                        });
                    }


                    return nuevo;

                }
            );
    }


    if (
        entrada &&
        Array.isArray(
            entrada.movimientos
        )
    ) {

        resultado.movimientos =
            entrada.movimientos.map(
                movimiento => ({

                    id:
                        movimiento.id ||
                        generarId(),

                    tipo:
                        movimiento.tipo ===
                        "consumo"
                            ? "consumo"
                            : "entrada",

                    productoId:
                        movimiento.productoId ||
                        "",

                    loteId:
                        movimiento.loteId ||
                        "",

                    cantidad:
                        numeroSeguro(
                            movimiento.cantidad
                        ),

                    fecha:
                        movimiento.fecha ||
                        fechaHoy(),

                    observaciones:
                        String(
                            movimiento.observaciones ||
                            ""
                        ),

                    creado:
                        movimiento.creado ||
                        new Date().toISOString()

                })
            );
    }


    return resultado;
}


/* =========================================================
   GUARDAR DATOS
   ========================================================= */

function guardarDatos() {

    localStorage.setItem(

        STORAGE_KEY,

        JSON.stringify(
            datos
        )

    );
}


/* =========================================================
   ID
   ========================================================= */

function generarId() {

    return (

        Date.now().toString(36) +

        "-" +

        Math.random()
            .toString(36)
            .substring(2, 10)

    );
}


/* =========================================================
   NÚMERO SEGURO
   ========================================================= */

function numeroSeguro(
    valor
) {

    const numero =
        Number(
            valor
        );


    if (
        !Number.isFinite(
            numero
        )
    ) {

        return 0;
    }


    return numero;
}


/* =========================================================
   FORMATO NÚMERO
   ========================================================= */

function formatearNumero(
    numero
) {

    return numeroSeguro(
        numero
    ).toLocaleString(
        "es-ES",
        {
            maximumFractionDigits: 4
        }
    );
}


/* =========================================================
   FECHA
   ========================================================= */

function fechaHoy() {

    const ahora =
        new Date();


    const año =
        ahora.getFullYear();


    const mes =
        String(
            ahora.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const dia =
        String(
            ahora.getDate()
        ).padStart(
            2,
            "0"
        );


    return (
        año +
        "-" +
        mes +
        "-" +
        dia
    );
}


/* =========================================================
   FORMATEAR FECHA
   ========================================================= */

function formatearFecha(
    fecha
) {

    if (!fecha) {

        return "—";
    }


    const partes =
        String(
            fecha
        ).split(
            "-"
        );


    if (
        partes.length !== 3
    ) {

        return fecha;
    }


    return (
        partes[2] +
        "/" +
        partes[1] +
        "/" +
        partes[0]
    );
}


/* =========================================================
   ESCAPAR HTML
   ========================================================= */

function escaparHTML(
    texto
) {

    return String(
        texto ?? ""
    )
    .replaceAll(
        "&",
        "&amp;"
    )
    .replaceAll(
        "<",
        "&lt;"
    )
    .replaceAll(
        ">",
        "&gt;"
    )
    .replaceAll(
        '"',
        "&quot;"
    )
    .replaceAll(
        "'",
        "&#039;"
    );
}


/* =========================================================
   NORMALIZAR TEXTO
   ========================================================= */

function normalizarTexto(
    texto
) {

    return String(
        texto ?? ""
    )
    .toLowerCase()
    .normalize(
        "NFD"
    )
    .replace(
        /[\u0300-\u036f]/g,
        ""
    )
    .trim();
}


/* =========================================================
   OBTENER PRODUCTO
   ========================================================= */

function obtenerProducto(
    id
) {

    return datos.productos.find(
        producto =>
            producto.id === id
    );
}


/* =========================================================
   OBTENER LOTE
   ========================================================= */

function obtenerLote(
    productoId,
    loteId
) {

    const producto =
        obtenerProducto(
            productoId
        );


    if (!producto) {

        return null;
    }


    return producto.lotes.find(
        lote =>
            lote.id === loteId
    ) || null;
}


/* =========================================================
   STOCK DE UN LOTE
   ========================================================= */

function calcularStockLote(
    productoId,
    loteId
) {

    const lote =
        obtenerLote(
            productoId,
            loteId
        );


    if (!lote) {

        return 0;
    }


    let stock =
        numeroSeguro(
            lote.cantidadInicial
        );


    datos.movimientos.forEach(
        movimiento => {

            if (
                movimiento.productoId !==
                productoId
            ) {

                return;
            }


            if (
                movimiento.loteId !==
                loteId
            ) {

                return;
            }


            const cantidad =
                numeroSeguro(
                    movimiento.cantidad
                );


            if (
                movimiento.tipo ===
                "entrada"
            ) {

                stock +=
                    cantidad;

            }

            else if (
                movimiento.tipo ===
                "consumo"
            ) {

                stock -=
                    cantidad;
            }

        }
    );


    return Math.max(
        0,
        stock
    );
}


/* =========================================================
   STOCK TOTAL PRODUCTO
   ========================================================= */

function calcularStockProducto(
    productoId
) {

    const producto =
        obtenerProducto(
            productoId
        );


    if (!producto) {

        return 0;
    }


    return producto.lotes.reduce(
        (
            total,
            lote
        ) => {

            return (
                total +
                calcularStockLote(
                    productoId,
                    lote.id
                )
            );

        },
        0
    );
}


/* =========================================================
   ENTRADAS PRODUCTO
   ========================================================= */

function calcularEntradasProducto(
    productoId
) {

    return datos.movimientos
        .filter(
            movimiento =>
                movimiento.productoId ===
                productoId &&
                movimiento.tipo ===
                "entrada"
        )
        .reduce(
            (
                total,
                movimiento
            ) => {

                return (
                    total +
                    numeroSeguro(
                        movimiento.cantidad
                    )
                );

            },
            0
        );
}


/* =========================================================
   CONSUMOS PRODUCTO
   ========================================================= */

function calcularConsumosProducto(
    productoId
) {

    return datos.movimientos
        .filter(
            movimiento =>
                movimiento.productoId ===
                productoId &&
                movimiento.tipo ===
                "consumo"
        )
        .reduce(
            (
                total,
                movimiento
            ) => {

                return (
                    total +
                    numeroSeguro(
                        movimiento.cantidad
                    )
                );

            },
            0
        );
}


/* =========================================================
   RELLENAR SELECTS
   ========================================================= */

function rellenarSelects() {

    const proveedor =
        document.getElementById(
            "producto-proveedor"
        );


    const clase =
        document.getElementById(
            "producto-clase"
        );


    const unidad =
        document.getElementById(
            "producto-unidad"
        );


    proveedor.innerHTML =
        `<option value="">Seleccionar...</option>`;


    PROVEEDORES.forEach(
        valor => {

            proveedor.innerHTML +=
                `<option value="${escaparHTML(valor)}">
                    ${escaparHTML(valor)}
                </option>`;
        }
    );


    clase.innerHTML =
        `<option value="">Seleccionar...</option>`;


    CLASES.forEach(
        valor => {

            clase.innerHTML +=
                `<option value="${escaparHTML(valor)}">
                    ${escaparHTML(valor)}
                </option>`;
        }
    );


    unidad.innerHTML =
        `<option value="">Seleccionar...</option>`;


    UNIDADES.forEach(
        valor => {

            unidad.innerHTML +=
                `<option value="${escaparHTML(valor)}">
                    ${escaparHTML(valor)}
                </option>`;
        }
    );


    rellenarFiltroClases();

}


/* =========================================================
   FILTRO CLASES
   ========================================================= */

function rellenarFiltroClases() {

    const select =
        document.getElementById(
            "filtro-clase"
        );


    select.innerHTML =
        `<option value="">
            Todas las clases
        </option>`;


    CLASES.forEach(
        clase => {

            select.innerHTML +=
                `<option value="${escaparHTML(clase)}">
                    ${escaparHTML(clase)}
                </option>`;
        }
    );
}


/* =========================================================
   RELLENAR PRODUCTOS EN SELECTS
   ========================================================= */

function rellenarSelectProductos() {

    const selects = [

        document.getElementById(
            "movimiento-producto"
        ),

        document.getElementById(
            "historial-filtro-producto"
        )

    ];


    const productos =
        [...datos.productos].sort(
            (
                a,
                b
            ) =>
                normalizarTexto(
                    a.nombre
                ).localeCompare(
                    normalizarTexto(
                        b.nombre
                    ),
                    "es"
                )
        );


    selects.forEach(
        select => {

            if (!select) {

                return;
            }


            const valorAnterior =
                select.value;


            if (
                select.id ===
                "historial-filtro-producto"
            ) {

                select.innerHTML =
                    `<option value="">
                        Todos los productos
                    </option>`;

            }

            else {

                select.innerHTML =
                    `<option value="">
                        Seleccionar producto...
                    </option>`;
            }


            productos.forEach(
                producto => {

                    select.innerHTML +=
                        `<option value="${producto.id}">
                            ${escaparHTML(
                                producto.nombre
                            )}
                        </option>`;
                }
            );


            if (
                valorAnterior &&
                productos.some(
                    producto =>
                        producto.id ===
                        valorAnterior
                )
            ) {

                select.value =
                    valorAnterior;
            }
        }
    );
}


/* =========================================================
   INSTALAR EVENTOS
   ========================================================= */

function instalarEventos() {


    /* NAVEGACIÓN */

    document.querySelectorAll(
        ".nav-button"
    ).forEach(
        boton => {

            boton.addEventListener(
                "click",
                () => {

                    mostrarPagina(
                        boton.dataset.page
                    );

                }
            );
        }
    );


    /* BOTONES DE CAMBIO DE PÁGINA */

    document.querySelectorAll(
        "[data-go-page]"
    ).forEach(
        boton => {

            boton.addEventListener(
                "click",
                () => {

                    mostrarPagina(
                        boton.dataset.goPage
                    );

                }
            );
        }
    );


    /* NUEVO PRODUCTO */

    document.getElementById(
        "btn-nuevo-producto"
    ).addEventListener(
        "click",
        () => abrirModalProducto()
    );


    document.getElementById(
        "btn-inicio-nuevo-producto"
    ).addEventListener(
        "click",
        () => abrirModalProducto()
    );


    /* FORMULARIO PRODUCTO */

    document.getElementById(
        "form-producto"
    ).addEventListener(
        "submit",
        guardarProducto
    );


    /* FORMULARIO LOTE */

    document.getElementById(
        "form-lote"
    ).addEventListener(
        "submit",
        guardarLote
    );


    /* FORMULARIO MOVIMIENTO */

    document.getElementById(
        "form-movimiento"
    ).addEventListener(
        "submit",
        guardarMovimiento
    );


    /* PRODUCTO MOVIMIENTO */

    document.getElementById(
        "movimiento-producto"
    ).addEventListener(
        "change",
        actualizarLotesMovimiento
    );


    document.getElementById(
        "movimiento-lote"
    ).addEventListener(
        "change",
        actualizarInfoStockMovimiento
    );


    /* ENTRADA */

    document.getElementById(
        "btn-nueva-entrada"
    ).addEventListener(
        "click",
        () =>
            abrirModalMovimiento(
                "entrada"
            )
    );


    /* CONSUMO */

    document.getElementById(
        "btn-nuevo-consumo"
    ).addEventListener(
        "click",
        () =>
            abrirModalMovimiento(
                "consumo"
            )
    );


    /* FILTROS PRODUCTOS */

    document.getElementById(
        "buscar-productos"
    ).addEventListener(
        "input",
        renderProductos
    );


    document.getElementById(
        "filtro-clase"
    ).addEventListener(
        "change",
        renderProductos
    );


    document.getElementById(
        "filtro-stock"
    ).addEventListener(
        "change",
        renderProductos
    );


    document.getElementById(
        "btn-limpiar-filtros"
    ).addEventListener(
        "click",
        limpiarFiltros
    );


    /* FILTROS MOVIMIENTOS */

    document.getElementById(
        "buscar-movimientos"
    ).addEventListener(
        "input",
        renderMovimientos
    );


    document.getElementById(
        "filtro-tipo-movimiento"
    ).addEventListener(
        "change",
        renderMovimientos
    );


    /* FILTROS HISTORIAL */

    document.getElementById(
        "historial-busqueda"
    ).addEventListener(
        "input",
        renderHistorial
    );


    document.getElementById(
        "historial-filtro-producto"
    ).addEventListener(
        "change",
        renderHistorial
    );


    document.getElementById(
        "historial-filtro-tipo"
    ).addEventListener(
        "change",
        renderHistorial
    );


    /* EXPORTAR JSON */

    document.getElementById(
        "btn-exportar-json"
    ).addEventListener(
        "click",
        exportarJSON
    );


    /* IMPORTAR JSON */

    document.getElementById(
        "btn-importar-json"
    ).addEventListener(
        "click",
        () =>
            document.getElementById(
                "input-importar-json"
            ).click()
    );


    document.getElementById(
        "input-importar-json"
    ).addEventListener(
        "change",
        importarJSON
    );


    /* PDF */

    document.getElementById(
        "btn-exportar-pdf"
    ).addEventListener(
        "click",
        exportarPDF
    );


    /* CERRAR MODALES */

    document.querySelectorAll(
        "[data-close-modal]"
    ).forEach(
        boton => {

            boton.addEventListener(
                "click",
                () => {

                    cerrarModal(
                        boton.dataset.closeModal
                    );

                }
            );
        }
    );


    /* CLICK FUERA DEL MODAL */

    document.querySelectorAll(
        ".modal"
    ).forEach(
        modal => {

            modal.addEventListener(
                "click",
                evento => {

                    if (
                        evento.target ===
                        modal
                    ) {

                        cerrarModal(
                            modal.id
                        );

                    }
                }
            );
        }
    );


    /* ESC */

    document.addEventListener(
        "keydown",
        evento => {

            if (
                evento.key ===
                "Escape"
            ) {

                document.querySelectorAll(
                    ".modal.show"
                ).forEach(
                    modal =>
                        cerrarModal(
                            modal.id
                        )
                );
            }
        }
    );


    /* TABLA PRODUCTOS */

    document.getElementById(
        "contenedor-tablas-productos"
    ).addEventListener(
        "click",
        manejarAccionesProductos
    );


    /* TABLA MOVIMIENTOS */

    document.getElementById(
        "tabla-movimientos"
    ).addEventListener(
        "click",
        manejarAccionesMovimientos
    );


    /* HISTORIAL */

    document.getElementById(
        "tabla-historial"
    ).addEventListener(
        "click",
        manejarAccionesMovimientos
    );

}


/* =========================================================
   MOSTRAR PÁGINA
   ========================================================= */

function mostrarPagina(
    pagina
) {

    document.querySelectorAll(
        ".page"
    ).forEach(
        elemento => {

            elemento.classList.toggle(
                "active",
                elemento.id ===
                "page-" + pagina
            );

        }
    );


    document.querySelectorAll(
        ".nav-button"
    ).forEach(
        boton => {

            boton.classList.toggle(
                "active",
                boton.dataset.page ===
                pagina
            );

        }
    );


    window.scrollTo(
        0,
        0
    );
}


/* =========================================================
   ACTUALIZAR TODO
   ========================================================= */

function actualizarTodo() {

    rellenarSelectProductos();

    renderInicio();

    renderProductos();

    renderMovimientos();

    renderHistorial();

}


/* =========================================================
   ABRIR MODAL PRODUCTO
   ========================================================= */

function abrirModalProducto(
    productoId = null
) {

    const formulario =
        document.getElementById(
            "form-producto"
        );


    formulario.reset();


    document.getElementById(
        "producto-id"
    ).value = "";


    document.getElementById(
        "producto-lote-id"
    ).value = "";


    document.getElementById(
        "producto-stock-minimo"
    ).value = "0";


    if (
        productoId
    ) {

        const producto =
            obtenerProducto(
                productoId
            );


        if (!producto) {

            return;
        }


        document.getElementById(
            "modal-producto-titulo"
        ).textContent =
            "Editar producto";


        document.getElementById(
            "producto-id"
        ).value =
            producto.id;


        document.getElementById(
            "producto-nombre"
        ).value =
            producto.nombre;


        document.getElementById(
            "producto-proveedor"
        ).value =
            producto.proveedor;


        document.getElementById(
            "producto-clase"
        ).value =
            producto.clase;


        document.getElementById(
            "producto-unidad"
        ).value =
            producto.unidad;


        document.getElementById(
            "producto-dosis"
        ).value =
            producto.dosis;


        document.getElementById(
            "producto-caracteristicas"
        ).value =
            producto.caracteristicas;


        document.getElementById(
            "producto-stock-minimo"
        ).value =
            producto.stockMinimo;


        const primerLote =
            producto.lotes[0];


        if (
            primerLote
        ) {

            document.getElementById(
                "producto-lote-id"
            ).value =
                primerLote.id;


            document.getElementById(
                "producto-lote"
            ).value =
                primerLote.nombre;


            document.getElementById(
                "producto-cantidad"
            ).value =
                primerLote.cantidadInicial;
        }

    }

    else {

        document.getElementById(
            "modal-producto-titulo"
        ).textContent =
            "Nuevo producto";
    }


    abrirModal(
        "modal-producto"
    );
}


/* =========================================================
   GUARDAR PRODUCTO
   ========================================================= */

function guardarProducto(
    evento
) {

    evento.preventDefault();


    const id =
        document.getElementById(
            "producto-id"
        ).value;


    const nombre =
        document.getElementById(
            "producto-nombre"
        ).value.trim();


    const proveedor =
        document.getElementById(
            "producto-proveedor"
        ).value;


    const clase =
        document.getElementById(
            "producto-clase"
        ).value;


    const unidad =
        document.getElementById(
            "producto-unidad"
        ).value;


    const dosis =
        document.getElementById(
            "producto-dosis"
        ).value.trim();


    const loteNombre =
        document.getElementById(
            "producto-lote"
        ).value.trim();


    const cantidadInicial =
        Number(
            document.getElementById(
                "producto-cantidad"
            ).value
        );


    const stockMinimo =
        Number(
            document.getElementById(
                "producto-stock-minimo"
            ).value
        );


    const caracteristicas =
        document.getElementById(
            "producto-caracteristicas"
        ).value.trim();


    if (!nombre) {

        mostrarToast(
            "Introduce el nombre del producto.",
            "error"
        );

        return;
    }


    if (!proveedor) {

        mostrarToast(
            "Selecciona el proveedor.",
            "error"
        );

        return;
    }


    if (!clase) {

        mostrarToast(
            "Selecciona la clase.",
            "error"
        );

        return;
    }


    if (!unidad) {

        mostrarToast(
            "Selecciona la unidad.",
            "error"
        );

        return;
    }


    if (!loteNombre) {

        mostrarToast(
            "Introduce el lote.",
            "error"
        );

        return;
    }


    if (
        !Number.isFinite(
            cantidadInicial
        ) ||
        cantidadInicial < 0
    ) {

        mostrarToast(
            "Introduce una cantidad inicial válida.",
            "error"
        );

        return;
    }


    if (
        !Number.isFinite(
            stockMinimo
        ) ||
        stockMinimo < 0
    ) {

        mostrarToast(
            "Introduce un stock mínimo válido.",
            "error"
        );

        return;
    }


    /* EDITAR */

    if (id) {

        const producto =
            obtenerProducto(
                id
            );


        if (!producto) {

            return;
        }


        producto.nombre =
            nombre;


        producto.proveedor =
            proveedor;


        producto.clase =
            clase;


        producto.unidad =
            unidad;


        producto.dosis =
            dosis;


        producto.caracteristicas =
            caracteristicas;


        producto.stockMinimo =
            stockMinimo;


        const loteId =
            document.getElementById(
                "producto-lote-id"
            ).value;


        const lote =
            obtenerLote(
                id,
                loteId
            );


        if (lote) {

            lote.nombre =
                loteNombre;

            /*
               La cantidad inicial solo representa
               la mercancía que había cuando se creó
               el lote.
            */

            lote.cantidadInicial =
                cantidadInicial;
        }


        guardarDatos();

        cerrarModal(
            "modal-producto"
        );

        actualizarTodo();


        mostrarToast(
            "Producto actualizado correctamente.",
            "success"
        );


        return;
    }


    /* NUEVO */

    const nuevoProducto = {

        id:
            generarId(),

        nombre:
            nombre,

        proveedor:
            proveedor,

        clase:
            clase,

        unidad:
            unidad,

        dosis:
            dosis,

        caracteristicas:
            caracteristicas,

        stockMinimo:
            stockMinimo,

        lotes: [

            {

                id:
                    generarId(),

                nombre:
                    loteNombre,

                cantidadInicial:
                    cantidadInicial

            }

        ]

    };


    datos.productos.push(
        nuevoProducto
    );


    guardarDatos();

    cerrarModal(
        "modal-producto"
    );

    actualizarTodo();


    mostrarToast(
        "Producto creado correctamente.",
        "success"
    );
}


/* =========================================================
   ABRIR NUEVO LOTE
   ========================================================= */

function abrirModalLote(
    productoId
) {

    const producto =
        obtenerProducto(
            productoId
        );


    if (!producto) {

        return;
    }


    document.getElementById(
        "form-lote"
    ).reset();


    document.getElementById(
        "lote-producto-id"
    ).value =
        productoId;


    abrirModal(
        "modal-lote"
    );
}


/* =========================================================
   GUARDAR LOTE
   ========================================================= */

function guardarLote(
    evento
) {

    evento.preventDefault();


    const productoId =
        document.getElementById(
            "lote-producto-id"
        ).value;


    const nombre =
        document.getElementById(
            "nuevo-lote-nombre"
        ).value.trim();


    const cantidad =
        Number(
            document.getElementById(
                "nuevo-lote-cantidad"
            ).value
        );


    const producto =
        obtenerProducto(
            productoId
        );


    if (!producto) {

        return;
    }


    if (!nombre) {

        mostrarToast(
            "Introduce el número de lote.",
            "error"
        );

        return;
    }


    if (
        !Number.isFinite(
            cantidad
        ) ||
        cantidad < 0
    ) {

        mostrarToast(
            "Introduce una cantidad válida.",
            "error"
        );

        return;
    }


    const duplicado =
        producto.lotes.some(
            lote =>
                normalizarTexto(
                    lote.nombre
                ) ===
                normalizarTexto(
                    nombre
                )
        );


    if (duplicado) {

        mostrarToast(
            "Ese lote ya existe para este producto.",
            "error"
        );

        return;
    }


    producto.lotes.push({

        id:
            generarId(),

        nombre:
            nombre,

        cantidadInicial:
            cantidad

    });


    guardarDatos();

    cerrarModal(
        "modal-lote"
    );

    actualizarTodo();


    mostrarToast(
        "Nuevo lote añadido correctamente.",
        "success"
    );
}


/* =========================================================
   ABRIR MODAL MOVIMIENTO
   ========================================================= */

function abrirModalMovimiento(
    tipo,
    productoId = "",
    loteId = "",
    movimientoId = ""
) {

    const formulario =
        document.getElementById(
            "form-movimiento"
        );


    formulario.reset();


    document.getElementById(
        "movimiento-id"
    ).value =
        movimientoId;


    document.getElementById(
        "movimiento-tipo"
    ).value =
        tipo;


    document.getElementById(
        "movimiento-fecha"
    ).value =
        fechaHoy();


    const titulo =
        document.getElementById(
            "modal-movimiento-titulo"
        );


    const descripcion =
        document.getElementById(
            "modal-movimiento-descripcion"
        );


    const boton =
        document.getElementById(
            "btn-guardar-movimiento"
        );


    if (
        movimientoId
    ) {

        titulo.textContent =
            "Editar movimiento";


        descripcion.textContent =
            "Modifica el movimiento. El stock se recalculará automáticamente.";


        boton.textContent =
            "Guardar cambios";

    }

    else if (
        tipo ===
        "entrada"
    ) {

        titulo.textContent =
            "Nueva entrada";


        descripcion.textContent =
            "Registra nueva mercancía recibida.";


        boton.textContent =
            "Guardar entrada";
    }

    else {

        titulo.textContent =
            "Nuevo consumo";


        descripcion.textContent =
            "Registra producto utilizado durante un proceso.";


        boton.textContent =
            "Guardar consumo";
    }


    const selectProducto =
        document.getElementById(
            "movimiento-producto"
        );


    selectProducto.value =
        productoId || "";


    actualizarLotesMovimiento();


    document.getElementById(
        "movimiento-lote"
    ).value =
        loteId || "";


    actualizarInfoStockMovimiento();


    abrirModal(
        "modal-movimiento"
    );
}


/* =========================================================
   ACTUALIZAR LOTES MOVIMIENTO
   ========================================================= */

function actualizarLotesMovimiento() {

    const productoId =
        document.getElementById(
            "movimiento-producto"
        ).value;


    const selectLote =
        document.getElementById(
            "movimiento-lote"
        );


    selectLote.innerHTML =
        `<option value="">
            Seleccionar lote...
        </option>`;


    const producto =
        obtenerProducto(
            productoId
        );


    if (!producto) {

        actualizarInfoStockMovimiento();

        return;
    }


    producto.lotes.forEach(
        lote => {

            const stock =
                calcularStockLote(
                    productoId,
                    lote.id
                );


            selectLote.innerHTML +=
                `<option value="${lote.id}">
                    ${escaparHTML(
                        lote.nombre
                    )}
                    — Stock:
                    ${formatearNumero(
                        stock
                    )}
                    ${escaparHTML(
                        producto.unidad
                    )}
                </option>`;
        }
    );


    actualizarInfoStockMovimiento();
}


/* =========================================================
   INFORMACIÓN STOCK MOVIMIENTO
   ========================================================= */

function actualizarInfoStockMovimiento() {

    const productoId =
        document.getElementById(
            "movimiento-producto"
        ).value;


    const loteId =
        document.getElementById(
            "movimiento-lote"
        ).value;


    const tipo =
        document.getElementById(
            "movimiento-tipo"
        ).value;


    const contenedor =
        document.getElementById(
            "movimiento-stock-info"
        );


    if (
        !productoId ||
        !loteId
    ) {

        contenedor.innerHTML =
            "Selecciona un producto y un lote.";

        return;
    }


    const producto =
        obtenerProducto(
            productoId
        );


    const lote =
        obtenerLote(
            productoId,
            loteId
        );


    if (
        !producto ||
        !lote
    ) {

        contenedor.innerHTML =
            "";

        return;
    }


    const stock =
        calcularStockLote(
            productoId,
            loteId
        );


    if (
        tipo ===
        "consumo"
    ) {

        contenedor.innerHTML =

            `<strong>
                Stock disponible:
            </strong>
            ${formatearNumero(
                stock
            )}
            ${escaparHTML(
                producto.unidad
            )}`;

    }

    else {

        contenedor.innerHTML =

            `<strong>
                Stock actual del lote:
            </strong>
            ${formatearNumero(
                stock
            )}
            ${escaparHTML(
                producto.unidad
            )}`;
    }
}


/* =========================================================
   GUARDAR MOVIMIENTO
   ========================================================= */

function guardarMovimiento(
    evento
) {

    evento.preventDefault();


    const movimientoId =
        document.getElementById(
            "movimiento-id"
        ).value;


    const tipo =
        document.getElementById(
            "movimiento-tipo"
        ).value;


    const productoId =
        document.getElementById(
            "movimiento-producto"
        ).value;


    const loteId =
        document.getElementById(
            "movimiento-lote"
        ).value;


    const cantidad =
        Number(
            document.getElementById(
                "movimiento-cantidad"
            ).value
        );


    const fecha =
        document.getElementById(
            "movimiento-fecha"
        ).value;


    const observaciones =
        document.getElementById(
            "movimiento-observaciones"
        ).value.trim();


    if (!productoId) {

        mostrarToast(
            "Selecciona un producto.",
            "error"
        );

        return;
    }


    if (!loteId) {

        mostrarToast(
            "Selecciona un lote.",
            "error"
        );

        return;
    }


    if (
        !Number.isFinite(
            cantidad
        ) ||
        cantidad <= 0
    ) {

        mostrarToast(
            "Introduce una cantidad válida.",
            "error"
        );

        return;
    }


    if (!fecha) {

        mostrarToast(
            "Selecciona la fecha.",
            "error"
        );

        return;
    }


    const producto =
        obtenerProducto(
            productoId
        );


    if (!producto) {

        return;
    }


    /*
       EDITAR MOVIMIENTO
    */

    if (
        movimientoId
    ) {

        const movimiento =
            datos.movimientos.find(
                item =>
                    item.id ===
                    movimientoId
            );


        if (!movimiento) {

            mostrarToast(
                "Movimiento no encontrado.",
                "error"
            );

            return;
        }


        /*
           Para comprobar el stock durante una edición
           eliminamos temporalmente el efecto del
           movimiento antiguo.
        */

        const stockSinMovimiento =
            calcularStockLoteSinMovimiento(
                movimiento.productoId,
                movimiento.loteId,
                movimiento.id
            );


        /*
           Si el nuevo movimiento es un consumo,
           debemos comprobar que haya stock.
        */

        if (
            tipo ===
            "consumo" &&
            productoId ===
            movimiento.productoId &&
            loteId ===
            movimiento.loteId &&
            cantidad >
            stockSinMovimiento
        ) {

            mostrarToast(
                "No hay suficiente stock para ese consumo.",
                "error"
            );

            return;
        }


        movimiento.tipo =
            tipo;


        movimiento.productoId =
            productoId;


        movimiento.loteId =
            loteId;


        movimiento.cantidad =
            cantidad;


        movimiento.fecha =
            fecha;


        movimiento.observaciones =
            observaciones;


        guardarDatos();

        cerrarModal(
            "modal-movimiento"
        );

        actualizarTodo();


        mostrarToast(
            "Movimiento actualizado. El stock ha sido recalculado.",
            "success"
        );


        return;
    }


    /*
       NUEVO CONSUMO
    */

    if (
        tipo ===
        "consumo"
    ) {

        const stock =
            calcularStockLote(
                productoId,
                loteId
            );


        if (
            cantidad >
            stock
        ) {

            mostrarToast(
                "No hay suficiente stock disponible.",
                "error"
            );

            return;
        }
    }


    const nuevoMovimiento = {

        id:
            generarId(),

        tipo:
            tipo,

        productoId:
            productoId,

        loteId:
            loteId,

        cantidad:
            cantidad,

        fecha:
            fecha,

        observaciones:
            observaciones,

        creado:
            new Date().toISOString()

    };


    datos.movimientos.push(
        nuevoMovimiento
    );


    guardarDatos();

    cerrarModal(
        "modal-movimiento"
    );

    actualizarTodo();


    mostrarToast(
        tipo === "entrada"
            ? "Entrada registrada correctamente."
            : "Consumo registrado correctamente.",
        "success"
    );
}


/* =========================================================
   STOCK SIN UN MOVIMIENTO
   ========================================================= */

function calcularStockLoteSinMovimiento(
    productoId,
    loteId,
    movimientoId
) {

    const lote =
        obtenerLote(
            productoId,
            loteId
        );


    if (!lote) {

        return 0;
    }


    let stock =
        numeroSeguro(
            lote.cantidadInicial
        );


    datos.movimientos.forEach(
        movimiento => {

            if (
                movimiento.id ===
                movimientoId
            ) {

                return;
            }


            if (
                movimiento.productoId !==
                productoId
            ) {

                return;
            }


            if (
                movimiento.loteId !==
                loteId
            ) {

                return;
            }


            const cantidad =
                numeroSeguro(
                    movimiento.cantidad
                );


            if (
                movimiento.tipo ===
                "entrada"
            ) {

                stock +=
                    cantidad;
            }

            else {

                stock -=
                    cantidad;
            }

        }
    );


    return Math.max(
        0,
        stock
    );
}


/* =========================================================
   RENDER PRODUCTOS
   ========================================================= */

function renderProductos() {

    const contenedor =
        document.getElementById(
            "contenedor-tablas-productos"
        );


    const busqueda =
        normalizarTexto(
            document.getElementById(
                "buscar-productos"
            ).value
        );


    const filtroClase =
        document.getElementById(
            "filtro-clase"
        ).value;


    const filtroStock =
        document.getElementById(
            "filtro-stock"
        ).value;


    let productos =
        [...datos.productos];


    productos =
        productos.filter(
            producto => {

                const texto =
                    normalizarTexto(
                        [
                            producto.nombre,
                            producto.proveedor,
                            producto.clase,
                            producto.unidad,
                            producto.dosis,
                            producto.caracteristicas,
                            ...producto.lotes.map(
                                lote =>
                                    lote.nombre
                            )
                        ].join(
                            " "
                        )
                    );


                if (
                    busqueda &&
                    !texto.includes(
                        busqueda
                    )
                ) {

                    return false;
                }


                if (
                    filtroClase &&
                    producto.clase !==
                    filtroClase
                ) {

                    return false;
                }


                const stock =
                    calcularStockProducto(
                        producto.id
                    );


                const minimo =
                    numeroSeguro(
                        producto.stockMinimo
                    );


                if (
                    filtroStock ===
                    "bajo" &&
                    stock > minimo
                ) {

                    return false;
                }


                if (
                    filtroStock ===
                    "ok" &&
                    stock <= minimo
                ) {

                    return false;
                }


                return true;

            }
        );


    if (
        productos.length ===
        0
    ) {

        contenedor.innerHTML =
            `<div class="content-card">
                <div class="empty-message">
                    No hay productos que coincidan con la búsqueda.
                </div>
            </div>`;

        return;
    }


    const grupos = {};


    productos.forEach(
        producto => {

            if (
                !grupos[
                    producto.clase
                ]
            ) {

                grupos[
                    producto.clase
                ] = [];
            }


            grupos[
                producto.clase
            ].push(
                producto
            );
        }
    );


    const clases =
        Object.keys(
            grupos
        ).sort(
            (
                a,
                b
            ) =>
                a.localeCompare(
                    b,
                    "es"
                )
        );


    contenedor.innerHTML =
        clases.map(
            clase =>
                renderGrupoProductos(
                    clase,
                    grupos[clase]
                )
        ).join(
            ""
        );
}


/* =========================================================
   GRUPO DE PRODUCTOS
   ========================================================= */

function renderGrupoProductos(
    clase,
    productos
) {

    return `

        <div class="product-class-section">

            <div class="product-class-title">

                <h3>
                    ${escaparHTML(
                        clase
                    )}
                </h3>

                <span>
                    ${productos.length}
                    producto(s)
                </span>

            </div>


            <div class="content-card">

                <div class="table-container">

                    <table class="data-table">

                        <thead>

                            <tr>

                                <th>
                                    Producto
                                </th>

                                <th>
                                    Proveedor
                                </th>

                                <th>
                                    Unidad
                                </th>

                                <th>
                                    Dosis <br> (g/hL)
                                </th>

                                <th>
                                    Características
                                </th>

                                <th>
                                    Lote
                                </th>

                                <th>
                                    Inicial
                                </th>

                                <th>
                                    Entradas (Kg)
                                </th>

                                <th>
                                    Consumos (Kg)
                                </th>

                                <th>
                                    Stock (Kg)
                                </th>

                                <th>
                                    Estado
                                </th>

                                <th>
                                    Acciones
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            ${productos.map(
                                producto =>
                                    renderFilasProducto(
                                        producto
                                    )
                            ).join(
                                ""
                            )}

                        </tbody>

                    </table>

                </div>

            </div>

        </div>

    `;
}


/* =========================================================
   FILAS PRODUCTO
   ========================================================= */

function renderFilasProducto(
    producto
) {

    const lotes =
        producto.lotes;


    const totalStock =
        calcularStockProducto(
            producto.id
        );


    const minimo =
        numeroSeguro(
            producto.stockMinimo
        );


    const bajo =
        totalStock <=
        minimo;


    const totalEntradas =
        calcularEntradasProducto(
            producto.id
        );


    const totalConsumos =
        calcularConsumosProducto(
            producto.id
        );


    return lotes.map(
        (
            lote,
            indice
        ) => {

            const stockLote =
                calcularStockLote(
                    producto.id,
                    lote.id
                );


            const entradasLote =
                datos.movimientos
                    .filter(
                        movimiento =>
                            movimiento.productoId ===
                            producto.id &&
                            movimiento.loteId ===
                            lote.id &&
                            movimiento.tipo ===
                            "entrada"
                    )
                    .reduce(
                        (
                            total,
                            movimiento
                        ) =>
                            total +
                            numeroSeguro(
                                movimiento.cantidad
                            ),
                        0
                    );


            const consumosLote =
                datos.movimientos
                    .filter(
                        movimiento =>
                            movimiento.productoId ===
                            producto.id &&
                            movimiento.loteId ===
                            lote.id &&
                            movimiento.tipo ===
                            "consumo"
                    )
                    .reduce(
                        (
                            total,
                            movimiento
                        ) =>
                            total +
                            numeroSeguro(
                                movimiento.cantidad
                            ),
                        0
                    );


            return `

                <tr
                    class="${
                        bajo
                            ? "stock-bajo"
                            : ""
                    }"
                >

                    ${
                        indice === 0
                            ? `

                                <td
                                    rowspan="${lotes.length}"
                                >

                                    <div class="product-name">
                                        ${escaparHTML(
                                            producto.nombre
                                        )}
                                    </div>

                                    <div class="product-extra">
                                        Stock total:
                                        ${formatearNumero(
                                            totalStock
                                        )}
                                        ${escaparHTML(
                                            producto.unidad
                                        )}
                                    </div>

                                </td>


                                <td
                                    rowspan="${lotes.length}"
                                >
                                    ${escaparHTML(
                                        producto.proveedor
                                    )}
                                </td>


                                <td
                                    rowspan="${lotes.length}"
                                >
                                    ${escaparHTML(
                                        producto.unidad
                                    )}
                                </td>


                                <td
                                    rowspan="${lotes.length}"
                                >
                                    ${escaparHTML(
                                        producto.dosis ||
                                        "—"
                                    )}
                                </td>


                                <td
                                    rowspan="${lotes.length}"
                                >
                                    ${escaparHTML(
                                        producto.caracteristicas ||
                                        "—"
                                    )}
                                </td>

                            `
                            : ""
                    }


                    <td class="lote-cell">
                        ${escaparHTML(
                            lote.nombre
                        )}
                    </td>


                    <td>
                        ${formatearNumero(
                            lote.cantidadInicial
                        )}
                    </td>


                    <td>
                        ${formatearNumero(
                            entradasLote
                        )}
                    </td>


                    <td>
                        ${formatearNumero(
                            consumosLote
                        )}
                    </td>


                    <td class="stock-number">

                        ${formatearNumero(
                            stockLote
                        )}

                        ${escaparHTML(
                            producto.unidad
                        )}

                    </td>


                    ${
                        indice === 0
                            ? `

                                <td
                                    rowspan="${lotes.length}"
                                >

                                    ${
                                        bajo

                                            ? `
                                                <span class="stock-warning">
                                                    ⚠ Stock bajo
                                                </span>
                                            `

                                            : `
                                                <span class="stock-correcto">
                                                    ✓ Correcto
                                                </span>
                                            `
                                    }

                                    <div class="product-extra">
                                        Mínimo:
                                        ${formatearNumero(
                                            minimo
                                        )}
                                        ${escaparHTML(
                                            producto.unidad
                                        )}
                                    </div>

                                </td>


                                <td
                                    rowspan="${lotes.length}"
                                >

                                    <div class="table-actions">

                                        <button
                                            type="button"
                                            class="btn btn-small btn-primary"
                                            data-action="editar-producto"
                                            data-id="${producto.id}"
                                        >
                                            Editar
                                        </button>


                                        <button
                                            type="button"
                                            class="btn btn-small btn-success"
                                            data-action="entrada"
                                            data-producto="${producto.id}"
                                            data-lote="${lote.id}"
                                        >
                                            + Entrada
                                        </button>


                                        <button
                                            type="button"
                                            class="btn btn-small btn-danger"
                                            data-action="consumo"
                                            data-producto="${producto.id}"
                                            data-lote="${lote.id}"
                                        >
                                            − Consumo
                                        </button>


                                        <button
                                            type="button"
                                            class="btn btn-small btn-secondary"
                                            data-action="nuevo-lote"
                                            data-producto="${producto.id}"
                                        >
                                            + Lote
                                        </button>


                                        <button
                                            type="button"
                                            class="btn btn-small btn-warning"
                                            data-action="eliminar-producto"
                                            data-id="${producto.id}"
                                        >
                                            Eliminar
                                        </button>

                                    </div>

                                </td>

                            `

                            : `

                                <td>

                                    <div class="table-actions">

                                        <button
                                            type="button"
                                            class="btn btn-small btn-success"
                                            data-action="entrada"
                                            data-producto="${producto.id}"
                                            data-lote="${lote.id}"
                                        >
                                            + Entrada
                                        </button>


                                        <button
                                            type="button"
                                            class="btn btn-small btn-danger"
                                            data-action="consumo"
                                            data-producto="${producto.id}"
                                            data-lote="${lote.id}"
                                        >
                                            − Consumo
                                        </button>


                                        <button
                                            type="button"
                                            class="btn btn-small btn-warning"
                                            data-action="eliminar-lote"
                                            data-producto="${producto.id}"
                                            data-lote="${lote.id}"
                                        >
                                            Eliminar lote
                                        </button>

                                    </div>

                                </td>

                            `
                    }

                </tr>

            `;

        }
    ).join(
        ""
    );
}


/* =========================================================
   ACCIONES PRODUCTOS
   ========================================================= */

function manejarAccionesProductos(
    evento
) {

    const boton =
        evento.target.closest(
            "[data-action]"
        );


    if (!boton) {

        return;
    }


    const accion =
        boton.dataset.action;


    const productoId =
        boton.dataset.producto ||
        boton.dataset.id;


    const loteId =
        boton.dataset.lote;


    switch (
        accion
    ) {

        case "editar-producto":

            abrirModalProducto(
                productoId
            );

            break;


        case "entrada":

            abrirModalMovimiento(
                "entrada",
                productoId,
                loteId
            );

            break;


        case "consumo":

            abrirModalMovimiento(
                "consumo",
                productoId,
                loteId
            );

            break;


        case "nuevo-lote":

            abrirModalLote(
                productoId
            );

            break;


        case "eliminar-producto":

            eliminarProducto(
                productoId
            );

            break;


        case "eliminar-lote":

            eliminarLote(
                productoId,
                loteId
            );

            break;

    }
}


/* =========================================================
   ELIMINAR PRODUCTO
   ========================================================= */

function eliminarProducto(
    productoId
) {

    const producto =
        obtenerProducto(
            productoId
        );


    if (!producto) {

        return;
    }


    const confirmar =
        confirm(
            "¿Quieres eliminar el producto \"" +
            producto.nombre +
            "\"?\n\n" +
            "También se eliminarán sus lotes y movimientos.\n\n" +
            "Esta acción se puede deshacer inmediatamente."
        );


    if (!confirmar) {

        return;
    }


    const indice =
        datos.productos.findIndex(
            producto =>
                producto.id ===
                productoId
        );


    const movimientos =
        datos.movimientos.filter(
            movimiento =>
                movimiento.productoId ===
                productoId
        );


    ultimoMovimientoEliminado = {

        tipo:
            "producto",

        producto:
            JSON.parse(
                JSON.stringify(
                    producto
                )
            ),

        movimientos:
            JSON.parse(
                JSON.stringify(
                    movimientos
                )
            ),

        indice:
            indice

    };


    datos.productos.splice(
        indice,
        1
    );


    datos.movimientos =
        datos.movimientos.filter(
            movimiento =>
                movimiento.productoId !==
                productoId
        );


    guardarDatos();

    actualizarTodo();


    mostrarToast(
        "Producto eliminado. Pulsa Ctrl+Z si quieres recuperarlo.",
        "warning"
    );
}


/* =========================================================
   ELIMINAR LOTE
   ========================================================= */

function eliminarLote(
    productoId,
    loteId
) {

    const producto =
        obtenerProducto(
            productoId
        );


    if (!producto) {

        return;
    }


    if (
        producto.lotes.length <=
        1
    ) {

        mostrarToast(
            "No puedes eliminar el único lote del producto.",
            "error"
        );

        return;
    }


    const lote =
        obtenerLote(
            productoId,
            loteId
        );


    if (!lote) {

        return;
    }


    const confirmar =
        confirm(
            "¿Quieres eliminar el lote \"" +
            lote.nombre +
            "\"?\n\n" +
            "También se eliminarán sus movimientos."
        );


    if (!confirmar) {

        return;
    }


    const indice =
        producto.lotes.findIndex(
            elemento =>
                elemento.id ===
                loteId
        );


    const movimientos =
        datos.movimientos.filter(
            movimiento =>
                movimiento.productoId ===
                productoId &&
                movimiento.loteId ===
                loteId
        );


    ultimoMovimientoEliminado = {

        tipo:
            "lote",

        productoId:
            productoId,

        lote:
            JSON.parse(
                JSON.stringify(
                    lote
                )
            ),

        movimientos:
            JSON.parse(
                JSON.stringify(
                    movimientos
                )
            ),

        indice:
            indice

    };


    producto.lotes.splice(
        indice,
        1
    );


    datos.movimientos =
        datos.movimientos.filter(
            movimiento =>
                !(
                    movimiento.productoId ===
                    productoId &&
                    movimiento.loteId ===
                    loteId
                )
        );


    guardarDatos();

    actualizarTodo();


    mostrarToast(
        "Lote eliminado.",
        "warning"
    );
}


/* =========================================================
   RENDER MOVIMIENTOS
   ========================================================= */

function renderMovimientos() {

    const contenedor =
        document.getElementById(
            "tabla-movimientos"
        );


    const busqueda =
        normalizarTexto(
            document.getElementById(
                "buscar-movimientos"
            ).value
        );


    const tipo =
        document.getElementById(
            "filtro-tipo-movimiento"
        ).value;


    let movimientos =
        [...datos.movimientos];


    movimientos =
        movimientos
            .filter(
                movimiento => {

                    if (
                        tipo &&
                        movimiento.tipo !==
                        tipo
                    ) {

                        return false;
                    }


                    const producto =
                        obtenerProducto(
                            movimiento.productoId
                        );


                    const lote =
                        obtenerLote(
                            movimiento.productoId,
                            movimiento.loteId
                        );


                    const texto =
                        normalizarTexto(
                            [
                                producto?.nombre,
                                producto?.proveedor,
                                lote?.nombre,
                                movimiento.observaciones
                            ].join(
                                " "
                            )
                        );


                    if (
                        busqueda &&
                        !texto.includes(
                            busqueda
                        )
                    ) {

                        return false;
                    }


                    return true;
                }
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    b.fecha.localeCompare(
                        a.fecha
                    )
            );


    renderTablaMovimientos(
        contenedor,
        movimientos
    );
}


/* =========================================================
   TABLA MOVIMIENTOS
   ========================================================= */

function renderTablaMovimientos(
    contenedor,
    movimientos
) {

    if (
        movimientos.length ===
        0
    ) {

        contenedor.innerHTML =
            `<div class="empty-message">
                No hay movimientos.
            </div>`;

        return;
    }


    contenedor.innerHTML = `

        <table class="data-table">

            <thead>

                <tr>

                    <th>
                        Fecha
                    </th>

                    <th>
                        Tipo
                    </th>

                    <th>
                        Producto
                    </th>

                    <th>
                        Lote
                    </th>

                    <th>
                        Cantidad
                    </th>

                    <th>
                        Observaciones
                    </th>

                    <th>
                        Acciones
                    </th>

                </tr>

            </thead>


            <tbody>

                ${movimientos.map(
                    movimiento =>
                        renderFilaMovimiento(
                            movimiento
                        )
                ).join(
                    ""
                )}

            </tbody>

        </table>

    `;
}


/* =========================================================
   FILA MOVIMIENTO
   ========================================================= */

function renderFilaMovimiento(
    movimiento
) {

    const producto =
        obtenerProducto(
            movimiento.productoId
        );


    const lote =
        obtenerLote(
            movimiento.productoId,
            movimiento.loteId
        );


    return `

        <tr>

            <td>
                ${formatearFecha(
                    movimiento.fecha
                )}
            </td>


            <td>

                ${
                    movimiento.tipo ===
                    "entrada"

                        ? `
                            <span class="badge badge-entrada">
                                Entrada
                            </span>
                          `

                        : `
                            <span class="badge badge-consumo">
                                Consumo
                            </span>
                          `
                }

            </td>


            <td>
                ${escaparHTML(
                    producto?.nombre ||
                    "Producto eliminado"
                )}
            </td>


            <td>
                ${escaparHTML(
                    lote?.nombre ||
                    "Lote eliminado"
                )}
            </td>


            <td>

                <strong>
                    ${formatearNumero(
                        movimiento.cantidad
                    )}
                </strong>

                ${escaparHTML(
                    producto?.unidad ||
                    ""
                )}

            </td>


            <td>
                ${escaparHTML(
                    movimiento.observaciones ||
                    "—"
                )}
            </td>


            <td>

                <div class="table-actions">

                    <button
                        type="button"
                        class="btn btn-small btn-primary"
                        data-action="editar-movimiento"
                        data-id="${movimiento.id}"
                    >
                        Editar
                    </button>


                    <button
                        type="button"
                        class="btn btn-small btn-danger"
                        data-action="eliminar-movimiento"
                        data-id="${movimiento.id}"
                    >
                        Eliminar
                    </button>

                </div>

            </td>

        </tr>

    `;
}


/* =========================================================
   EDITAR MOVIMIENTO
   ========================================================= */

function editarMovimiento(
    movimientoId
) {

    const movimiento =
        datos.movimientos.find(
            item =>
                item.id ===
                movimientoId
        );


    if (!movimiento) {

        mostrarToast(
            "Movimiento no encontrado.",
            "error"
        );

        return;
    }


    abrirModalMovimiento(
        movimiento.tipo,
        movimiento.productoId,
        movimiento.loteId,
        movimiento.id
    );


    document.getElementById(
        "movimiento-cantidad"
    ).value =
        movimiento.cantidad;


    document.getElementById(
        "movimiento-fecha"
    ).value =
        movimiento.fecha;


    document.getElementById(
        "movimiento-observaciones"
    ).value =
        movimiento.observaciones;
}


/* =========================================================
   ELIMINAR MOVIMIENTO
   ========================================================= */

function eliminarMovimiento(
    movimientoId
) {

    const indice =
        datos.movimientos.findIndex(
            movimiento =>
                movimiento.id ===
                movimientoId
        );


    if (
        indice ===
        -1
    ) {

        return;
    }


    const movimiento =
        datos.movimientos[
            indice
        ];


    const producto =
        obtenerProducto(
            movimiento.productoId
        );


    const confirmar =
        confirm(
            "¿Quieres eliminar este movimiento?\n\n" +
            (
                producto
                    ? producto.nombre
                    : ""
            ) +
            "\nCantidad: " +
            formatearNumero(
                movimiento.cantidad
            )
        );


    if (!confirmar) {

        return;
    }


    ultimoMovimientoEliminado = {

        tipo:
            "movimiento",

        movimiento:
            JSON.parse(
                JSON.stringify(
                    movimiento
                )
            ),

        indice:
            indice

    };


    datos.movimientos.splice(
        indice,
        1
    );


    guardarDatos();

    actualizarTodo();


    mostrarToast(
        "Movimiento eliminado y stock recalculado.",
        "warning"
    );
}


/* =========================================================
   ACCIONES MOVIMIENTOS
   ========================================================= */

function manejarAccionesMovimientos(
    evento
) {

    const boton =
        evento.target.closest(
            "[data-action]"
        );


    if (!boton) {

        return;
    }


    const accion =
        boton.dataset.action;


    const id =
        boton.dataset.id;


    if (
        accion ===
        "editar-movimiento"
    ) {

        editarMovimiento(
            id
        );
    }


    if (
        accion ===
        "eliminar-movimiento"
    ) {

        eliminarMovimiento(
            id
        );
    }
}


/* =========================================================
   HISTORIAL
   ========================================================= */

function renderHistorial() {

    const contenedor =
        document.getElementById(
            "tabla-historial"
        );


    const busqueda =
        normalizarTexto(
            document.getElementById(
                "historial-busqueda"
            ).value
        );


    const productoFiltro =
        document.getElementById(
            "historial-filtro-producto"
        ).value;


    const tipoFiltro =
        document.getElementById(
            "historial-filtro-tipo"
        ).value;


    let movimientos =
        [...datos.movimientos];


    movimientos =
        movimientos.filter(
            movimiento => {

                if (
                    productoFiltro &&
                    movimiento.productoId !==
                    productoFiltro
                ) {

                    return false;
                }


                if (
                    tipoFiltro &&
                    movimiento.tipo !==
                    tipoFiltro
                ) {

                    return false;
                }


                const producto =
                    obtenerProducto(
                        movimiento.productoId
                    );


                const lote =
                    obtenerLote(
                        movimiento.productoId,
                        movimiento.loteId
                    );


                const texto =
                    normalizarTexto(
                        [
                            producto?.nombre,
                            producto?.proveedor,
                            lote?.nombre,
                            movimiento.observaciones
                        ].join(
                            " "
                        )
                    );


                if (
                    busqueda &&
                    !texto.includes(
                        busqueda
                    )
                ) {

                    return false;
                }


                return true;

            }
        )
        .sort(
            (
                a,
                b
            ) =>
                b.fecha.localeCompare(
                    a.fecha
                )
        );


    renderTablaMovimientos(
        contenedor,
        movimientos
    );
}


/* =========================================================
   INICIO
   ========================================================= */

function renderInicio() {

    const productos =
        datos.productos.length;


    const lotes =
        datos.productos.reduce(
            (
                total,
                producto
            ) =>
                total +
                producto.lotes.length,
            0
        );


    const entradas =
        datos.movimientos.filter(
            movimiento =>
                movimiento.tipo ===
                "entrada"
        ).length;


    const consumos =
        datos.movimientos.filter(
            movimiento =>
                movimiento.tipo ===
                "consumo"
        ).length;


    const stockBajo =
        datos.productos.filter(
            producto =>
                calcularStockProducto(
                    producto.id
                ) <=
                numeroSeguro(
                    producto.stockMinimo
                )
        ).length;


    document.getElementById(
        "stat-productos"
    ).textContent =
        productos;


    document.getElementById(
        "stat-lotes"
    ).textContent =
        lotes;


    document.getElementById(
        "stat-entradas"
    ).textContent =
        entradas;


    document.getElementById(
        "stat-consumos"
    ).textContent =
        consumos;


    document.getElementById(
        "stat-stock-bajo"
    ).textContent =
        stockBajo;


    renderAvisosStock();

    renderUltimosMovimientos();
}


/* =========================================================
   AVISOS STOCK
   ========================================================= */

function renderAvisosStock() {

    const contenedor =
        document.getElementById(
            "avisos-stock"
        );


    const productos =
        datos.productos.filter(
            producto =>
                calcularStockProducto(
                    producto.id
                ) <=
                numeroSeguro(
                    producto.stockMinimo
                )
        );


    if (
        productos.length ===
        0
    ) {

        contenedor.innerHTML =
            `<div class="empty-message">
                ✓ No hay productos con stock bajo.
            </div>`;

        return;
    }


    contenedor.innerHTML =
        productos.map(
            producto => {

                const stock =
                    calcularStockProducto(
                        producto.id
                    );


                const minimo =
                    numeroSeguro(
                        producto.stockMinimo
                    );


                return `

                    <div class="notice warning">

                        <div>

                            <strong>
                                ${escaparHTML(
                                    producto.nombre
                                )}
                            </strong>

                            <span>
                                Stock:
                                ${formatearNumero(
                                    stock
                                )}
                                ${escaparHTML(
                                    producto.unidad
                                )}
                                · Mínimo:
                                ${formatearNumero(
                                    minimo
                                )}
                            </span>

                        </div>


                        <button
                            type="button"
                            class="btn btn-small btn-danger"
                            data-action="consumo"
                            data-producto="${producto.id}"
                        >
                            Registrar consumo
                        </button>

                    </div>

                `;

            }
        ).join(
            ""
        );


    contenedor.querySelectorAll(
        "[data-action='consumo']"
    ).forEach(
        boton => {

            boton.addEventListener(
                "click",
                () => {

                    abrirModalMovimiento(
                        "consumo",
                        boton.dataset.producto
                    );

                }
            );
        }
    );
}


/* =========================================================
   ÚLTIMOS MOVIMIENTOS
   ========================================================= */

function renderUltimosMovimientos() {

    const contenedor =
        document.getElementById(
            "inicio-ultimos-movimientos"
        );


    const movimientos =
        [...datos.movimientos]
            .sort(
                (
                    a,
                    b
                ) =>
                    b.fecha.localeCompare(
                        a.fecha
                    )
            )
            .slice(
                0,
                8
            );


    if (
        movimientos.length ===
        0
    ) {

        contenedor.innerHTML =
            `<div class="empty-message">
                Todavía no hay movimientos.
            </div>`;

        return;
    }


    contenedor.innerHTML = `

        <table class="data-table">

            <thead>

                <tr>

                    <th>
                        Fecha
                    </th>

                    <th>
                        Tipo
                    </th>

                    <th>
                        Producto
                    </th>

                    <th>
                        Lote
                    </th>

                    <th>
                        Cantidad
                    </th>

                </tr>

            </thead>


            <tbody>

                ${movimientos.map(
                    movimiento => {

                        const producto =
                            obtenerProducto(
                                movimiento.productoId
                            );


                        const lote =
                            obtenerLote(
                                movimiento.productoId,
                                movimiento.loteId
                            );


                        return `

                            <tr>

                                <td>
                                    ${formatearFecha(
                                        movimiento.fecha
                                    )}
                                </td>


                                <td>

                                    ${
                                        movimiento.tipo ===
                                        "entrada"

                                            ? `
                                                <span class="badge badge-entrada">
                                                    Entrada
                                                </span>
                                              `

                                            : `
                                                <span class="badge badge-consumo">
                                                    Consumo
                                                </span>
                                              `
                                    }

                                </td>


                                <td>
                                    ${escaparHTML(
                                        producto?.nombre ||
                                        "—"
                                    )}
                                </td>


                                <td>
                                    ${escaparHTML(
                                        lote?.nombre ||
                                        "—"
                                    )}
                                </td>


                                <td>
                                    ${formatearNumero(
                                        movimiento.cantidad
                                    )}
                                    ${escaparHTML(
                                        producto?.unidad ||
                                        ""
                                    )}
                                </td>

                            </tr>

                        `;

                    }
                ).join(
                    ""
                )}

            </tbody>

        </table>

    `;
}


/* =========================================================
   LIMPIAR FILTROS
   ========================================================= */

function limpiarFiltros() {

    document.getElementById(
        "buscar-productos"
    ).value =
        "";


    document.getElementById(
        "filtro-clase"
    ).value =
        "";


    document.getElementById(
        "filtro-stock"
    ).value =
        "";


    renderProductos();
}


/* =========================================================
   ABRIR MODAL
   ========================================================= */

function abrirModal(
    id
) {

    const modal =
        document.getElementById(
            id
        );


    if (
        modal
    ) {

        modal.classList.add(
            "show"
        );
    }
}


/* =========================================================
   CERRAR MODAL
   ========================================================= */

function cerrarModal(
    id
) {

    const modal =
        document.getElementById(
            id
        );


    if (
        modal
    ) {

        modal.classList.remove(
            "show"
        );
    }
}


/* =========================================================
   EXPORTAR JSON
   ========================================================= */

function exportarJSON() {

    const copia =
        JSON.stringify(
            datos,
            null,
            2
        );


    const blob =
        new Blob(
            [
                copia
            ],
            {
                type:
                    "application/json;charset=utf-8"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const enlace =
        document.createElement(
            "a"
        );


    enlace.href =
        url;


    enlace.download =
        "productos_enologicos_" +
        fechaHoy() +
        ".json";


    document.body.appendChild(
        enlace
    );


    enlace.click();


    enlace.remove();


    URL.revokeObjectURL(
        url
    );


    mostrarToast(
        "Copia JSON exportada correctamente.",
        "success"
    );
}


/* =========================================================
   IMPORTAR JSON
   ========================================================= */

function importarJSON(
    evento
) {

    const archivo =
        evento.target.files?.[0];


    if (!archivo) {

        return;
    }


    const lector =
        new FileReader();


    lector.onload =
        function () {

            try {

                const importado =
                    JSON.parse(
                        lector.result
                    );


                if (
                    !importado ||
                    !Array.isArray(
                        importado.productos
                    ) ||
                    !Array.isArray(
                        importado.movimientos
                    )
                ) {

                    throw new Error(
                        "El archivo no tiene una estructura válida."
                    );
                }


                const confirmar =
                    confirm(
                        "La importación sustituirá los datos actuales.\n\n" +
                        "¿Quieres continuar?"
                    );


                if (!confirmar) {

                    return;
                }


                datos =
                    normalizarDatos(
                        importado
                    );


                guardarDatos();

                actualizarTodo();


                mostrarToast(
                    "Datos importados correctamente.",
                    "success"
                );

            }

            catch (error) {

                console.error(
                    error
                );


                alert(
                    "No se pudo importar el archivo.\n\n" +
                    error.message
                );
            }

            finally {

                evento.target.value =
                    "";
            }

        };


    lector.readAsText(
        archivo,
        "UTF-8"
    );
}


/* =========================================================
   EXPORTAR PDF
   ========================================================= */

function exportarPDF() {

    mostrarPagina(
        "productos"
    );


    setTimeout(
        () => {

            window.print();

        },
        300
    );
}


/* =========================================================
   DESHACER ELIMINACIÓN
   ========================================================= */

document.addEventListener(
    "keydown",
    evento => {

        if (
            evento.ctrlKey &&
            evento.key.toLowerCase() ===
            "z"
        ) {

            if (
                ultimoMovimientoEliminado
            ) {

                deshacerEliminacion();

            }
        }

    }
);


/* =========================================================
   DESHACER
   ========================================================= */

function deshacerEliminacion() {

    if (
        !ultimoMovimientoEliminado
    ) {

        return;
    }


    const eliminacion =
        ultimoMovimientoEliminado;


    if (
        eliminacion.tipo ===
        "movimiento"
    ) {

        datos.movimientos.splice(

            eliminacion.indice,

            0,

            eliminacion.movimiento

        );
    }


    else if (
        eliminacion.tipo ===
        "producto"
    ) {

        datos.productos.splice(

            eliminacion.indice,

            0,

            eliminacion.producto

        );


        datos.movimientos.push(
            ...eliminacion.movimientos
        );
    }


    else if (
        eliminacion.tipo ===
        "lote"
    ) {

        const producto =
            obtenerProducto(
                eliminacion.productoId
            );


        if (
            producto
        ) {

            producto.lotes.splice(

                eliminacion.indice,

                0,

                eliminacion.lote

            );


            datos.movimientos.push(
                ...eliminacion.movimientos
            );
        }
    }


    ultimoMovimientoEliminado =
        null;


    guardarDatos();

    actualizarTodo();


    mostrarToast(
        "Eliminación deshecha correctamente.",
        "success"
    );
}


/* =========================================================
   ATAJO CTRL + Z
   ========================================================= */

window.addEventListener(
    "keydown",
    evento => {

        if (
            evento.ctrlKey &&
            evento.key === "z"
        ) {

            /*
               El evento principal ya se encarga
               de realizar el deshacer.
            */

            evento.preventDefault();

        }

    }
);