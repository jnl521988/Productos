// ============================================================
// GESTOR DE STOCK ENOLÓGICO
// script.js
// ============================================================

"use strict";

// ============================================================
// CONFIGURACIÓN
// ============================================================

const STORAGE_KEY = "stock_enologico_reestructurado_v1";

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
    "levadura",
    "nutrición",
    "encima",
    "chips fermentación",
    "duelas",
    "tanino",
    "clarificante",
    "conservante",
    "regulador",
    "otros"
];

const UNIDADES = [
    "Ud.",
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


// ============================================================
// VARIABLES GLOBALES
// ============================================================

let datos = cargarDatos();

let claseActual = CLASES[0];

let busqueda = "";


// ============================================================
// FUNCIONES AUXILIARES
// ============================================================

function $(id) {
    return document.getElementById(id);
}


function uid(prefijo) {

    return (
        prefijo +
        "_" +
        Date.now().toString(36) +
        "_" +
        Math.random().toString(36).slice(2, 8)
    );
}


function numero(valor) {

    const n = Number(valor);

    return Number.isFinite(n) ? n : 0;
}


function formatoNumero(valor) {

    return numero(valor).toLocaleString("es-ES", {
        maximumFractionDigits: 3
    });
}


function hoy() {

    return new Date().toISOString().slice(0, 10);
}


function escapar(valor) {

    return String(valor ?? "").replace(
        /[&<>"']/g,
        function (caracter) {

            const mapa = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            };

            return mapa[caracter];
        }
    );
}


function capitalizar(texto) {

    if (!texto) return "";

    return texto.charAt(0).toUpperCase() + texto.slice(1);
}


function toast(mensaje) {

    const elemento = $("toast");

    if (!elemento) return;

    elemento.textContent = mensaje;

    elemento.classList.add("show");

    clearTimeout(window._toastTimer);

    window._toastTimer = setTimeout(function () {

        elemento.classList.remove("show");

    }, 2300);
}


// ============================================================
// ESTRUCTURA INICIAL
// ============================================================

function estructuraVacia() {

    return {

        version: 1,

        productos: [],

        movimientos: []

    };
}


// ============================================================
// CARGAR DATOS
// ============================================================

function cargarDatos() {

    try {

        const raw = localStorage.getItem(STORAGE_KEY);

        if (!raw) {

            return estructuraVacia();

        }

        const datosCargados = JSON.parse(raw);

        if (
            !datosCargados ||
            !Array.isArray(datosCargados.productos) ||
            !Array.isArray(datosCargados.movimientos)
        ) {

            console.warn(
                "Estructura de datos no válida. Se iniciará un almacén vacío."
            );

            return estructuraVacia();

        }


        datosCargados.productos.forEach(function (producto) {

            producto.id = producto.id || uid("p");

            producto.nombre = String(producto.nombre || "");

            producto.proveedor = producto.proveedor || "VIDEYNOL";

            producto.clase = producto.clase || "otros";

            producto.unidad = producto.unidad || "Kg";

            producto.dosis = producto.dosis || "";

            producto.bajoStock = numero(producto.bajoStock);

            producto.caracteristicas =
                producto.caracteristicas || "";


            if (!Array.isArray(producto.lotes)) {

                producto.lotes = [];

            }


            producto.lotes.forEach(function (lote) {

                lote.id = lote.id || uid("l");

                lote.nombre =
                    String(
                        lote.nombre ??
                        lote.lote ??
                        "Sin lote"
                    );

                lote.cantidadInicial =
                    numero(lote.cantidadInicial);

            });

        });


        datosCargados.movimientos =
            datosCargados.movimientos.filter(Boolean);


        datosCargados.movimientos.forEach(function (movimiento) {

            movimiento.id =
                movimiento.id || uid("m");

            movimiento.cantidad =
                numero(movimiento.cantidad);

            movimiento.tipo =
                movimiento.tipo === "entrada"
                    ? "entrada"
                    : "consumo";

            movimiento.fecha =
                movimiento.fecha || hoy();

            movimiento.descripcion =
                movimiento.descripcion || "";

        });


        return datosCargados;

    } catch (error) {

        console.error(
            "Error cargando los datos:",
            error
        );

        return estructuraVacia();

    }
}


// ============================================================
// GUARDAR
// ============================================================

function guardar() {

    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(datos)
        );

    } catch (error) {

        console.error(
            "Error guardando datos:",
            error
        );

        alert(
            "No se pudieron guardar los datos en el navegador."
        );

    }
}


// ============================================================
// BUSCAR PRODUCTO
// ============================================================

function producto(id) {

    return datos.productos.find(function (p) {

        return p.id === id;

    });
}


// ============================================================
// BUSCAR LOTE
// ============================================================

function lote(productoId, loteId) {

    const p = producto(productoId);

    if (!p) return null;

    return p.lotes.find(function (l) {

        return l.id === loteId;

    });
}


// ============================================================
// MOVIMIENTOS DE UN LOTE
// ============================================================

function movimientosLote(productoId, loteId) {

    return datos.movimientos.filter(function (movimiento) {

        return (
            movimiento.productoId === productoId &&
            movimiento.loteId === loteId
        );

    });

}


// ============================================================
// STOCK DE UN LOTE
// ============================================================

function stockLote(productoId, loteId) {

    const l = lote(productoId, loteId);

    if (!l) return 0;


    let stock = numero(l.cantidadInicial);


    const movimientos =
        movimientosLote(productoId, loteId);


    movimientos.forEach(function (movimiento) {

        if (movimiento.tipo === "entrada") {

            stock += numero(movimiento.cantidad);

        } else {

            stock -= numero(movimiento.cantidad);

        }

    });


    return stock;
}


// ============================================================
// STOCK DE PRODUCTO
// ============================================================

function stockProducto(productoObj) {

    if (!productoObj) return 0;


    return productoObj.lotes.reduce(
        function (total, l) {

            return (
                total +
                stockLote(
                    productoObj.id,
                    l.id
                )
            );

        },
        0
    );
}


// ============================================================
// CONSUMO DE UN LOTE
// ============================================================

function consumoLote(productoId, loteId) {

    return movimientosLote(
        productoId,
        loteId
    ).reduce(
        function (total, movimiento) {

            if (movimiento.tipo === "consumo") {

                return total + numero(movimiento.cantidad);

            }

            return total;

        },
        0
    );
}


// ============================================================
// ENTRADAS DE UN LOTE
// ============================================================

function entradasLote(productoId, loteId) {

    return movimientosLote(
        productoId,
        loteId
    ).reduce(
        function (total, movimiento) {

            if (movimiento.tipo === "entrada") {

                return total + numero(movimiento.cantidad);

            }

            return total;

        },
        0
    );
}


// ============================================================
// CONSUMO DE PRODUCTO
// ============================================================

function consumoProducto(productoObj) {

    if (!productoObj) return 0;


    return productoObj.lotes.reduce(
        function (total, l) {

            return (
                total +
                consumoLote(
                    productoObj.id,
                    l.id
                )
            );

        },
        0
    );
}


// ============================================================
// ENTRADAS DE PRODUCTO
// ============================================================

function entradasProducto(productoObj) {

    if (!productoObj) return 0;


    return productoObj.lotes.reduce(
        function (total, l) {

            return (
                total +
                entradasLote(
                    productoObj.id,
                    l.id
                )
            );

        },
        0
    );
}


// ============================================================
// INICIAR PROGRAMA
// ============================================================

