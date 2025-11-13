// ========================================
// CONFIGURACIÓN DE GOOGLE SHEETS Y DRIVE
// ========================================
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwjF4FFkDFQ9iInlIR_oVagWWqWKUWHsT61SVQFb2o1qEjjZM-NgmdFHv6BlmbN76Jilg/exec';

let imagenSeleccionada = null;

// ========================================
// UTILIDADES COMUNES (REDUCIR REPETICIÓN)
// ========================================

// Función genérica para limpiar cualquier formulario
function limpiarFormulario(camposIds) {
  camposIds.forEach(id => {
    const campo = document.getElementById(id);
    if (campo) {
      campo.value = '';
      // Ocultar preview de imagen si existe
      if (id === 'imagenUrl') {
        document.getElementById('previewContainer').style.display = 'none';
      }
    }
  });
}

// Función genérica para cerrar cualquier modal
function cerrarModalGenerico(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
  }
  if (modalId === 'modalImagenes') {
    imagenSeleccionada = null;
  }
}

// Función genérica para cargar datos en tabla
async function cargarTablaGenerica(nombreHoja, tbodySelector, procesarFila, opciones = {}) {
  const datos = await leerHoja(nombreHoja);
  const tbody = document.querySelector(tbodySelector);
  
  if (!tbody) {
    console.error(`No se encontró la tabla: ${tbodySelector}`);
    return;
  }
  
  tbody.innerHTML = '';
  
  if (!datos || datos.length === 0) {
    if (opciones.mensajeVacio) {
      tbody.innerHTML = `<tr><td colspan="${opciones.columnas || 6}" style="text-align: center; padding: 20px;">${opciones.mensajeVacio}</td></tr>`;
    }
    return datos;
  }
  
  // Aplicar slice y reverse si se especifica
  let datosAProcesar = datos;
  if (opciones.ultimos) {
    datosAProcesar = datos.slice(-opciones.ultimos).reverse();
  }
  
  datosAProcesar.forEach((fila, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = procesarFila(fila, index);
    tbody.appendChild(tr);
  });
  
  return datos;
}

// Función genérica para guardar datos
async function guardarDatosGenericos(nombreHoja, valores, camposLimpiar, funcionRecargar) {
  const resultado = await escribirHoja(nombreHoja, valores);
  
  if (resultado) {
    limpiarFormulario(camposLimpiar);
    setTimeout(() => funcionRecargar(), 1000);
  }
  
  return resultado;
}

// Utilidad para formatear teléfono (centralizada)
function formatearTelefonoHonduras(valor) {
  let numeros = valor.replace(/\D/g, '');
  
  // Remover prefijo 504 si existe
  if (numeros.startsWith('504')) {
    numeros = numeros.slice(3);
  }
  
  // Limitar a 8 dígitos
  if (numeros.length > 8) {
    numeros = numeros.slice(0, 8);
  }
  
  // Formatear
  if (numeros.length === 0) {
    return '+504 ';
  } else if (numeros.length <= 4) {
    return '+504 ' + numeros;
  } else {
    return '+504 ' + numeros.slice(0, 4) + '-' + numeros.slice(4);
  }
}

// Utilidad para limpiar teléfono antes de guardar
function limpiarTelefonoParaGuardar(telefono) {
  if (!telefono || telefono === '+504 ' || telefono === '+504') {
    return '';
  }
  
  let numeros = telefono.replace(/\D/g, '');
  if (numeros.startsWith('504') && numeros.length > 3) {
    numeros = numeros.slice(3);
  }
  
  if (numeros.length === 0) return '';
  
  return numeros.length <= 4 
    ? numeros 
    : numeros.slice(0, 4) + '-' + numeros.slice(4);
}

