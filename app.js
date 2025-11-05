// ========================================
// CONFIGURACIÓN DE GOOGLE SHEETS
// ========================================
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwK9OHOUg7XXsrSYT5-WRZQQCTIJcAAp0qdF_8flZy9gLrBXnUKSQVf7Gtej9wciQeX1w/exec';

// ========================================
// NAVEGACIÓN ENTRE PÁGINAS
// ========================================
function showPage(pageName) {
  // Ocultar todas las páginas
  const pages = document.querySelectorAll('.page');
  pages.forEach(page => page.classList.remove('active'));
  
  // Mostrar la página seleccionada
  const targetPage = document.getElementById(`page-${pageName}`);
  if (targetPage) {
    targetPage.classList.add('active');
    
    // Cargar datos según la página
    switch(pageName) {
      case 'ventas':
        cargarVentas();
        break;
      case 'inventario':
        cargarInventario();
        break;
      case 'clientes':
        cargarClientes();
        break;
      case 'finanzas':
        cargarGastos();
        break;
    }
  }
}

// ========================================
// FUNCIONES DE GOOGLE SHEETS
// ========================================
async function leerHoja(nombreHoja) {
  const url = `${SCRIPT_URL}?sheet=${nombreHoja}`;
  console.log('Leyendo hoja:', nombreHoja, 'URL:', url);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow'
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      console.error('Error en respuesta:', response.status);
      return [];
    }
    
    const data = await response.json();
    console.log('Datos recibidos:', data);
    
    if (data.error) {
      console.error('Error al leer:', data.error);
      return [];
    }
    return data.values || [];
  } catch (error) {
    console.error('Error al leer la hoja:', error);
    return [];
  }
}

async function escribirHoja(nombreHoja, valores) {
  console.log('=== ESCRIBIR HOJA ===');
  console.log('URL:', SCRIPT_URL);
  console.log('Hoja:', nombreHoja);
  console.log('Valores:', valores);
  
  try {
    const payload = { 
      sheet: nombreHoja, 
      values: valores 
    };
    console.log('Payload:', JSON.stringify(payload));
    
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    console.log('Response enviado');
    
    alert('✅ Datos enviados. Recarga en 2 segundos para ver los cambios.');
    
    return { success: true };
    
  } catch (error) {
    console.error('ERROR al escribir:', error);
    alert('Error al guardar los datos: ' + error.message);
    return null;
  }
}

// ========================================
// MÓDULO DE VENTAS
// ========================================
async function guardarVenta() {
  const producto = document.getElementById('producto').value;
  const cantidad = document.getElementById('cantidad').value;
  const precio = document.getElementById('precio').value;
  const metodo = document.getElementById('metodo').value;
  const cliente = document.getElementById('cliente').value;
  
  if (!producto || !cantidad || !precio) {
    alert('Por favor completa todos los campos obligatorios');
    return;
  }
  
  const fecha = new Date().toLocaleDateString();
  const total = (cantidad * precio).toFixed(2);
  
  const valores = [fecha, producto, cantidad, precio, total, metodo, cliente];
  
  const resultado = await escribirHoja('Ventas', valores);
  
  if (resultado) {
    limpiarFormularioVentas();
    setTimeout(() => cargarVentas(), 2000);
  }
}

function limpiarFormularioVentas() {
  document.getElementById('producto').value = '';
  document.getElementById('cantidad').value = '';
  document.getElementById('precio').value = '';
  document.getElementById('cliente').value = '';
}