function init() {

    try {

        llenarSelects();

        renderNav();

        renderClase();


        // BUSCADOR

        const search = $("searchInput");

        if (search) {

            search.addEventListener(
                "input",
                function (evento) {

                    busqueda =
                        evento.target.value
                            .toLowerCase()
                            .trim();

                    renderClase();

                }
            );

        }


        // NUEVO PRODUCTO

        if ($("btnNuevoProducto")) {

            $("btnNuevoProducto").onclick =
                function () {

                    abrirProducto();

                };

        }


        // EXPORTAR JSON

        if ($("btnExportJSON")) {

            $("btnExportJSON").onclick =
                exportJSON;

        }


        // IMPORTAR JSON

        if ($("inputImportJSON")) {

            $("inputImportJSON").onchange =
                importJSON;

        }


        // EXPORTAR PDF

        if ($("btnExportPDF")) {

            $("btnExportPDF").onclick =
                exportPDF;

        }


        // LIMPIAR HISTORIAL

        if ($("btnClearHistory")) {

            $("btnClearHistory").onclick =
                limpiarHistorial;

        }


        // FORMULARIOS

        if ($("productForm")) {

            $("productForm").onsubmit =
                guardarProducto;

        }


        if ($("lotForm")) {

            $("lotForm").onsubmit =
                guardarLote;

        }


        if ($("movementForm")) {

            $("movementForm").onsubmit =
                guardarMovimiento;

        }


        // CLICS GENERALES

        document.addEventListener(
            "click",
            manejarClick
        );


        // BOTONES DE CIERRE

        prepararCierres();


        console.log(
            "Gestor de stock enológico iniciado correctamente."
        );

    } catch (error) {

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


// ============================================================
// RELLENAR SELECTS
// ============================================================

function llenarSelects() {

    const proveedor =
        $("fProveedor");

    const clase =
        $("fClase");

    const unidad =
        $("fUnidad");


    if (proveedor) {

        proveedor.innerHTML =
            PROVEEDORES.map(function (valor) {

                return `
                    <option value="${escapar(valor)}">
                        ${escapar(valor)}
                    </option>
                `;

            }).join("");

    }


    if (clase) {

        clase.innerHTML =
            CLASES.map(function (valor) {

                return `
                    <option value="${escapar(valor)}">
                        ${escapar(capitalizar(valor))}
                    </option>
                `;

            }).join("");

    }


    if (unidad) {

        unidad.innerHTML =
            UNIDADES.map(function (valor) {

                return `
                    <option value="${escapar(valor)}">
                        ${escapar(valor)}
                    </option>
                `;

            }).join("");

    }

}


// ============================================================
// NAVEGACIÓN DE CLASES
// ============================================================

function renderNav() {

    const nav =
        $("classNav");

    if (!nav) return;


    let html = "";


    CLASES.forEach(function (clase) {

        html += `
            <button
                class="${clase === claseActual ? "active" : ""}"
                data-class="${escapar(clase)}"
            >
                ${escapar(capitalizar(clase))}
            </button>
        `;

    });


    html += `
        <button
            class="${claseActual === "__historial" ? "active" : ""}"
            data-history
        >
            📋 Historial
        </button>
    `;


    nav.innerHTML = html;

}


// ============================================================
// MANEJAR CLICS
// ============================================================

function manejarClick(evento) {

    // --------------------------------------------------------
    // CLASE
    // --------------------------------------------------------

    const botonClase =
        evento.target.closest("[data-class]");


    if (botonClase) {

        claseActual =
            botonClase.dataset.class;

        busqueda = "";


        if ($("searchInput")) {

            $("searchInput").value = "";

        }


        mostrarClase();

        return;

    }


    // --------------------------------------------------------
    // HISTORIAL
    // --------------------------------------------------------

    const botonHistorial =
        evento.target.closest("[data-history]");


    if (botonHistorial) {

        claseActual = "__historial";

        mostrarHistorial();

        return;

    }


    // --------------------------------------------------------
    // ACCIONES
    // --------------------------------------------------------

    const botonAccion =
        evento.target.closest("[data-action]");


    if (!botonAccion) return;


    const accion =
        botonAccion.dataset.action;

    const productoId =
        botonAccion.dataset.pid;

    const loteId =
        botonAccion.dataset.lid;

    const movimientoId =
        botonAccion.dataset.mid;


    switch (accion) {

        case "view":

            mostrarProducto(productoId);

            break;


        case "edit-product":

            abrirProducto(productoId);

            break;


        case "delete-product":

            eliminarProducto(productoId);

            break;


        case "add-lot":

            abrirLote(productoId);

            break;


        case "edit-lot":

            abrirLote(
                productoId,
                loteId
            );

            break;


        case "delete-lot":

            eliminarLote(
                productoId,
                loteId
            );

            break;


        case "entry":

            abrirMovimiento(
                productoId,
                loteId,
                "entrada"
            );

            break;


        case "consume":

            abrirMovimiento(
                productoId,
                loteId,
                "consumo"
            );

            break;


        case "edit-movement":

            abrirMovimiento(
                productoId,
                loteId,
                null,
                movimientoId
            );

            break;


        case "delete-movement":

            eliminarMovimiento(
                movimientoId
            );

            break;


        case "back":

            mostrarClase();

            break;

    }

}


// ============================================================
// MOSTRAR CLASE
// ============================================================

function mostrarClase() {

    if ($("viewClasses")) {

        $("viewClasses")
            .classList
            .remove("hidden");

    }


    if ($("viewProduct")) {

        $("viewProduct")
            .classList
            .add("hidden");

    }


    if ($("viewHistory")) {

        $("viewHistory")
            .classList
            .add("hidden");

    }


    renderNav();

    renderClase();

}


// ============================================================
// RENDER CLASE
// ============================================================

function renderClase() {

    if (claseActual === "__historial") {

        mostrarHistorial();

        return;

    }


    const titulo =
        $("classTitle");


    const subtitulo =
        $("classSubtitle");


    if (titulo) {

        titulo.textContent =
            capitalizar(claseActual);

    }


    if (subtitulo) {

        subtitulo.textContent =
            "Productos de esta clase";

    }


    const productos =
        datos.productos.filter(
            function (p) {

                const pertenece =
                    p.clase === claseActual;


                if (!pertenece) {

                    return false;

                }


                if (!busqueda) {

                    return true;

                }


                const texto = (

                    p.nombre +
                    " " +
                    p.proveedor +
                    " " +
                    p.caracteristicas +
                    " " +
                    p.dosis

                ).toLowerCase();


                return texto.includes(busqueda);

            }
        );


    const grid =
        $("productGrid");


    if (!grid) return;


    if (!productos.length) {

        grid.innerHTML = `
            <div class="empty">
                No hay productos que coincidan.
                <br><br>

                <button
                    class="btn primary"
                    onclick="abrirProducto()"
                >
                    ＋ Crear producto
                </button>
            </div>
        `;

    } else {

        grid.innerHTML =
            productos
                .map(cardProducto)
                .join("");

    }


    renderResumen(productos);

}


// ============================================================
// TARJETA PRODUCTO
// ============================================================

function cardProducto(p) {

    const stock =
        stockProducto(p);


    const limite =
        numero(p.bajoStock);


    const lotesAgotados =
        p.lotes.filter(
            function (l) {

                return (
                    stockLote(
                        p.id,
                        l.id
                    ) <= 0
                );

            }
        ).length;


    let claseStock = "";


    if (stock <= 0) {

        claseStock = "zero";

    } else if (
        limite > 0 &&
        stock <= limite
    ) {

        claseStock = "low";

    }


    let lotesHTML = "";


    if (p.lotes.length) {

        lotesHTML =
            p.lotes
                .slice(0, 5)
                .map(function (l) {

                    return `
                        <div class="lot-line">

                            <span>
                                Lote
                                <strong>
                                    ${escapar(l.nombre)}
                                </strong>
                            </span>

                            <span>
                                ${
                                    formatoNumero(
                                        stockLote(
                                            p.id,
                                            l.id
                                        )
                                    )
                                }
                                ${escapar(p.unidad)}
                            </span>

                        </div>
                    `;

                })
                .join("");

    } else {

        lotesHTML = `
            <div class="meta">
                Sin lotes creados
            </div>
        `;

    }


    if (p.lotes.length > 5) {

        lotesHTML += `
            <div class="meta">
                + ${p.lotes.length - 5}
                lote(s) más
            </div>
        `;

    }


    return `
        <article
            class="product-card ${claseStock}"
        >

            <div class="product-top">

                <div>

                    <h3 class="product-name"> 
    ${escapar(p.nombre)} 
</h3>

${ 
    p.caracteristicas
        ? `
            <div class="product-characteristics">
                ${escapar(p.caracteristicas)}
            </div>
          `
        : ""
}

<div class="meta"> 
    ${escapar(p.proveedor)} 
    · 
    ${escapar(p.unidad)} 
</div>

                </div>

                <span class="badge">
                    ${escapar(p.clase)}
                </span>

            </div>


            <div class="stock-big">
                ${formatoNumero(stock)}
                ${escapar(p.unidad)}
            </div>


            <div class="stock-label">
                Stock actual ·
                ${p.lotes.length}
                lote(s)
            </div>


            ${
                limite > 0 &&
                stock <= limite
                    ? `
                        <div class="stock-warn">
                            ⚠ Bajo stock · límite
                            ${formatoNumero(limite)}
                            ${escapar(p.unidad)}
                        </div>
                    `
                    : ""
            }


            <div class="lots-mini">

                ${lotesHTML}

            </div>


            <div class="card-actions">

                <button
                    class="btn primary"
                    data-action="view"
                    data-pid="${p.id}"
                >
                    Ver producto
                </button>


                <button
                    class="btn"
                    data-action="edit-product"
                    data-pid="${p.id}"
                >
                    ✏ Editar
                </button>


                <button
                    class="btn danger"
                    data-action="delete-product"
                    data-pid="${p.id}"
                >
                    🗑 Eliminar
                </button>

            </div>

        </article>
    `;

}


// ============================================================
// RESUMEN DE CLASE
// ============================================================

function renderResumen(productos) {

    const elemento =
        $("classSummary");


    if (!elemento) return;


    const cantidadProductos =
        productos.length;


    const cantidadLotes =
        productos.reduce(
            function (total, p) {

                return total + p.lotes.length;

            },
            0
        );


    const cantidadInicial =
        productos.reduce(
            function (total, p) {

                return total +
                    p.lotes.reduce(
                        function (suma, l) {

                            return (
                                suma +
                                numero(
                                    l.cantidadInicial
                                )
                            );

                        },
                        0
                    );

            },
            0
        );


    const consumo =
        productos.reduce(
            function (total, p) {

                return (
                    total +
                    consumoProducto(p)
                );

            },
            0
        );


    const stock =
        productos.reduce(
            function (total, p) {

                return (
                    total +
                    stockProducto(p)
                );

            },
            0
        );


    const agotados =
        productos.reduce(
            function (total, p) {

                return (
                    total +
                    p.lotes.filter(
                        function (l) {

                            return (
                                stockLote(
                                    p.id,
                                    l.id
                                ) <= 0
                            );

                        }
                    ).length
                );

            },
            0
        );


    const bajos =
        productos.reduce(
            function (total, p) {

                const limite =
                    numero(p.bajoStock);


                if (limite <= 0) {

                    return total;

                }


                return (
                    total +
                    p.lotes.filter(
                        function (l) {

                            const stock =
                                stockLote(
                                    p.id,
                                    l.id
                                );

                            return (
                                stock > 0 &&
                                stock <= limite
                            );

                        }
                    ).length
                );

            },
            0
        );


    elemento.innerHTML =

        itemResumen(
            "Productos",
            cantidadProductos
        ) +

        itemResumen(
            "Lotes",
            cantidadLotes
        ) +

        itemResumen(
            "Cantidad inicial",
            formatoNumero(cantidadInicial)
        ) +

        itemResumen(
            "Consumo",
            formatoNumero(consumo)
        ) +

        itemResumen(
            "Stock actual",
            formatoNumero(stock)
        ) +

        itemResumen(
            "Bajo / agotado",
            bajos + " / " + agotados
        );

}


function itemResumen(nombre, valor) {

    return `
        <div class="summary-item">

            <b>
                ${escapar(valor)}
            </b>

            <span>
                ${escapar(nombre)}
            </span>

        </div>
    `;

}


// ============================================================
// MOSTRAR PRODUCTO
// ============================================================

function mostrarProducto(productoId) {

    const p =
        producto(productoId);


    if (!p) return;


    if ($("viewClasses")) {

        $("viewClasses")
            .classList
            .add("hidden");

    }


    if ($("viewHistory")) {

        $("viewHistory")
            .classList
            .add("hidden");

    }


    if ($("viewProduct")) {

        $("viewProduct")
            .classList
            .remove("hidden");

    }


    renderNav();


    const stock =
        stockProducto(p);


    $("viewProduct").innerHTML = `

        <div class="detail-card">

            <div class="detail-head">

                <div>

                    <button
                        class="btn"
                        data-action="back"
                    >
                        ← Volver
                    </button>


                    <h2 class="detail-title">
                        ${escapar(p.nombre)}
                    </h2>


                    <div class="meta">
                        ${escapar(p.clase)}
                        ·
                        ${escapar(p.proveedor)}
                    </div>

                </div>


                <div class="card-actions">

                    <button
                        class="btn"
                        data-action="edit-product"
                        data-pid="${p.id}"
                    >
                        ✏ Editar producto
                    </button>


                    <button
                        class="btn danger"
                        data-action="delete-product"
                        data-pid="${p.id}"
                    >
                        🗑 Eliminar producto
                    </button>

                </div>

            </div>


            <div class="detail-info">

                ${infoDetalle(
                    "Proveedor",
                    p.proveedor
                )}

                ${infoDetalle(
                    "Unidad",
                    p.unidad
                )}

                ${infoDetalle(
                    "Dosis recomendada",
                    p.dosis || "—"
                )}

                ${infoDetalle(
                    "Aviso bajo stock",
                    numero(p.bajoStock) > 0
                        ? formatoNumero(p.bajoStock)
                            + " "
                            + p.unidad
                        : "Desactivado"
                )}

            </div>


            <div class="info-box">

                <span>
                    Características
                </span>


                <div class="characteristics">

                    ${escapar(
                        p.caracteristicas ||
                        "Sin características indicadas."
                    )}

                </div>

            </div>


            <div class="section-head">

                <h3>

                    📦 Lotes
                    (${p.lotes.length})

                    · Stock
                    ${formatoNumero(stock)}
                    ${escapar(p.unidad)}

                </h3>


                <button
                    class="btn primary"
                    data-action="add-lot"
                    data-pid="${p.id}"
                >
                    ＋ Nuevo lote
                </button>

            </div>


            <div>

                ${
                    p.lotes.length
                        ? p.lotes
                            .map(function (l) {

                                return cardLote(
                                    p,
                                    l
                                );

                            })
                            .join("")
                        : `
                            <div class="empty">
                                Este producto todavía
                                no tiene lotes.
                            </div>
                        `
                }

            </div>

        </div>

    `;

}


// ============================================================
// INFO DETALLE
// ============================================================

function infoDetalle(nombre, valor) {

    return `
        <div class="info-box">

            <span>
                ${escapar(nombre)}
            </span>

            <b>
                ${escapar(valor)}
            </b>

        </div>
    `;

}


// ============================================================
// TARJETA LOTE
// ============================================================

function cardLote(p, l) {

    const movimientos =
        movimientosLote(
            p.id,
            l.id
        );


    const inicial =
        numero(l.cantidadInicial);


    const entradas =
        entradasLote(
            p.id,
            l.id
        );


    const consumo =
        consumoLote(
            p.id,
            l.id
        );


    const stock =
        stockLote(
            p.id,
            l.id
        );


    return `

        <div class="lot-card">

            <div class="lot-head">

                <h4>
                    Lote
                    ${escapar(l.nombre)}
                </h4>


                <div>

                    <button
                        class="btn"
                        data-action="edit-lot"
                        data-pid="${p.id}"
                        data-lid="${l.id}"
                    >
                        ✏ Editar
                    </button>


                    <button
                        class="btn danger"
                        data-action="delete-lot"
                        data-pid="${p.id}"
                        data-lid="${l.id}"
                    >
                        🗑 Eliminar
                    </button>

                </div>

            </div>


            <div class="lot-body">


                <div class="lot-stats">

                    ${statLote(
                        "Inicial",
                        formatoNumero(inicial)
                        + " "
                        + p.unidad
                    )}


                    ${statLote(
                        "Entradas",
                        "+"
                        + formatoNumero(entradas)
                        + " "
                        + p.unidad
                    )}


                    ${statLote(
                        "Consumo",
                        "-"
                        + formatoNumero(consumo)
                        + " "
                        + p.unidad
                    )}


                    ${statLote(
                        "Stock actual",
                        formatoNumero(stock)
                        + " "
                        + p.unidad
                    )}

                </div>


                <div class="lot-actions">

                    <button
                        class="btn primary"
                        data-action="entry"
                        data-pid="${p.id}"
                        data-lid="${l.id}"
                    >
                        ＋ Dar entrada
                    </button>


                    <button
                        class="btn"
                        data-action="consume"
                        data-pid="${p.id}"
                        data-lid="${l.id}"
                    >
                        − Registrar consumo
                    </button>

                </div>


                ${
                    movimientos.length
                        ? `
                            <div
                                class="table-card"
                                style="margin-top:12px"
                            >
                                ${tablaMovimientos(
                                    movimientos,
                                    p
                                )}
                            </div>
                        `
                        : ""
                }

            </div>

        </div>

    `;

}


// ============================================================
// ESTADÍSTICA LOTE
// ============================================================

function statLote(nombre, valor) {

    return `
        <div class="lot-stat">

            <span>
                ${escapar(nombre)}
            </span>

            <b>
                ${escapar(valor)}
            </b>

        </div>
    `;

}


// ============================================================
// TABLA MOVIMIENTOS
// ============================================================

function tablaMovimientos(
    movimientos,
    p
) {

    const ordenados =
        movimientos
            .slice()
            .sort(
                function (a, b) {

                    return String(b.fecha)
                        .localeCompare(
                            String(a.fecha)
                        );

                }
            );


    return `

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
                        Cantidad
                    </th>

                    <th>
                        Descripción
                    </th>

                    <th>
                        Acciones
                    </th>

                </tr>

            </thead>


            <tbody>

                ${
                    ordenados.map(
                        function (movimiento) {

                            return `

                                <tr>

                                    <td>
                                        ${escapar(
                                            movimiento.fecha
                                        )}
                                    </td>


                                    <td
                                        class="${escapar(
                                            movimiento.tipo
                                        )}"
                                    >

                                        ${
                                            movimiento.tipo ===
                                            "entrada"
                                                ? "ENTRADA"
                                                : "CONSUMO"
                                        }

                                    </td>


                                    <td>

                                        ${
                                            movimiento.tipo ===
                                            "entrada"
                                                ? "+"
                                                : "-"
                                        }

                                        ${formatoNumero(
                                            movimiento.cantidad
                                        )}

                                        ${escapar(
                                            p.unidad
                                        )}

                                    </td>


                                    <td>

                                        ${escapar(
                                            movimiento.descripcion ||
                                            ""
                                        )}

                                    </td>


                                    <td>

                                        <button
                                            class="btn"
                                            data-action="edit-movement"
                                            data-pid="${p.id}"
                                            data-lid="${movimiento.loteId}"
                                            data-mid="${movimiento.id}"
                                        >
                                            ✏
                                        </button>


                                        <button
                                            class="btn danger"
                                            data-action="delete-movement"
                                            data-mid="${movimiento.id}"
                                        >
                                            🗑
                                        </button>

                                    </td>

                                </tr>

                            `;

                        }
                    ).join("")
                }

            </tbody>

        </table>

    `;

}