// Función para formatear moneda (formato completo)
function formatearMoneda(valor) {
  return parseFloat(valor).toLocaleString('es-HN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// ========================================
// NUEVA FUNCIÓN: FORMATEAR MONEDA COMPACTA
// ========================================
function formatearMonedaCompacta(valor) {
  const num = parseFloat(valor);
  
  // Si es NaN o 0
  if (isNaN(num) || num === 0) {
    return 'L 0.00';
  }
  
  // Menos de 1 millón - formato normal con separador de miles
  if (num < 1000000) {
    return 'L ' + formatearMoneda(valor);
  }
  
  // Menos de 10 millones - mostrar con 2 decimales
  if (num < 10000000) {
    return 'L ' + (num / 1000000).toFixed(2) + 'M';
  }
  
  // Menos de 100 millones - mostrar con 1 decimal
  if (num < 100000000) {
    return 'L ' + (num / 1000000).toFixed(1) + 'M';
  }
  
  // Menos de 1 billón - mostrar millones sin decimales
  if (num < 1000000000) {
    return 'L ' + Math.round(num / 1000000) + 'M';
  }
  
  // Más de 1 billón - mostrar con B
  if (num < 10000000000) {
    return 'L ' + (num / 1000000000).toFixed(2) + 'B';
  }
  
  return 'L ' + (num / 1000000000).toFixed(1) + 'B';
}

// ========================================
// NAVEGACIÓN ENTRE PÁGINAS
// ========================================
function showPage(pageName) {
  const pages = document.querySelectorAll('.page');
  pages.forEach(page => page.classList.remove('active'));
  
  const targetPage = document.getElementById(`page-${pageName}`);
  if (targetPage) {
    targetPage.classList.add('active');
    
    // Mapeo de páginas a funciones de carga
    const cargadores = {
      'ventas': cargarVentas,
      'inventario': () => {
        // Al entrar a inventario, mostrar el menú principal
        volverMenuInventario();
      },
      'clientes': cargarClientes,
      'finanzas': cargarGastos
    };
    
    if (cargadores[pageName]) {
      cargadores[pageName]();
    }
  }
}

// ========================================
// NAVEGACIÓN DEL MÓDULO DE INVENTARIO
// ========================================
function ocultarTodasSeccionesInventario() {
  document.querySelectorAll('.inventario-seccion').forEach(seccion => {
    seccion.style.display = 'none';
  });
  document.querySelector('.inventario-menu').style.display = 'grid';
}

function volverMenuInventario() {
  ocultarTodasSeccionesInventario();
}

function mostrarInventarioCompleto() {
  document.querySelector('.inventario-menu').style.display = 'none';
  document.querySelectorAll('.inventario-seccion').forEach(s => s.style.display = 'none');
  document.getElementById('seccion-inventario-completo').style.display = 'block';
  cargarInventarioCompleto();
}

function mostrarAgregarProducto() {
  document.querySelector('.inventario-menu').style.display = 'none';
  document.querySelectorAll('.inventario-seccion').forEach(s => s.style.display = 'none');
  document.getElementById('seccion-agregar-producto').style.display = 'block';
}

function mostrarReportes() {
  document.querySelector('.inventario-menu').style.display = 'none';
  document.querySelectorAll('.inventario-seccion').forEach(s => s.style.display = 'none');
  document.getElementById('seccion-reportes').style.display = 'block';
  cargarReportes();
}

// ========================================
// SELECTOR DE IMÁGENES DE GOOGLE DRIVE
// ========================================
async function abrirSelectorImagenes() {
  const modal = document.getElementById('modalImagenes');
  const container = document.getElementById('imagenesContainer');
  
  modal.classList.add('active');
  container.innerHTML = '<div class="loading">Cargando imágenes de Google Drive...</div>';
  
  try {
    const response = await fetch(`${SCRIPT_URL}?action=listImages`, {
      method: 'GET',
      redirect: 'follow'
    });
    
    if (!response.ok) {
      throw new Error('Error al conectar con Google Drive');
    }
    
    const data = await response.json();
    
    if (data.error) {
      container.innerHTML = `<p style="color: red; text-align: center;">Error: ${data.error}</p>`;
      return;
    }
    
    if (!data.images || data.images.length === 0) {
      container.innerHTML = '<p style="text-align: center; padding: 40px;">No hay imágenes en la carpeta de Google Drive.<br><br>Sube algunas imágenes a la carpeta "Inventario_Fotos" en tu Google Drive.</p>';
      return;
    }
    
    const inventario = await leerHoja('Inventario');
    const imagenesEnUso = inventario
      .filter(fila => fila[7])
      .map(fila => fila[7]);
    
    mostrarImagenes(data.images, imagenesEnUso);
    
  } catch (error) {
    console.error('Error al cargar imágenes:', error);
    container.innerHTML = `<p style="color: red; text-align: center; padding: 40px;">Error al cargar las imágenes: ${error.message}<br><br>Verifica que el Google Apps Script esté configurado correctamente.</p>`;
  }
}

function mostrarImagenes(images, imagenesEnUso = []) {
  const container = document.getElementById('imagenesContainer');
  const grid = document.createElement('div');
  grid.className = 'images-grid';
  
  images.forEach(img => {
    const card = document.createElement('div');
    const estaEnUso = imagenesEnUso.includes(img.url);
    
    card.className = 'image-card';
    if (estaEnUso) card.classList.add('image-used');
    card.onclick = () => seleccionarImagen(img, card);
    
    const badgeHtml = estaEnUso ? '<span class="badge-used">✓ En uso</span>' : '';
    
    card.innerHTML = `
      ${badgeHtml}
      <img src="${img.thumbnail}" alt="${img.name}" onerror="this.src='${img.url}'">
      <p>${img.name}</p>
    `;
    
    grid.appendChild(card);
  });
  
  container.innerHTML = '';
  container.appendChild(grid);
}

function seleccionarImagen(img, card) {
  document.querySelectorAll('.image-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');
  imagenSeleccionada = img;
}

function confirmarSeleccion() {
  if (!imagenSeleccionada) {
    alert('Por favor selecciona una imagen');
    return;
  }
  
  document.getElementById('imagenUrl').value = imagenSeleccionada.url;
  document.getElementById('imagenPreview').src = imagenSeleccionada.url;
  document.getElementById('previewContainer').style.display = 'block';
  
  cerrarModal();
}

function cerrarModal() {
  cerrarModalGenerico('modalImagenes');
}

// ========================================
// FUNCIONES DE GOOGLE SHEETS
// ========================================
async function leerHoja(nombreHoja) {
  const url = `${SCRIPT_URL}?sheet=${nombreHoja}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow'
    });
    
    if (!response.ok) {
      console.error('Error en respuesta:', response.status);
      return [];
    }
    
    const data = await response.json();
    
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
  try {
    const payload = { 
      sheet: nombreHoja, 
      values: valores 
    };
    
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });
    
    const result = await response.text();
    const data = JSON.parse(result);
    
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
  
  await guardarDatosGenericos(
    'Ventas', 
    valores, 
    ['producto', 'cantidad', 'precio', 'cliente'],
    cargarVentas
  );
}

async function cargarVentas() {
  await cargarTablaGenerica(
    'Ventas',
    '#tablaVentas tbody',
    (fila) => `
      <td>${fila[0]}</td>
      <td>${fila[1]}</td>
      <td>${fila[2]}</td>
      <td>L ${formatearMoneda(fila[4])}</td>
    `,
    { ultimos: 10 }
  );
}

// ========================================
// FORMATEO DE PRECIOS EN TIEMPO REAL
// ========================================

// Función para formatear precio mientras se escribe
function formatearPrecioInput(valor) {
  // Remover todo excepto números y punto
  let limpio = valor.replace(/[^\d.]/g, '');
  
  // Permitir solo un punto decimal
  const partes = limpio.split('.');
  if (partes.length > 2) {
    limpio = partes[0] + '.' + partes.slice(1).join('');
  }
  
  // Limitar a 2 decimales
  if (partes.length === 2 && partes[1].length > 2) {
    limpio = partes[0] + '.' + partes[1].slice(0, 2);
  }
  
  // Si está vacío, retornar vacío
  if (limpio === '' || limpio === '.') {
    return '';
  }
  
  // Separar parte entera y decimal
  const [entero, decimal] = limpio.split('.');
  
  // Formatear parte entera con comas
  const enteroFormateado = parseInt(entero || '0').toLocaleString('es-HN');
  
  // Si hay punto decimal, agregarlo
  if (limpio.includes('.')) {
    return 'L ' + enteroFormateado + '.' + (decimal || '');
  }
  
  return 'L ' + enteroFormateado;
}

// Función para obtener valor numérico desde input formateado
function obtenerValorNumerico(valorFormateado) {
  if (!valorFormateado) return '';
  
  // Remover "L " y comas
  const limpio = valorFormateado.replace(/L\s?/g, '').replace(/,/g, '');
  
  // Si termina en punto, agregar 00
  if (limpio.endsWith('.')) {
    return limpio + '00';
  }
  
  // Si tiene un decimal, agregar un 0
  const partes = limpio.split('.');
  if (partes.length === 2 && partes[1].length === 1) {
    return limpio + '0';
  }
  
  // Si no tiene decimales, agregar .00
  if (!limpio.includes('.') && limpio !== '') {
    return limpio + '.00';
  }
  
  return limpio;
}

// Configurar inputs de precios
function configurarInputsPrecios() {
  const precioCompraInput = document.getElementById('precioCompra');
  const precioVentaInput = document.getElementById('precioVenta');
  
  // Configurar Precio de Compra
  if (precioCompraInput) {
    // Al hacer focus, si está vacío mostrar L 0
    precioCompraInput.addEventListener('focus', function() {
      if (this.value === '' || this.value === 'L 0') {
        this.value = 'L ';
      }
    });
    
    // Al escribir, formatear
    precioCompraInput.addEventListener('input', function(e) {
      const cursorPos = this.selectionStart;
      const valorAnterior = this.value;
      const longitudAnterior = valorAnterior.length;
      
      // Guardar el valor sin formato para procesarlo
      const valorSinFormato = this.value.replace(/L\s?/g, '').replace(/,/g, '');
      this.value = formatearPrecioInput(valorSinFormato);
      
      // Ajustar cursor
      const longitudNueva = this.value.length;
      const diferencia = longitudNueva - longitudAnterior;
      
      if (diferencia > 0) {
        this.setSelectionRange(cursorPos + diferencia, cursorPos + diferencia);
      } else {
        this.setSelectionRange(cursorPos, cursorPos);
      }
    });
    
    // Al perder el focus, asegurar formato completo
    precioCompraInput.addEventListener('blur', function() {
      if (this.value === 'L ' || this.value === '') {
        this.value = '';
        return;
      }
      
      const valorNumerico = obtenerValorNumerico(this.value);
      if (valorNumerico && valorNumerico !== '0.00') {
        this.value = 'L ' + parseFloat(valorNumerico).toLocaleString('es-HN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
      }
    });
    
    // Prevenir borrar "L "
    precioCompraInput.addEventListener('keydown', function(e) {
      if ((e.key === 'Backspace' || e.key === 'Delete') && 
          (this.value === 'L ' || this.value === 'L')) {
        e.preventDefault();
      }
    });
  }
  
  // Configurar Precio de Venta (misma lógica)
  if (precioVentaInput) {
    precioVentaInput.addEventListener('focus', function() {
      if (this.value === '' || this.value === 'L 0') {
        this.value = 'L ';
      }
    });
    
    precioVentaInput.addEventListener('input', function(e) {
      const cursorPos = this.selectionStart;
      const valorAnterior = this.value;
      const longitudAnterior = valorAnterior.length;
      
      const valorSinFormato = this.value.replace(/L\s?/g, '').replace(/,/g, '');
      this.value = formatearPrecioInput(valorSinFormato);
      
      const longitudNueva = this.value.length;
      const diferencia = longitudNueva - longitudAnterior;
      
      if (diferencia > 0) {
        this.setSelectionRange(cursorPos + diferencia, cursorPos + diferencia);
      } else {
        this.setSelectionRange(cursorPos, cursorPos);
      }
    });
    
    precioVentaInput.addEventListener('blur', function() {
      if (this.value === 'L ' || this.value === '') {
        this.value = '';
        return;
      }
      
      const valorNumerico = obtenerValorNumerico(this.value);
      if (valorNumerico && valorNumerico !== '0.00') {
        this.value = 'L ' + parseFloat(valorNumerico).toLocaleString('es-HN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
      }
    });
    
    precioVentaInput.addEventListener('keydown', function(e) {
      if ((e.key === 'Backspace' || e.key === 'Delete') && 
          (this.value === 'L ' || this.value === 'L')) {
        e.preventDefault();
      }
    });
  }
}

// ========================================
// MÓDULO DE INVENTARIO
// ========================================
async function guardarProducto() {
  const nombre = document.getElementById('nombre').value;
  const marca = document.getElementById('marca').value;
  const modelo = document.getElementById('modelo').value;
  const precioCompraInput = document.getElementById('precioCompra').value;
  const precioVentaInput = document.getElementById('precioVenta').value;
  const stock = document.getElementById('stock').value;
  const proveedor = document.getElementById('proveedor').value;
  const imagenUrl = document.getElementById('imagenUrl').value;
  
  if (!nombre || !precioVentaInput || !stock) {
    alert('Por favor completa los campos obligatorios: Nombre, Precio Venta y Stock');
    return;
  }
  
  // Limpiar precios para guardar
  const precioCompra = obtenerValorNumerico(precioCompraInput) || '0.00';
  const precioVenta = obtenerValorNumerico(precioVentaInput);
  
  if (!precioVenta || precioVenta === '0.00') {
    alert('El precio de venta debe ser mayor a 0');
    return;
  }
  
  const valores = [nombre, marca, modelo, precioCompra, precioVenta, stock, proveedor, imagenUrl];
  
  const resultado = await guardarDatosGenericos(
    'Inventario',
    valores,
    ['nombre', 'marca', 'modelo', 'precioCompra', 'precioVenta', 'stock', 'proveedor', 'imagenUrl'],
    () => {} // No recargamos aquí
  );
  
  if (resultado) {
    // Volver al menú después de guardar
    volverMenuInventario();
  }
}

async function cargarInventarioCompleto() {
  await cargarTablaGenerica(
    'Inventario',
    '#tablaInventarioCompleto tbody',
    (fila) => {
      const imagen = fila[7] 
        ? `<img src="${fila[7]}" style="width: 60px; height: 60px; object-fit: cover;" onclick="abrirLightbox('${fila[7]}')" onerror="this.style.display='none'; this.parentElement.innerHTML='<span style=color:#999>Sin foto</span>'">` 
        : '<span style="color: #999;">Sin foto</span>';
      
      const stockNum = parseInt(fila[5]);
      let badgeStock = '';
      if (stockNum < 5) {
        badgeStock = '<span class="badge badge-danger">⚠️ Bajo</span>';
      } else if (stockNum > 20) {
        badgeStock = '<span class="badge badge-success">✅ Alto</span>';
      } else {
        badgeStock = '<span class="badge badge-warning">📦 Normal</span>';
      }
      
      return `
        <td>${imagen}</td>
        <td>${fila[0]}</td>
        <td>${fila[1] || '-'}</td>
        <td>${fila[2] || '-'}</td>
        <td>${fila[5]} ${badgeStock}</td>
        <td>L ${formatearMoneda(fila[4])}</td>
        <td>
          <button class="btn-action btn-edit" onclick="editarProducto(${JSON.stringify(fila).replace(/"/g, '&quot;')})">✏️</button>
          <button class="btn-action btn-delete" onclick="eliminarProducto('${fila[0]}')">🗑️</button>
        </td>
      `;
    },
    { 
      mensajeVacio: 'No hay productos registrados',
      columnas: 7
    }
  );
}

// Función para buscar en el inventario
function buscarEnInventario() {
  const buscador = document.getElementById('buscadorInventario');
  const filtro = buscador.value.toLowerCase();
  const tabla = document.getElementById('tablaInventarioCompleto');
  const filas = tabla.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
  
  for (let i = 0; i < filas.length; i++) {
    const fila = filas[i];
    const textoFila = fila.textContent || fila.innerText;
    
    if (textoFila.toLowerCase().indexOf(filtro) > -1) {
      fila.style.display = '';
    } else {
      fila.style.display = 'none';
    }
  }
}

// Función para editar producto (placeholder por ahora)
function editarProducto(fila) {
  alert('Función de editar en desarrollo.\n\nProducto: ' + fila[0]);
  // Aquí puedes implementar la lógica de edición
}

// Función para eliminar producto (placeholder por ahora)
function eliminarProducto(nombre) {
  if (confirm('¿Estás seguro de eliminar el producto: ' + nombre + '?')) {
    alert('Función de eliminar en desarrollo.\n\nEsta función requerirá agregar un endpoint de eliminación en Google Apps Script.');
  }
}

// ========================================
// REPORTES - CON NÚMEROS COMPACTOS
// ========================================
async function cargarReportes() {
  const inventario = await leerHoja('Inventario');
  
  if (!inventario || inventario.length === 0) {
    document.getElementById('totalProductos').textContent = '0';
    document.getElementById('valorInventario').textContent = 'L 0.00';
    document.getElementById('stockBajo').textContent = '0';
    document.getElementById('conFotos').textContent = '0';
    
    const tbody = document.querySelector('#tablaStockBajo tbody');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;">No hay productos en el inventario</td></tr>';
    return;
  }
  
  // Calcular estadísticas
  const totalProductos = inventario.length;
  const valorTotal = inventario.reduce((sum, fila) => {
    const precio = parseFloat(fila[4]) || 0;
    const stock = parseInt(fila[5]) || 0;
    return sum + (precio * stock);
  }, 0);
  
  const productosStockBajo = inventario.filter(fila => {
    const stock = parseInt(fila[5]) || 0;
    return stock < 5;
  });
  
  const productosConFoto = inventario.filter(fila => fila[7] && fila[7].trim() !== '').length;
  
  // Mostrar estadísticas con formato COMPACTO
  document.getElementById('totalProductos').textContent = totalProductos.toLocaleString();
  
  // USAR FORMATO COMPACTO PARA NÚMEROS GRANDES
  document.getElementById('valorInventario').textContent = formatearMonedaCompacta(valorTotal);
  
  document.getElementById('stockBajo').textContent = productosStockBajo.length;
  document.getElementById('conFotos').textContent = productosConFoto;
  
  // Tabla de stock bajo
  const tbody = document.querySelector('#tablaStockBajo tbody');
  tbody.innerHTML = '';
  
  if (productosStockBajo.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px; color: green;">✅ Todos los productos tienen stock suficiente</td></tr>';
  } else {
    productosStockBajo.forEach(fila => {
      const stock = parseInt(fila[5]) || 0;
      let estadoBadge = '';
      
      if (stock === 0) {
        estadoBadge = '<span class="badge badge-danger">🚫 Agotado</span>';
      } else if (stock < 3) {
        estadoBadge = '<span class="badge badge-danger">⚠️ Crítico</span>';
      } else {
        estadoBadge = '<span class="badge badge-warning">⚠️ Bajo</span>';
      }
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${fila[0]}</td>
        <td>${fila[1] || '-'}</td>
        <td>${stock}</td>
        <td>${estadoBadge}</td>
      `;
      tbody.appendChild(tr);
    });
  }
}

