
let acumuladoFullTuning = 0;
let enServicio = false;
let capitalInicial = 0;

// URL 
const URL_SCRIPT = "https://script.google.com/macros/s/AKfycbweL2iARGfQnIh5ZEMosjXZR3p1kXAul-jeiuRsWk3Ps2ZfN2JmfiKhrklztsT-Kxoi/exec";


function toggleMenu() {
    const sidebar = document.getElementById("sidebar");
    const main = document.getElementById("main");
    if (!sidebar || !main) return;

    if (sidebar.style.width === "250px") {
        sidebar.style.width = "0";
        main.style.marginLeft = "0";
    } else {
        sidebar.style.width = "250px";
        main.style.marginLeft = "250px";
    }
}


function ocultarTodas() {
   
    const secciones = ["habitual", "completo", "vista-info", "seccion-fichaje", "pantalla-inicio"];
    secciones.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.style.display = "none";
            el.classList.remove("seccion-activa");
        }
    });
}

function mostrarInicio() {
    ocultarTodas();
    const el = document.getElementById("pantalla-inicio");
    if (el) { el.style.display = "block"; }
    document.getElementById("titulo-principal").style.display = "none";
}

function mostrarHabitual() {
    ocultarTodas();
    const el = document.getElementById("habitual");
    if (el) { el.style.display = "block"; el.classList.add("seccion-activa"); }
    document.getElementById("titulo-principal").style.display = "block";
    calcular();
}

function mostrarCompleto() {
    ocultarTodas();
    const el = document.getElementById("completo");
    if (el) { el.style.display = "block"; el.classList.add("seccion-activa"); }
    document.getElementById("titulo-principal").style.display = "block";
    calcular();
}

function mostrarInfo() {
    ocultarTodas();
    const el = document.getElementById("vista-info");
    if (el) { el.style.display = "block"; }
    document.getElementById("titulo-principal").style.display = "none";
}

function mostrarFichaje() {
    ocultarTodas();
    const el = document.getElementById("seccion-fichaje");
    if (el) {
        el.style.display = "block";
        el.classList.add("seccion-activa");
        actualizarTablaProductividad(); 
    }
    document.getElementById("titulo-principal").style.display = "block";
}


function calcular() {
    const habitual = document.getElementById("habitual");
    const completo = document.getElementById("completo");
    const contenedor = (habitual && habitual.classList.contains("seccion-activa")) ? habitual : 
                       (completo && completo.classList.contains("seccion-activa") ? completo : null);
    
    if (!contenedor) return;

    let totalPiezas = 0;
    const filas = contenedor.querySelectorAll("tbody tr");

    filas.forEach((fila) => {
        const input = fila.querySelector("input");
        if (!input) return;

        const cantidad = Math.max(0, parseInt(input.value) || 0);
        input.value = cantidad; 
        const precio = parseInt(fila.cells[3].innerText.replace(/\D/g, ""));
        const totalFila = cantidad * precio;
        fila.cells[4].innerText = "$" + totalFila.toLocaleString();
        totalPiezas += totalFila;
    });

    const montoFinal = totalPiezas + acumuladoFullTuning;
    contenedor.querySelectorAll(".monto-total").forEach(span => {
        span.innerText = montoFinal.toLocaleString();
    });

    const tablaDesc = contenedor.querySelector(".tabla-descuento");
    if (tablaDesc) {
        const filasDesc = tablaDesc.querySelectorAll("tbody tr");
        const porcentajes = [0.05, 0.10, 0.15]; 
        filasDesc.forEach((fila, index) => {
            fila.cells[0].innerText = "$" + montoFinal.toLocaleString();
            const resultado = montoFinal - (montoFinal * porcentajes[index]);
            fila.cells[2].innerText = "$" + Math.round(resultado).toLocaleString();
        });
    }
}

function aplicarFullTuning() {
    acumuladoFullTuning += 120000;
    calcular();
}

function reiniciar() {
    document.querySelectorAll("input").forEach(i => i.value = 0);
    acumuladoFullTuning = 0;
    calcular();
}

function copiarTotal() {
    const activo = document.querySelector(".seccion-activa");
    if (!activo) return;
    const spanTotal = activo.querySelector(".monto-total");
    if (!spanTotal) return;
    const totalTexto = spanTotal.innerText;
    const soloNumero = totalTexto.replace(/\./g, "");
    
    const input = document.createElement("input");
    input.value = soloNumero;
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    document.body.removeChild(input);
}