// ============================================================
// MOSTRAR HISTORIAL
// ============================================================
function mostrarHistorial() {

    if ($("viewClasses")) {

        $("viewClasses")
            .classList
            .add("hidden");

    }


    if ($("viewProduct")) {

        $("viewProduct")
            .classList
            .add("hidden");

    }


    if ($("viewHistory")) {

        $("viewHistory")
            .classList
            .remove("hidden");

    }


    renderNav();


    const tabla =
        $("historyTable");


    if (!tabla) return;


    /* =====================================================
       FILTROS
    ====================================================== */

    const buscador =
        $("historySearch");

    const filtroTipo =
        $("historyTypeFilter");

    const filtroClase =
        $("historyClassFilter");


    const textoBusqueda =
        buscador
            ? buscador.value
                .trim()
                .toLowerCase()
            : "";


    const tipoSeleccionado =
        filtroTipo
            ? filtroTipo.value
            : "todos";


    const claseSeleccionada =
        filtroClase
            ? filtroClase.value
            : "todas";


    /* =====================================================
       MOVIMIENTOS
    ====================================================== */

    let movimientos =
        datos.movimientos
            .slice();


    /* =====================================================
       FILTRAR
    ====================================================== */

    movimientos =
        movimientos.filter(
            function (movimiento) {

                const p =
                    producto(
                        movimiento.productoId
                    );


                /* -----------------------------------------
                   FILTRO TIPO
                ----------------------------------------- */

                if (
                    tipoSeleccionado !== "todos" &&
                    movimiento.tipo !== tipoSeleccionado
                ) {

                    return false;

                }


                /* -----------------------------------------
                   FILTRO CLASE
                ----------------------------------------- */

                if (
                    claseSeleccionada !== "todas"
                ) {

                    if (
                        !p ||
                        p.clase !== claseSeleccionada
                    ) {

                        return false;

                    }

                }


                /* -----------------------------------------
                   BUSCADOR
                ----------------------------------------- */

                if (textoBusqueda) {

                    const l =
                        p
                            ? lote(
                                p.id,
                                movimiento.loteId
                            )
                            : null;


                    const texto =
                        [

                            p?.nombre || "",

                            p?.proveedor || "",

                            p?.clase || "",

                            p?.unidad || "",

                            l?.nombre || "",

                            movimiento.fecha || "",

                            movimiento.tipo || "",

                            movimiento.descripcion || "",

                            movimiento.cantidad ?? ""

                        ]
                            .join(" ")
                            .toLowerCase();


                    if (
                        !texto.includes(
                            textoBusqueda
                        )
                    ) {

                        return false;

                    }

                }


                return true;

            }
        );


    /* =====================================================
       ORDENAR POR FECHA
    ====================================================== */

    movimientos.sort(
        function (a, b) {

            return String(b.fecha)
                .localeCompare(
                    String(a.fecha)
                );

        }
    );


    /* =====================================================
       SIN RESULTADOS
    ====================================================== */

    if (!movimientos.length) {

        tabla.innerHTML = `

            <div class="empty">

                No hay movimientos que coincidan
                con los filtros.

            </div>

        `;

        return;

    }


    /* =====================================================
       TABLA
    ====================================================== */

    tabla.innerHTML = `

        <table class="data-table">

            <thead>

                <tr>

                    <th>
                        Fecha
                    </th>

                    <th>
                        Producto
                    </th>

                    <th>
                        Lote
                    </th>

                    <th>
                        Tipo
                    </th>

                    <th>
                        Cantidad
                    </th>

                    <th>
                        Descripción
                    </th>

                    <th>
                        Acciones
                    </th>

                </tr>

            </thead>


            <tbody>

                ${

                    movimientos.map(

                        function (movimiento) {

                            const p =
                                producto(
                                    movimiento.productoId
                                );


                            const l =
                                p
                                    ? lote(
                                        p.id,
                                        movimiento.loteId
                                    )
                                    : null;


                            return `

                                <tr>

                                    <td>

                                        ${escapar(
                                            movimiento.fecha
                                        )}

                                    </td>


                                    <td>

                                        ${escapar(
                                            p?.nombre ||
                                            "Producto eliminado"
                                        )}

                                    </td>


                                    <td>

                                        ${escapar(
                                            l?.nombre ||
                                            "—"
                                        )}

                                    </td>


                                    <td
                                        class="${escapar(
                                            movimiento.tipo
                                        )}"
                                    >

                                        ${
                                            movimiento.tipo ===
                                            "entrada"

                                                ? "ENTRADA"

                                                : "CONSUMO"
                                        }

                                    </td>


                                    <td>

                                        ${
                                            movimiento.tipo ===
                                            "entrada"
                                                ? "+"
                                                : "-"
                                        }

                                        ${formatoNumero(
                                            movimiento.cantidad
                                        )}

                                        ${escapar(
                                            p?.unidad ||
                                            ""
                                        )}

                                    </td>


                                    <td>

                                        ${escapar(
                                            movimiento.descripcion ||
                                            ""
                                        )}

                                    </td>


                                    <td>

                                        ${
                                            p && l
                                                ? `

                                                    <button
                                                        class="btn"
                                                        data-action="edit-movement"
                                                        data-pid="${p.id}"
                                                        data-lid="${l.id}"
                                                        data-mid="${movimiento.id}"
                                                    >

                                                        ✏

                                                    </button>

                                                `
                                                : ""
                                        }


                                        <button
                                            class="btn danger"
                                            data-action="delete-movement"
                                            data-mid="${movimiento.id}"
                                        >

                                            🗑

                                        </button>

                                    </td>

                                </tr>

                            `;

                        }

                    ).join("")

                }

            </tbody>

        </table>

    `;

}


