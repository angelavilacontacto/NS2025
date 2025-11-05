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
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });
    
    console.log('Response status:', response.status);
    const result = await response.text();
    const data = JSON.parse(result);
    console.log('Resultado:', data);
    
    if (data.error) {
      alert('Error del servidor: ' + data.error);
      return null;
    }
    
    alert('✅ Datos guardados correctamente');
    return data;
    
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
    setTimeout(() => cargarVentas(), 1000);
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
    setTimeout(() => cargarInventario(), 1000);
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

// Función para capitalizar nombre (primera letra mayúscula de cada palabra)
function capitalizarNombre(nombre) {
  return nombre
    .toLowerCase()
    .split(' ')
    .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(' ');
}

// Función para formatear teléfono +504 3369-2861
function formatearTelefono(valor) {
  // Extraer solo los números
  let numeros = valor.replace(/\D/g, '');
  
  // Si empieza con 504, quitarlo (es el prefijo que ya tenemos)
  if (numeros.startsWith('504')) {
    numeros = numeros.slice(3);
  }
  
  // Limitar a 8 dígitos
  if (numeros.length > 8) {
    numeros = numeros.slice(0, 8);
  }
  
  // Formatear: +504 XXXX-XXXX
  if (numeros.length === 0) {
    return '+504 ';
  } else if (numeros.length <= 4) {
    return '+504 ' + numeros;
  } else {
    return '+504 ' + numeros.slice(0, 4) + '-' + numeros.slice(4);
  }
}

async function guardarCliente() {
  console.log('=== INICIANDO GUARDADO DE CLIENTE ===');
  
  const nombreInput = document.getElementById('nombreCliente');
  const telefonoInput = document.getElementById('telefonoCliente');
  const correoInput = document.getElementById('correoCliente');
  
  const nombre = nombreInput.value.trim();
  let telefono = telefonoInput.value.trim();
  const correo = correoInput.value.trim();
  
  console.log('Datos capturados:', { nombre, telefono, correo });
  
  if (!nombre) {
    alert('Por favor ingresa el nombre del cliente');
    return;
  }
  
  // Validar que el correo tenga @
  if (correo && !correo.includes('@')) {
    alert('El correo debe contener @ para ser válido');
    return;
  }
  
  // Limpiar teléfono para Excel (quitar +504 y dejar solo números con guión)
  let telefonoLimpio = '';
  if (telefono && telefono !== '+504 ' && telefono !== '+504') {
    // Extraer solo los números
    let numeros = telefono.replace(/\D/g, '');
    
    // Si empieza con 504, quitarlo
    if (numeros.startsWith('504') && numeros.length > 3) {
      numeros = numeros.slice(3);
    }
    
    if (numeros.length > 0) {
      // Formato sin +504: 3369-2861
      if (numeros.length <= 4) {
        telefonoLimpio = numeros;
      } else {
        telefonoLimpio = numeros.slice(0, 4) + '-' + numeros.slice(4);
      }
    }
  }
  
  const valores = [nombre, telefonoLimpio, correo];
  console.log('Valores a enviar:', valores);
  
  const resultado = await escribirHoja('Clientes', valores);
  console.log('Resultado escribir:', resultado);
  
  if (resultado) {
    // Limpiar campos directamente
    nombreInput.value = '';
    telefonoInput.value = '';
    correoInput.value = '';
    
    console.log('Campos limpiados');
    
    // Recargar lista después de un breve delay
    setTimeout(() => {
      console.log('Recargando clientes...');
      cargarClientes();
    }, 1000);
  }
}

async function cargarClientes() {
  console.log('=== CARGANDO CLIENTES ===');
  const datos = await leerHoja('Clientes');
  console.log('Datos clientes recibidos:', datos);
  
  const tbody = document.querySelector('#tablaClientes tbody');
  if (!tbody) {
    console.error('No se encontró la tabla de clientes');
    return;
  }
  
  tbody.innerHTML = '';
  
  if (!datos || datos.length === 0) {
    console.log('No hay clientes para mostrar');
    return;
  }
  
  datos.forEach((fila, index) => {
    console.log(`Cliente ${index}:`, fila);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${fila[0] || '-'}</td>
      <td>${fila[1] || '-'}</td>
      <td>${fila[2] || '-'}</td>
    `;
    tbody.appendChild(tr);
  });
  
  console.log('Total clientes cargados:', datos.length);
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
    setTimeout(() => cargarGastos(), 1000);
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
  
  // Configurar formateo de nombre
  const nombreInput = document.getElementById('nombreCliente');
  if (nombreInput) {
    nombreInput.addEventListener('input', function(e) {
      const cursorPos = this.selectionStart;
      const valorAnterior = this.value;
      this.value = capitalizarNombre(this.value);
      
      if (valorAnterior.length === this.value.length) {
        this.setSelectionRange(cursorPos, cursorPos);
      }
    });
  }
  
  // Configurar formateo de teléfono
  const telefonoInput = document.getElementById('telefonoCliente');
  if (telefonoInput) {
    // Al hacer focus, agregar +504
    telefonoInput.addEventListener('focus', function(e) {
      if (this.value === '') {
        this.value = '+504 ';
      }
    });
    
    // Al escribir, formatear
    telefonoInput.addEventListener('input', function(e) {
      const cursorPos = this.selectionStart;
      const longitudAntes = this.value.length;
      
      this.value = formatearTelefono(this.value);
      
      const longitudDespues = this.value.length;
      
      // Ajustar cursor si se agregó el guión automáticamente
      if (longitudDespues > longitudAntes) {
        this.setSelectionRange(cursorPos + 1, cursorPos + 1);
      } else {
        this.setSelectionRange(cursorPos, cursorPos);
      }
    });
    
    // Prevenir borrar +504
    telefonoInput.addEventListener('keydown', function(e) {
      if ((e.key === 'Backspace' || e.key === 'Delete') && this.value.length <= 5) {
        e.preventDefault();
        this.value = '+504 ';
      }
    });
  }
});