function gestionarFichaje() {
    const btn = document.getElementById("btn-fichar");
    const estadoTxt = document.getElementById("estado-servicio");
    const selectEmpleado = document.getElementById("empleado-select");
    const inputCapital = document.getElementById("capital-input");
    
    const empleado = selectEmpleado.value;
    const capitalActual = parseInt(inputCapital.value) || 0;

    if (!empleado) { alert("Selecciona un mecánico."); return; }

    if (!enServicio) {
        enServicio = true;
        capitalInicial = capitalActual;
        localStorage.setItem("benny_sesion_activa", JSON.stringify({ empleado, capitalInicial }));
        registrarEnSheets(empleado, capitalInicial, 0, 0, "entrar");
        btn.innerText = "Finalizar Servicio";
        btn.classList.replace("btn-reiniciar", "btn-copiar");
        estadoTxt.innerText = `En servicio: ${empleado}`;
        estadoTxt.className = "estado-on";
        selectEmpleado.disabled = true;
        inputCapital.value = 0; 
    } else {
        const generado = capitalActual - capitalInicial;
        registrarEnSheets(empleado, capitalInicial, capitalActual, generado, "salir");
        localStorage.removeItem("benny_sesion_activa");
        enServicio = false;
        capitalInicial = 0;
        btn.innerText = "Entrar de Servicio";
        btn.classList.replace("btn-copiar", "btn-reiniciar");
        estadoTxt.innerText = "Fuera de Servicio";
        estadoTxt.className = "estado-off";
        selectEmpleado.disabled = false;
        inputCapital.value = 0;
        alert(`Servicio finalizado.\nGenerado en este turno: $${generado.toLocaleString()}`);
    }
}


function registrarEnSheets(nombre, inicial, final, total, accion) {
    const datos = { nombre, inicial, final, total, accion };
    fetch(URL_SCRIPT, {
        method: "POST",
        mode: "no-cors", 
        cache: "no-cache",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos)
    })
    .then(() => actualizarTablaProductividad())
    .catch(err => console.error("Error al enviar:", err));
}

/*Sincronizar tabla de productividad*/
function actualizarTablaProductividad() {
    fetch(URL_SCRIPT)
        .then(res => res.json())
        .then(data => {
            const select = document.getElementById("empleado-select");
            const tabla = document.getElementById("tabla-productividad");
            const sesionLocal = JSON.parse(localStorage.getItem("benny_sesion_activa"));

            if (select) {
                [...select.options].forEach(opt => {
                    if (opt.value === "") return;
                    const mActivo = data.find(m => m.nombre === opt.value && (m.estado === "FICHANDO" || m.estado === "TRABAJANDO"));
                    if (mActivo && (!sesionLocal || sesionLocal.empleado !== opt.value)) {
                        opt.disabled = true;
                        opt.text = opt.value + " (TRABAJANDO)";
                    } else {
                        opt.disabled = false;
                        opt.text = opt.value;
                    }
                });
            }

            if (tabla) {
                const tbody = tabla.querySelector("tbody");
                const filas = tbody.querySelectorAll("tr");

                data.forEach(m => {
                    filas.forEach(f => {
                        let nombreFila = f.cells[0].innerText.split(" ●")[0].trim();
                        if (nombreFila === m.nombre) {
                            
                 
                            let totalLimpio = Number(m.total);
                            if (isNaN(totalLimpio)) totalLimpio = 0;
                            f.cells[1].innerText = "$" + Math.round(totalLimpio).toLocaleString();
                            
                    
                            if (f.cells.length < 3) {
                                f.insertCell(2);
                            }
                            f.cells[2].innerText = m.tiempo || "0h 0m";
                            f.cells[2].style.color = "#3498db"; 

                        
                            if (m.estado === "FICHANDO" || m.estado === "TRABAJANDO") {
                                f.cells[0].innerHTML = `${m.nombre} <span style="color: #2ecc71; font-weight: bold; font-size: 10px; margin-left: 5px;"> ● VIVO</span>`;
                                f.style.backgroundColor = "rgba(46, 204, 113, 0.15)";
                            } else {
                                f.cells[0].innerHTML = m.nombre;
                                f.style.backgroundColor = "transparent";
                            }
                        }
                    });
                });
            }
        })
        .catch(() => console.log("Sincronizando con Sheets..."));
}


window.onload = function() {
    const sesionGuardada = localStorage.getItem("benny_sesion_activa");
    
    if (sesionGuardada) {
        const datos = JSON.parse(sesionGuardada);
        enServicio = true;
        capitalInicial = datos.capitalInicial;
        mostrarFichaje();
        
        const select = document.getElementById("empleado-select");
        if (select) {
            select.value = datos.empleado;
            select.disabled = true;
        }
        
        const btn = document.getElementById("btn-fichar");
        if (btn) {
            btn.innerText = "Finalizar Servicio";
            btn.classList.replace("btn-reiniciar", "btn-copiar");
        }
        
        const estadoTxt = document.getElementById("estado-servicio");
        if (estadoTxt) {
            estadoTxt.innerText = `En servicio: ${datos.empleado}`;
            estadoTxt.className = "estado-on";
        }
    } else {
        
        mostrarInicio();
    }

    actualizarTablaProductividad();
    setInterval(actualizarTablaProductividad, 30000); 
};