// ============================================================
// ABRIR MODAL PRODUCTO
// ============================================================

function abrirProducto(productoId = null) {

    const modal =
        $("modal");


    if (!modal) return;


    modal.classList.remove("hidden");


    $("modalTitle").textContent =
        productoId
            ? "Editar producto"
            : "Nuevo producto";


    $("productId").value =
        productoId || "";


    if (productoId) {

        const p =
            producto(productoId);


        if (!p) return;


        $("fNombre").value =
            p.nombre || "";


        $("fProveedor").value =
            p.proveedor || PROVEEDORES[0];


        $("fClase").value =
            p.clase || CLASES[0];


        $("fUnidad").value =
            p.unidad || "Kg";


        $("fDosis").value =
            p.dosis || "";


        $("fBajoStock").value =
            numero(p.bajoStock);


        $("fCaracteristicas").value =
            p.caracteristicas || "";


    } else {

        $("productForm").reset();


        $("fProveedor").value =
            PROVEEDORES[0];


        $("fClase").value =
            CLASES.includes(claseActual)
                ? claseActual
                : CLASES[0];


        $("fUnidad").value =
            "Kg";


        $("fBajoStock").value =
            0;

    }

}


// ============================================================
// GUARDAR PRODUCTO
// ============================================================

function guardarProducto(evento) {

    evento.preventDefault();


    const id =
        $("productId").value;


    const nuevoProducto = {

        nombre:
            $("fNombre")
                .value
                .trim(),

        proveedor:
            $("fProveedor")
                .value,

        clase:
            $("fClase")
                .value,

        unidad:
            $("fUnidad")
                .value,

        dosis:
            $("fDosis")
                .value
                .trim(),

        bajoStock:
            numero(
                $("fBajoStock")
                    .value
            ),

        caracteristicas:
            $("fCaracteristicas")
                .value
                .trim()

    };


    if (!nuevoProducto.nombre) {

        alert(
            "Indica el nombre del producto."
        );

        return;

    }


    if (id) {

        const p =
            producto(id);


        if (!p) return;


        Object.assign(
            p,
            nuevoProducto
        );


        guardar();

        cerrarModalProducto();

        toast(
            "Producto actualizado."
        );


        mostrarProducto(id);


    } else {

        nuevoProducto.id =
            uid("p");


        nuevoProducto.lotes = [];


        datos.productos.push(
            nuevoProducto
        );


        guardar();

        cerrarModalProducto();

        toast(
            "Producto creado."
        );


        claseActual =
            nuevoProducto.clase;


        mostrarClase();

    }

}