async function cargarVentas() {
  const datos = await leerHoja('Ventas');
  const tbody = document.querySelector('#tablaVentas tbody');
  tbody.innerHTML = '';
  
  datos.slice(-10).reverse().forEach(fila => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${fila[0]}</td>
      <td>${fila[1]}</td>
      <td>${fila[2]}</td>
      <td>L ${fila[4]}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ========================================
// MÓDULO DE INVENTARIO
// ========================================
async function guardarProducto() {
  const nombre = document.getElementById('nombre').value;
  const marca = document.getElementById('marca').value;
  const modelo = document.getElementById('modelo').value;
  const precioCompra = document.getElementById('precioCompra').value;
  const precioVenta = document.getElementById('precioVenta').value;
  const stock = document.getElementById('stock').value;
  const proveedor = document.getElementById('proveedor').value;
  
  if (!nombre || !precioVenta || !stock) {
    alert('Por favor completa los campos obligatorios (Nombre, Precio Venta, Stock)');
    return;
  }
  
  const valores = [nombre, marca, modelo, precioCompra, precioVenta, stock, proveedor];
  
  const resultado = await escribirHoja('Inventario', valores);
  
  if (resultado) {
    limpiarFormularioInventario();
    setTimeout(() => cargarInventario(), 2000);
  }
}

function limpiarFormularioInventario() {
  document.getElementById('nombre').value = '';
  document.getElementById('marca').value = '';
  document.getElementById('modelo').value = '';
  document.getElementById('precioCompra').value = '';
  document.getElementById('precioVenta').value = '';
  document.getElementById('stock').value = '';
  document.getElementById('proveedor').value = '';
}

async function cargarInventario() {
  const datos = await leerHoja('Inventario');
  const tbody = document.querySelector('#tablaInventario tbody');
  tbody.innerHTML = '';
  
  datos.forEach(fila => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${fila[0]}</td>
      <td>${fila[1] || '-'}</td>
      <td>${fila[2] || '-'}</td>
      <td>${fila[5]}</td>
      <td>L ${fila[4]}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ========================================
// MÓDULO DE CLIENTES
// ========================================
async function guardarCliente() {
  console.log('=== INICIANDO GUARDADO DE CLIENTE ===');
  
  const nombre = document.getElementById('nombreCliente').value;
  const telefono = document.getElementById('telefonoCliente').value;
  const correo = document.getElementById('correoCliente').value;
  
  console.log('Datos capturados:', { nombre, telefono, correo });
  
  if (!nombre) {
    alert('Por favor ingresa el nombre del cliente');
    return;
  }
  
  const valores = [nombre, telefono, correo];
  console.log('Valores a enviar:', valores);
  
  const resultado = await escribirHoja('Clientes', valores);
  console.log('Resultado:', resultado);
  
  if (resultado) {
    limpiarFormularioClientes();
    setTimeout(() => cargarClientes(), 2000);
  }
}

function limpiarFormularioClientes() {
  document.getElementById('nombreCliente').value = '';
  document.getElementById('telefonoCliente').value = '';
  document.getElementById('correoCliente').value = '';
}

async function cargarClientes() {
  const datos = await leerHoja('Clientes');
  const tbody = document.querySelector('#tablaClientes tbody');
  tbody.innerHTML = '';
  
  datos.forEach(fila => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${fila[0]}</td>
      <td>${fila[1] || '-'}</td>
      <td>${fila[2] || '-'}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ========================================
// MÓDULO DE FINANZAS
// ========================================
async function guardarGasto() {
  const descripcion = document.getElementById('descripcion').value;
  const monto = document.getElementById('monto').value;
  const tipo = document.getElementById('tipo').value;
  
  if (!descripcion || !monto) {
    alert('Por favor completa todos los campos');
    return;
  }
  
  const fecha = new Date().toLocaleDateString();
  const valores = [fecha, descripcion, tipo, monto];
  
  const resultado = await escribirHoja('Gastos', valores);
  
  if (resultado) {
    limpiarFormularioGastos();
    setTimeout(() => cargarGastos(), 2000);
  }
}

function limpiarFormularioGastos() {
  document.getElementById('descripcion').value = '';
  document.getElementById('monto').value = '';
}

async function cargarGastos() {
  const datos = await leerHoja('Gastos');
  const tbody = document.querySelector('#tablaGastos tbody');
  tbody.innerHTML = '';
  
  datos.slice(-10).reverse().forEach(fila => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${fila[0]}</td>
      <td>${fila[1]}</td>
      <td>${fila[2]}</td>
      <td>L ${fila[3]}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ========================================
// INICIALIZACIÓN
// ========================================
document.addEventListener('DOMContentLoaded', () => {
  console.log('Sistema POS cargado correctamente');
});