// ========================================
// LIGHTBOX PARA IMÁGENES
// ========================================
function abrirLightbox(imageUrl) {
  const lightbox = document.getElementById('imageLightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  lightboxImg.src = imageUrl;
  lightbox.classList.add('active');
}

function cerrarLightbox() {
  cerrarModalGenerico('imageLightbox');
}

// ========================================
// MÓDULO DE CLIENTES CON NÚMERO DE IDENTIDAD
// ========================================

// Función para formatear número de identidad hondureño
function formatearIdentidadHonduras(valor) {
  // Remover todo excepto números
  let numeros = valor.replace(/\D/g, '');
  
  // Limitar a 13 dígitos
  if (numeros.length > 13) {
    numeros = numeros.slice(0, 13);
  }
  
  // Formatear: 0000-0000-00000
  if (numeros.length === 0) {
    return '';
  } else if (numeros.length <= 4) {
    return numeros;
  } else if (numeros.length <= 8) {
    return numeros.slice(0, 4) + '-' + numeros.slice(4);
  } else {
    return numeros.slice(0, 4) + '-' + numeros.slice(4, 8) + '-' + numeros.slice(8);
  }
}

// Función para limpiar identidad antes de guardar
function limpiarIdentidadParaGuardar(identidad) {
  if (!identidad || identidad.trim() === '') {
    return '';
  }
  
  let numeros = identidad.replace(/\D/g, '');
  
  if (numeros.length === 0) return '';
  
  // Formatear según longitud
  if (numeros.length <= 4) {
    return numeros;
  } else if (numeros.length <= 8) {
    return numeros.slice(0, 4) + '-' + numeros.slice(4);
  } else {
    return numeros.slice(0, 4) + '-' + numeros.slice(4, 8) + '-' + numeros.slice(8);
  }
}

function capitalizarNombre(nombre) {
  return nombre
    .toLowerCase()
    .split(' ')
    .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(' ');
}

async function guardarCliente() {
  const nombreInput = document.getElementById('nombreCliente');
  const identidadInput = document.getElementById('identidadCliente');
  const telefonoInput = document.getElementById('telefonoCliente');
  const correoInput = document.getElementById('correoCliente');
  
  const nombre = nombreInput.value.trim();
  const identidad = identidadInput.value.trim();
  const telefono = telefonoInput.value.trim();
  const correo = correoInput.value.trim();
  
  if (!nombre) {
    alert('Por favor ingresa el nombre del cliente');
    return;
  }
  
  if (!identidad) {
    alert('Por favor ingresa el número de identidad');
    return;
  }
  
  // Validar que tenga 13 dígitos
  const numerosIdentidad = identidad.replace(/\D/g, '');
  if (numerosIdentidad.length !== 13) {
    alert('El número de identidad debe tener 13 dígitos');
    return;
  }
  
  if (correo && !correo.includes('@')) {
    alert('El correo debe contener @ para ser válido');
    return;
  }
  
  const identidadLimpia = limpiarIdentidadParaGuardar(identidad);
  const telefonoLimpio = limpiarTelefonoParaGuardar(telefono);
  const valores = [nombre, identidadLimpia, telefonoLimpio, correo];
  
  await guardarDatosGenericos(
    'Clientes',
    valores,
    ['nombreCliente', 'identidadCliente', 'telefonoCliente', 'correoCliente'],
    cargarClientes
  );
}

async function cargarClientes() {
  await cargarTablaGenerica(
    'Clientes',
    '#tablaClientes tbody',
    (fila) => {
      let telefonoMostrar = fila[2] || '-';
      if (telefonoMostrar !== '-' && !telefonoMostrar.startsWith('+504')) {
        telefonoMostrar = '+504 ' + telefonoMostrar;
      }
      
      return `
        <td>${fila[0] || '-'}</td>
        <td>${fila[1] || '-'}</td>
        <td>${telefonoMostrar}</td>
        <td>${fila[3] || '-'}</td>
      `;
    }
  );
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
  
  await guardarDatosGenericos(
    'Gastos',
    valores,
    ['descripcion', 'monto'],
    cargarGastos
  );
}

async function cargarGastos() {
  await cargarTablaGenerica(
    'Gastos',
    '#tablaGastos tbody',
    (fila) => `
      <td>${fila[0]}</td>
      <td>${fila[1]}</td>
      <td>${fila[2]}</td>
      <td>L ${formatearMoneda(fila[3])}</td>
    `,
    { ultimos: 10 }
  );
}

// ========================================
// INICIALIZACIÓN
// ========================================
document.addEventListener('DOMContentLoaded', () => {
  console.log('Sistema POS cargado correctamente');
  
  // Configurar inputs de precios (NUEVO)
  configurarInputsPrecios();
  
  // Configurar inputs de clientes
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

  const identidadInput = document.getElementById('identidadCliente');
  if (identidadInput) {
    identidadInput.addEventListener('input', function(e) {
      const cursorPos = this.selectionStart;
      const longitudAntes = this.value.length;
      this.value = formatearIdentidadHonduras(this.value);
      const longitudDespues = this.value.length;
      
      if (longitudDespues > longitudAntes) {
        this.setSelectionRange(cursorPos + 1, cursorPos + 1);
      } else {
        this.setSelectionRange(cursorPos, cursorPos);
      }
    });
  }

  const correoInput = document.getElementById('correoCliente');
  if (correoInput) {
    correoInput.addEventListener('input', function(e) {
      const cursorPos = this.selectionStart;
      this.value = this.value.toLowerCase();
      this.setSelectionRange(cursorPos, cursorPos);
    });
  }

  const telefonoInput = document.getElementById('telefonoCliente');
  if (telefonoInput) {
    telefonoInput.addEventListener('focus', function(e) {
      if (this.value === '') {
        this.value = '+504 ';
      }
    });
    
    telefonoInput.addEventListener('input', function(e) {
      const cursorPos = this.selectionStart;
      const longitudAntes = this.value.length;
      this.value = formatearTelefonoHonduras(this.value);
      const longitudDespues = this.value.length;
      
      if (longitudDespues > longitudAntes) {
        this.setSelectionRange(cursorPos + 1, cursorPos + 1);
      } else {
        this.setSelectionRange(cursorPos, cursorPos);
      }
    });
    
    telefonoInput.addEventListener('keydown', function(e) {
      if ((e.key === 'Backspace' || e.key === 'Delete') && this.value.length <= 5) {
        e.preventDefault();
        this.value = '+504 ';
      }
    });
  }
});

// Cerrar modal al hacer clic fuera de él
window.onclick = function(event) {
  const modal = document.getElementById('modalImagenes');
  if (event.target === modal) {
    cerrarModal();
  }
}

// Cerrar modal al hacer clic fuera de él
window.onclick = function(event) {
  const modal = document.getElementById('modalImagenes');
  if (event.target === modal) {
    cerrarModal();
  }
}