// ============================================================
// ELIMINAR PRODUCTO
// ============================================================

function eliminarProducto(productoId) {

    const p =
        producto(productoId);


    if (!p) return;


    const confirmado =
        confirm(
            `¿Eliminar "${p.nombre}"?\n\n` +
            `Se eliminarán también todos sus lotes ` +
            `y movimientos.\n\n` +
            `Esta acción no se puede deshacer.`
        );


    if (!confirmado) return;


    datos.productos =
        datos.productos.filter(
            function (productoActual) {

                return (
                    productoActual.id !==
                    productoId
                );

            }
        );


    datos.movimientos =
        datos.movimientos.filter(
            function (movimiento) {

                return (
                    movimiento.productoId !==
                    productoId
                );

            }
        );


    guardar();


    toast(
        "Producto eliminado."
    );


    mostrarClase();

}


// ============================================================
// ABRIR MODAL LOTE
// ============================================================

function abrirLote(
    productoId,
    loteId = null
) {

    const p =
        producto(productoId);


    if (!p) return;


    $("lotModal")
        .classList
        .remove("hidden");


    $("lotProductId").value =
        productoId;


    $("lotId").value =
        loteId || "";


    $("lotModalTitle").textContent =
        loteId
            ? "Editar lote"
            : "Nuevo lote";


    if (loteId) {

        const l =
            lote(
                productoId,
                loteId
            );


        if (!l) return;


        $("lotNombre").value =
            l.nombre || "";


        $("lotCantidad").value =
            numero(
                l.cantidadInicial
            );

    } else {

        $("lotForm").reset();


        $("lotProductId").value =
            productoId;


        $("lotId").value =
            "";

    }

}


// ============================================================
// GUARDAR LOTE
// ============================================================

function guardarLote(evento) {

    evento.preventDefault();


    const productoId =
        $("lotProductId").value;


    const loteId =
        $("lotId").value;


    const p =
        producto(productoId);


    if (!p) return;


    const nombre =
        $("lotNombre")
            .value
            .trim();


    const cantidad =
        numero(
            $("lotCantidad")
                .value
        );


    if (!nombre) {

        alert(
            "Indica el número o nombre del lote."
        );

        return;

    }


    if (cantidad < 0) {

        alert(
            "La cantidad inicial no puede ser negativa."
        );

        return;

    }


    if (loteId) {

        const l =
            lote(
                productoId,
                loteId
            );


        if (!l) return;


        l.nombre =
            nombre;


        l.cantidadInicial =
            cantidad;


        guardar();

        $("lotModal")
            .classList
            .add("hidden");


        toast(
            "Lote actualizado."
        );


        mostrarProducto(
            productoId
        );


    } else {

        p.lotes.push({

            id: uid("l"),

            nombre: nombre,

            cantidadInicial:
                cantidad

        });


        guardar();

        $("lotModal")
            .classList
            .add("hidden");


        toast(
            "Lote creado."
        );


        mostrarProducto(
            productoId
        );

    }

}


// ============================================================
// ELIMINAR LOTE
// ============================================================

function eliminarLote(
    productoId,
    loteId
) {

    const p =
        producto(productoId);


    const l =
        lote(
            productoId,
            loteId
        );


    if (!p || !l) return;


    const confirmado =
        confirm(
            `¿Eliminar el lote "${l.nombre}" ` +
            `de "${p.nombre}"?\n\n` +

            `Se eliminará únicamente este lote ` +
            `y sus movimientos.\n\n` +

            `El producto y los demás lotes ` +
            `permanecerán.`
        );


    if (!confirmado) return;


    p.lotes =
        p.lotes.filter(
            function (loteActual) {

                return (
                    loteActual.id !==
                    loteId
                );

            }
        );


    datos.movimientos =
        datos.movimientos.filter(
            function (movimiento) {

                return !(
                    movimiento.productoId ===
                    productoId &&

                    movimiento.loteId ===
                    loteId
                );

            }
        );


    guardar();


    toast(
        "Lote eliminado."
    );


    mostrarProducto(
        productoId
    );

}


// ============================================================
// ABRIR MOVIMIENTO
// ============================================================

function abrirMovimiento(
    productoId,
    loteId,
    tipo = null,
    movimientoId = null
) {

    const p =
        producto(productoId);


    const l =
        lote(
            productoId,
            loteId
        );


    if (!p || !l) return;


    $("movementModal")
        .classList
        .remove("hidden");


    $("movementId").value =
        movimientoId || "";


    $("movementProductId").value =
        productoId;


    $("movementLotId").value =
        loteId;


    if (movimientoId) {

        const movimiento =
            datos.movimientos.find(
                function (m) {

                    return (
                        m.id ===
                        movimientoId
                    );

                }
            );


        if (!movimiento) return;


        $("movementModalTitle")
            .textContent =
            "Editar movimiento";


        $("movementTipo").value =
            movimiento.tipo;


        $("movementCantidad").value =
            numero(
                movimiento.cantidad
            );


        $("movementFecha").value =
            movimiento.fecha ||
            hoy();


        $("movementDescripcion").value =
            movimiento.descripcion ||
            "";


    } else {

        $("movementModalTitle")
            .textContent =
            tipo === "entrada"
                ? "Nueva entrada"
                : "Nuevo consumo";


        $("movementForm").reset();


        $("movementId").value =
            "";


        $("movementProductId").value =
            productoId;


        $("movementLotId").value =
            loteId;


        $("movementTipo").value =
            tipo || "consumo";


        $("movementCantidad").value =
            "";


        $("movementFecha").value =
            hoy();


        $("movementDescripcion").value =
            "";

    }

}


// ============================================================
// GUARDAR MOVIMIENTO
// ============================================================

function guardarMovimiento(evento) {

    evento.preventDefault();


    const movimientoId =
        $("movementId").value;


    const productoId =
        $("movementProductId").value;


    const loteId =
        $("movementLotId").value;


    const tipo =
        $("movementTipo").value;


    const cantidad =
        numero(
            $("movementCantidad")
                .value
        );


    const fecha =
        $("movementFecha")
            .value ||
        hoy();


    const descripcion =
        $("movementDescripcion")
            .value
            .trim();


    if (cantidad <= 0) {

        alert(
            "La cantidad debe ser mayor que cero."
        );

        return;

    }


    const stockActual =
        stockLote(
            productoId,
            loteId
        );


    // --------------------------------------------------------
    // COMPROBACIÓN DE CONSUMO
    // --------------------------------------------------------

    if (
        tipo === "consumo" &&
        !movimientoId &&
        cantidad > stockActual
    ) {

        const continuar =
            confirm(
                `El consumo indicado es de ` +
                `${formatoNumero(cantidad)}.\n\n` +

                `El stock actual del lote es ` +
                `${formatoNumero(stockActual)}.\n\n` +

                `El consumo dejaría el stock en negativo.\n\n` +

                `¿Quieres registrarlo de todas formas?`
            );


        if (!continuar) {

            return;

        }

    }


    const nuevoMovimiento = {

        id:
            movimientoId ||
            uid("m"),

        productoId:
            productoId,

        loteId:
            loteId,

        tipo:
            tipo === "entrada"
                ? "entrada"
                : "consumo",

        cantidad:
            cantidad,

        fecha:
            fecha,

        descripcion:
            descripcion

    };


    if (movimientoId) {

        const movimiento =
            datos.movimientos.find(
                function (m) {

                    return (
                        m.id ===
                        movimientoId
                    );

                }
            );


        if (!movimiento) {

            alert(
                "No se encontró el movimiento."
            );

            return;

        }


        // ----------------------------------------------------
        // AL EDITAR UN CONSUMO
        // ----------------------------------------------------
        //
        // Se comprueba el stock que quedaría
        // sin contar el movimiento antiguo.
        // ----------------------------------------------------

        const stockSinMovimiento =
            calcularStockSinMovimiento(
                productoId,
                loteId,
                movimientoId
            );


        if (
            nuevoMovimiento.tipo ===
            "consumo" &&

            cantidad >
            stockSinMovimiento
        ) {

            const continuar =
                confirm(
                    `El nuevo consumo es de ` +
                    `${formatoNumero(cantidad)}.\n\n` +

                    `El stock disponible sin contar ` +
                    `este movimiento es ` +
                    `${formatoNumero(stockSinMovimiento)}.\n\n` +

                    `El stock quedaría negativo.\n\n` +

                    `¿Quieres continuar?`
                );


            if (!continuar) {

                return;

            }

        }


        Object.assign(
            movimiento,
            nuevoMovimiento
        );


        toast(
            "Movimiento actualizado."
        );


    } else {

        datos.movimientos.push(
            nuevoMovimiento
        );


        if (
            nuevoMovimiento.tipo ===
            "entrada"
        ) {

            toast(
                "Entrada registrada."
            );

        } else {

            toast(
                "Consumo registrado."
            );

        }

    }


    guardar();


    $("movementModal")
        .classList
        .add("hidden");


    mostrarProducto(
        productoId
    );

}


// ============================================================
// STOCK SIN UN MOVIMIENTO
// ============================================================

function calcularStockSinMovimiento(
    productoId,
    loteId,
    movimientoId
) {

    const l =
        lote(
            productoId,
            loteId
        );


    if (!l) return 0;


    let stock =
        numero(
            l.cantidadInicial
        );


    datos.movimientos.forEach(
        function (movimiento) {

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


            if (
                movimiento.id ===
                movimientoId
            ) {

                return;

            }


            if (
                movimiento.tipo ===
                "entrada"
            ) {

                stock +=
                    numero(
                        movimiento.cantidad
                    );

            } else {

                stock -=
                    numero(
                        movimiento.cantidad
                    );

            }

        }
    );


    return stock;

}


// ============================================================
// ELIMINAR MOVIMIENTO
// ============================================================

function eliminarMovimiento(
    movimientoId
) {

    const movimiento =
        datos.movimientos.find(
            function (m) {

                return (
                    m.id ===
                    movimientoId
                );

            }
        );


    if (!movimiento) return;


    const confirmado =
        confirm(
            "¿Eliminar este movimiento?\n\n" +

            "El stock se recalculará " +
            "automáticamente."
        );


    if (!confirmado) return;


    datos.movimientos =
        datos.movimientos.filter(
            function (m) {

                return (
                    m.id !==
                    movimientoId
                );

            }
        );


    guardar();


    toast(
        "Movimiento eliminado."
    );


    if (
        claseActual ===
        "__historial"
    ) {

        mostrarHistorial();

    } else {

        const p =
            producto(
                movimiento.productoId
            );


        if (p) {

            mostrarProducto(
                p.id
            );

        } else {

            mostrarClase();

        }

    }

}


// ============================================================
// LIMPIAR MOVIMIENTOS E HISTORIAL
// ============================================================
//
// IMPORTANTE:
// - NO elimina productos.
// - NO elimina lotes.
// - NO cambia el stock actual.
// - Convierte el stock actual de cada lote
//   en su nueva cantidad inicial.
// - Después elimina todos los movimientos.
// ============================================================

function limpiarHistorial() {

    if (!datos.movimientos.length) {

        alert(
            "No hay movimientos que limpiar."
        );

        return;

    }


    const confirmado =
        confirm(
            "Se borrarán TODOS los movimientos " +
            "e historial.\n\n" +

            "El stock actual de cada lote " +
            "se conservará como nueva cantidad inicial.\n\n" +

            "Los productos y los lotes NO se eliminarán.\n\n" +

            "¿Continuar?"
        );


    if (!confirmado) return;


    // Primero calculamos el stock de cada lote
    // antes de eliminar los movimientos.

    datos.productos.forEach(
        function (p) {

            p.lotes.forEach(
                function (l) {

                    const stockActual =
                        stockLote(
                            p.id,
                            l.id
                        );


                    l.cantidadInicial =
                        stockActual;

                }
            );

        }
    );


    // Ahora sí eliminamos todos
    // los movimientos.

    datos.movimientos = [];


    guardar();


    toast(
        "Historial limpiado y stock conservado."
    );


    mostrarHistorial();

}


// ============================================================
// CERRAR MODALES
// ============================================================

function cerrarModales() {

    if ($("modal")) {

        $("modal")
            .classList
            .add("hidden");

    }


    if ($("lotModal")) {

        $("lotModal")
            .classList
            .add("hidden");

    }


    if ($("movementModal")) {

        $("movementModal")
            .classList
            .add("hidden");

    }

}


function cerrarModalProducto() {

    if ($("modal")) {

        $("modal")
            .classList
            .add("hidden");

    }

}


function prepararCierres() {

    document
        .querySelectorAll(
            "[data-close-modal]"
        )
        .forEach(
            function (boton) {

                boton.onclick =
                    cerrarModalProducto;

            }
        );


    document
        .querySelectorAll(
            "[data-close-lot-modal]"
        )
        .forEach(
            function (boton) {

                boton.onclick =
                    function () {

                        $("lotModal")
                            .classList
                            .add("hidden");

                    };

            }
        );


    document
        .querySelectorAll(
            "[data-close-movement-modal]"
        )
        .forEach(
            function (boton) {

                boton.onclick =
                    function () {

                        $("movementModal")
                            .classList
                            .add("hidden");

                    };

            }
        );


    // Cerrar al pulsar fuera del contenido

    document.addEventListener(
        "click",
        function (evento) {

            if (
                evento.target ===
                $("modal")
            ) {

                $("modal")
                    .classList
                    .add("hidden");

            }


            if (
                evento.target ===
                $("lotModal")
            ) {

                $("lotModal")
                    .classList
                    .add("hidden");

            }


            if (
                evento.target ===
                $("movementModal")
            ) {

                $("movementModal")
                    .classList
                    .add("hidden");

            }

        }
    );


    // ESC para cerrar

    document.addEventListener(
        "keydown",
        function (evento) {

            if (
                evento.key ===
                "Escape"
            ) {

                cerrarModales();

            }

        }
    );

}


// ============================================================
// EXPORTAR JSON
// ============================================================

function exportJSON() {

    try {

        const contenido =
            JSON.stringify(
                datos,
                null,
                2
            );


        const blob =
            new Blob(
                [contenido],
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
            document.createElement("a");


        enlace.href =
            url;


        enlace.download =
            "stock-enologico-backup.json";


        document.body.appendChild(
            enlace
        );


        enlace.click();


        document.body.removeChild(
            enlace
        );


        URL.revokeObjectURL(
            url
        );


        toast(
            "JSON exportado correctamente."
        );

    } catch (error) {

        console.error(
            "Error exportando JSON:",
            error
        );


        alert(
            "No se pudo exportar el JSON."
        );

    }

}


// ============================================================
// NORMALIZAR JSON IMPORTADO
// ============================================================

function normalizarImportacion(
    datosImportados
) {

    if (
        !datosImportados ||
        !Array.isArray(
            datosImportados.productos
        )
    ) {

        throw new Error(
            "El JSON no contiene una lista válida de productos."
        );

    }


    const salida = {

        version: 1,

        productos: [],

        movimientos:
            Array.isArray(
                datosImportados.movimientos
            )
                ? datosImportados.movimientos
                : []

    };


    datosImportados.productos.forEach(
        function (p, indice) {

            if (
                !p ||
                typeof p !== "object"
            ) {

                return;

            }


            let proveedor =
                p.proveedor ||
                "VIDEYNOL";


            // Compatibilidad con el JSON anterior
            if (
                proveedor ===
                "VIDYENOL"
            ) {

                proveedor =
                    "VIDEYNOL";

            }


            if (
                proveedor ===
                'VASON "OENOBRANDS"'
            ) {

                proveedor =
                    "VASON";

            }


            if (
                !PROVEEDORES.includes(
                    proveedor
                )
            ) {

                proveedor =
                    "VIDEYNOL";

            }


            let clase =
                p.clase ||
                p.claseProducto ||
                "otros";


            if (
                clase ===
                "enzima"
            ) {

                clase =
                    "encima";

            }


            if (
                !CLASES.includes(
                    clase
                )
            ) {

                clase =
                    "otros";

            }


            let unidad =
                p.unidad ||
                "Kg";


            if (
                !UNIDADES.includes(
                    unidad
                )
            ) {

                unidad =
                    "Kg";

            }


            const nuevoProducto = {

                id:
                    p.id ||
                    uid("p"),

                nombre:
                    String(
                        p.nombre ||
                        p.producto ||
                        (
                            "Producto " +
                            (indice + 1)
                        )
                    ),

                proveedor:
                    proveedor,

                clase:
                    clase,

                unidad:
                    unidad,

                dosis:
                    p.dosis ||
                    p.dosisRecomendada ||
                    "",

                bajoStock:
                    numero(
                        p.bajoStock
                    ),

                caracteristicas:
                    p.caracteristicas ||
                    p.descripcion ||
                    "",

                lotes: []

            };


            // ------------------------------------------------
            // FORMATO NUEVO
            // ------------------------------------------------

            if (
                Array.isArray(
                    p.lotes
                )
            ) {

                p.lotes.forEach(
                    function (l) {

                        if (
                            !l ||
                            typeof l !==
                            "object"
                        ) {

                            return;

                        }


                        nuevoProducto.lotes.push({

                            id:
                                l.id ||
                                uid("l"),

                            nombre:
                                String(
                                    l.nombre ??
                                    l.lote ??
                                    "Sin lote"
                                ),

                            cantidadInicial:
                                numero(
                                    l.cantidadInicial
                                )

                        });

                    }
                );

            }


            // ------------------------------------------------
            // COMPATIBILIDAD CON JSON PLANO
            // ------------------------------------------------

            else if (
                p.lote !== undefined ||
                p.cantidadInicial !== undefined ||
                p.cantidadEntrada !== undefined
            ) {

                let cantidad =
                    p.cantidadInicial;


                if (
                    cantidad === undefined
                ) {

                    cantidad =
                        p.cantidadEntrada;

                }


                nuevoProducto.lotes.push({

                    id:
                        uid("l"),

                    nombre:
                        String(
                            p.lote ||
                            "Sin lote"
                        ),

                    cantidadInicial:
                        numero(
                            cantidad
                        )

                });

            }


            salida.productos.push(
                nuevoProducto
            );

        }
    );


    // ========================================================
    // VALIDAR MOVIMIENTOS
    // ========================================================

    const productosValidos =
        new Set(
            salida.productos.map(
                function (p) {

                    return p.id;

                }
            )
        );


    const lotesValidos =
        new Set(
            salida.productos.flatMap(
                function (p) {

                    return p.lotes.map(
                        function (l) {

                            return l.id;

                        }
                    );

                }
            )
        );


    salida.movimientos =
        salida.movimientos
            .filter(
                function (movimiento) {

                    return (
                        movimiento &&
                        productosValidos.has(
                            movimiento.productoId
                        ) &&
                        lotesValidos.has(
                            movimiento.loteId
                        )
                    );

                }
            )
            .map(
                function (movimiento) {

                    return {

                        id:
                            movimiento.id ||
                            uid("m"),

                        productoId:
                            movimiento.productoId,

                        loteId:
                            movimiento.loteId,

                        tipo:
                            movimiento.tipo ===
                            "entrada"
                                ? "entrada"
                                : "consumo",

                        cantidad:
                            numero(
                                movimiento.cantidad
                            ),

                        fecha:
                            movimiento.fecha ||
                            hoy(),

                        descripcion:
                            movimiento.descripcion ||
                            ""

                    };

                }
            );


    return salida;

}


// ============================================================
// IMPORTAR JSON
// ============================================================

function importJSON(evento) {

    const archivo =
        evento.target.files[0];


    if (!archivo) return;


    const lector =
        new FileReader();


    lector.onload =
        function () {

            try {

                const contenido =
                    JSON.parse(
                        lector.result
                    );


                const importado =
                    normalizarImportacion(
                        contenido
                    );


                const confirmado =
                    confirm(
                        `Se van a importar:\n\n` +

                        `${importado.productos.length} productos\n` +

                        `${importado.productos.reduce(
                            function (total, p) {

                                return (
                                    total +
                                    p.lotes.length
                                );

                            },
                            0
                        )} lotes\n` +

                        `${importado.movimientos.length} movimientos\n\n` +

                        `ATENCIÓN:\n` +

                        `Esto sustituirá los datos actuales ` +
                        `del programa.\n\n` +

                        `¿Continuar?`
                    );


                if (!confirmado) {

                    evento.target.value =
                        "";

                    return;

                }


                datos =
                    importado;


                guardar();


                toast(
                    "JSON importado correctamente."
                );


                setTimeout(
                    function () {

                        location.reload();

                    },
                    500
                );


            } catch (error) {

                console.error(
                    "Error importando JSON:",
                    error
                );


                alert(
                    "No se pudo importar el JSON.\n\n" +
                    error.message
                );

            }


            evento.target.value =
                "";

        };


    lector.onerror =
        function () {

            alert(
                "No se pudo leer el archivo JSON."
            );


            evento.target.value =
                "";

        };


    lector.readAsText(
        archivo,
        "UTF-8"
    );

}


// ============================================================
// EXPORTAR PDF
// ============================================================

function exportPDF() {

    if (
        !window.jspdf
    ) {

        alert(
            "No se ha podido cargar jsPDF.\n\n" +
            "Comprueba que tienes conexión a Internet " +
            "y vuelve a intentarlo."
        );

        return;

    }


    if (
        typeof window.jspdf.jsPDF !==
        "function"
    ) {

        alert(
            "La librería jsPDF no está disponible."
        );

        return;

    }


    const jsPDF =
        window.jspdf.jsPDF;


    const doc =
        new jsPDF({
            orientation: "landscape",
            unit: "mm",
            format: "a4"
        });


    // --------------------------------------------------------
    // PORTADA
    // --------------------------------------------------------

    doc.setFontSize(20);

    doc.text(
        "Stock Enológico",
        14,
        16
    );


    doc.setFontSize(10);

    doc.text(
        "Resumen de productos, lotes y stock actual",
        14,
        23
    );


    doc.text(
        "Fecha: " + hoy(),
        14,
        29
    );


    let primeraPaginaClase =
        true;


    // --------------------------------------------------------
    // UNA SECCIÓN POR CLASE
    // --------------------------------------------------------

    CLASES.forEach(
        function (clase) {

            const productos =
                datos.productos.filter(
                    function (p) {

                        return (
                            p.clase ===
                            clase
                        );

                    }
                );


            if (!productos.length) {

                return;

            }


            doc.addPage();


            doc.setFontSize(15);


            doc.text(
                capitalizar(clase),
                14,
                16
            );


            // ------------------------------------------------
            // TABLA
            // ------------------------------------------------

            const filas = [];


            productos.forEach(
                function (p) {

                    p.lotes.forEach(
                        function (l) {

                            const inicial =
                                numero(
                                    l.cantidadInicial
                                );


                            const entradas =
                                entradasLote(
                                    p.id,
                                    l.id
                                );


                            const consumo =
                                consumoLote(
                                    p.id,
                                    l.id
                                );


                            const stock =
                                stockLote(
                                    p.id,
                                    l.id
                                );


                            filas.push([

                                p.nombre,

                                p.proveedor,

                                l.nombre,

                                formatoNumero(
                                    inicial
                                ) +
                                " " +
                                p.unidad,

                                formatoNumero(
                                    entradas
                                ) +
                                " " +
                                p.unidad,

                                formatoNumero(
                                    consumo
                                ) +
                                " " +
                                p.unidad,

                                formatoNumero(
                                    stock
                                ) +
                                " " +
                                p.unidad

                            ]);

                        }
                    );

                }
            );


            if (
                typeof doc.autoTable ===
                "function"
            ) {

                doc.autoTable({

                    startY: 23,

                    head: [[

                        "Producto",

                        "Proveedor",

                        "Lote",

                        "Inicial",

                        "Entradas",

                        "Consumo",

                        "Stock"

                    ]],

                    body:
                        filas,

                    styles: {

                        fontSize: 7,

                        cellPadding: 2

                    },

                    headStyles: {

                        fillColor: [
                            123,
                            36,
                            84
                        ],

                        textColor: 255

                    },

                    margin: {

                        left: 10,

                        right: 10

                    }

                });


            } else {

                // ------------------------------------------------
                // FALLBACK SI AUTOTABLE NO CARGÓ
                // ------------------------------------------------

                let y = 30;


                doc.setFontSize(7);


                filas.forEach(
                    function (fila) {

                        doc.text(
                            fila.join(" | "),
                            10,
                            y
                        );


                        y += 4;


                        if (
                            y > 190
                        ) {

                            doc.addPage();

                            y = 20;

                        }

                    }
                );

            }


            // ------------------------------------------------
            // RESUMEN DE LA CLASE
            // ------------------------------------------------

            let yResumen = 200;


            if (
                doc.lastAutoTable &&
                doc.lastAutoTable.finalY
            ) {

                yResumen =
                    doc.lastAutoTable.finalY +
                    8;

            }


            const cantidadLotes =
                productos.reduce(
                    function (total, p) {

                        return (
                            total +
                            p.lotes.length
                        );

                    },
                    0
                );


            const stockTotal =
                productos.reduce(
                    function (total, p) {

                        return (
                            total +
                            stockProducto(p)
                        );

                    },
                    0
                );


            const consumoTotal =
                productos.reduce(
                    function (total, p) {

                        return (
                            total +
                            consumoProducto(p)
                        );

                    },
                    0
                );


            const entradasTotal =
                productos.reduce(
                    function (total, p) {

                        return (
                            total +
                            entradasProducto(p)
                        );

                    },
                    0
                );


            doc.setFontSize(9);


            doc.text(
                "Productos: " +
                productos.length +

                "   Lotes: " +
                cantidadLotes +

                "   Entradas: " +
                formatoNumero(
                    entradasTotal
                ) +

                "   Consumo: " +
                formatoNumero(
                    consumoTotal
                ) +

                "   Stock actual: " +
                formatoNumero(
                    stockTotal
                ),
                14,
                yResumen
            );

        }
    );


    // --------------------------------------------------------
    // GUARDAR PDF
    // --------------------------------------------------------

    doc.save(
        "stock-enologico.pdf"
    );


    toast(
        "PDF generado correctamente."
    );

}


// ============================================================
// HACER FUNCIONES DISPONIBLES PARA HTML
// ============================================================

window.abrirProducto =
    abrirProducto;

window.abrirLote =
    abrirLote;

window.mostrarClase =
    mostrarClase;

window.mostrarHistorial =
    mostrarHistorial;

window.mostrarProducto =
    mostrarProducto;

window.eliminarProducto =
    eliminarProducto;

window.eliminarLote =
    eliminarLote;

window.abrirMovimiento =
    abrirMovimiento;

window.eliminarMovimiento =
    eliminarMovimiento;

window.exportJSON =
    exportJSON;

window.importJSON =
    importJSON;

window.exportPDF =
    exportPDF;

window.limpiarHistorial =
    limpiarHistorial;


// ============================================================
// INICIO
// ============================================================

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        init
    );

} else {

    init();

}

const historySearch =
    $("historySearch");

if (historySearch) {

    historySearch.addEventListener(
        "input",
        function () {

            mostrarHistorial();

        }
    );

}


const historyTypeFilter =
    $("historyTypeFilter");

if (historyTypeFilter) {

    historyTypeFilter.addEventListener(
        "change",
        function () {

            mostrarHistorial();

        }
    );

}


const historyClassFilter =
    $("historyClassFilter");

if (historyClassFilter) {

    historyClassFilter.addEventListener(
        "change",
        function () {

            mostrarHistorial();

        }
    );

}