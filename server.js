const express = require('express');
const app = express();
const session = require('express-session');
const path = require('path');
const productosController = require('./controllers/productos');
const usuarioController = require('./controllers/usuarios');

app.use(express.urlencoded({ extended: true}));

// Configurar middleware para manejar sesiones
app.use(session({
  secret: 'secreto', // Clave secreta para firmar la cookie de sesión
  resave: false,
  saveUninitialized: true
}));

app.use((req, res, next) => {
  res.locals.carrito = req.session.carrito || [];
  next();
});

// Configuración de la plantilla Pug
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Middleware para procesar archivos estáticos en la carpeta 'public'
app.use(express.static('public'));
app.use(express.json());

// Ruta para la página de inicio
app.get('/', (req, res) => {
    const usuario = req.session.usuario; // pal usuario al iniciar sesion creo
    res.render('index', { title: 'Página de Bienvenida', usuario });
}); 

// Ruta para el catálogo de productos
app.get('/catalogo', (req, res) => {
    const usuario = req.session.usuario;
    const productos = productosController.getProductos();
    res.render('catalogo', { title: 'Catálogo de Productos', productos, usuario });
});

// Ruta para buscar productos
app.get('/buscar-producto', (req, res) => {
    const query = req.query.q.toLowerCase();
    const productos = productosController.getProductos();
    const productosFiltrados = productos.filter(producto =>
        producto.nombre.toLowerCase().includes(query) || producto.descripcion.toLowerCase().includes(query)
    );
    res.render('catalogo', { title: 'Resultados de la Búsqueda', productos: productosFiltrados, usuario });
});


// Ruta para el detalle de producto
app.get('/producto/:id', (req, res) => {
    const usuario = req.session.usuario;
    const idProducto = req.params.id;
    const producto = productosController.getProductoPorId(idProducto);
    res.render('producto', { title: 'Detalle del Producto', producto, usuario });
});

// Ruta para el carrito de compra
app.get('/carrito', (req, res) => {
    const usuario = req.session.usuario;
    let carrito = req.session.carrito || []; // Obtiene el carrito de la sesión del usuario, si no existe, crea un nuevo carrito vacío
    res.render('carrito', { title: 'Carrito de Compra', carrito, usuario });
});

// Ruta para boton de login
app.get('/login', (req, res) => {
    res.render('login', { title: 'Iniciar Sesion' });
});

app.post('/login', (req, res) => {
    let usuario = req.body.usuario;
    const cont = req.body.contrasena;

    usuario = usuarioController.getUsuariosPorUsuario(usuario);
    console.log(usuario);
    if(usuario){
        if(cont === usuario.contrasena){
            req.session.usuario = usuario;
            res.render('index', {title: 'Página de Bienvenida', usuario: usuario});
        } else {
            res.render('login', { title: 'Por favor no me digas que esta mal', error: 'Contraseña no valida.' });
        }
    }else {
        res.render('login', { title:'No es la contrasenia bro', error: 'Usuario no valido'})
    }
});

// Ruta cerrar sesion
app.get('/logout', (req, res) => {
    req.session.usuario = null;
    req.session.usu1 = null; // Elimina la variable 'usu1' de la sesión
    res.redirect('/'); // Redirige a la página de inicio
});

// Ruta para agregar un producto al carrito
app.post('/agregar-al-carrito/:id', (req, res) => {
  const idProducto = req.params.id;
  const producto = productosController.getProductoPorId(idProducto);
  if (producto && producto.cantidad > 0) {
      let carrito = req.session.carrito || [];
      let productoEnCarrito = carrito.find(item => item.id === idProducto);
      if (productoEnCarrito) {
          productoEnCarrito.cantidad++;
      } else {
          carrito.push({ id: idProducto, nombre: producto.nombre, precio: producto.precio, cantidad: 1 });
      }
      producto.cantidad--;
      req.session.carrito = carrito;
      res.redirect('/catalogo');
  } else {
      res.status(404).send('Producto no encontrado o no disponible');
  }
});

// Ruta para el detalle de compra
app.get('/detalle-compra', (req, res) => {
    let carrito = req.session.carrito || []; // Obtiene el carrito de la sesión del usuario, si no existe, crea un nuevo carrito vacío
    res.render('detalle-compra', { title: 'Detalle de Compra', carrito});
});

// Ruta para actualizar la cantidad de un producto en el carrito
app.post('/actualizar-cantidad/:id/:cantidad', (req, res) => {
    const idProducto = req.params.id;
    const cantidad = parseInt(req.params.cantidad);
    let carrito = req.session.carrito || [];
    const item = carrito.find(item => item.id === idProducto);
    const producto = productosController.getProductoPorId(idProducto);
    if (item) {
        const cantidadNueva = item.cantidad + cantidad;
        if (cantidadNueva > 0 && cantidad <= producto.cantidad) {
            item.cantidad = cantidadNueva;
            item.precio = item.cantidad * producto.precio;
            producto.cantidad -= cantidad;
            if (item.cantidad === 0) {
                carrito = carrito.filter(item => item.id !== idProducto);
            }
        }
    }
    req.session.carrito = carrito;
    res.redirect('/carrito');
});

// Ruta para eliminar un producto del carrito
app.post('/eliminar-del-carrito/:id', (req, res) => {
    const idProducto = req.params.id;
    let carrito = req.session.carrito || []; // Obtiene el carrito de la sesión del usuario, si no existe, crea un nuevo carrito vacío
    const itemIndex = carrito.findIndex(item => item.id === idProducto);
    if (itemIndex !== -1) {
      const removedItem = carrito.splice(itemIndex, 1)[0];
      const producto = productosController.getProductoPorId(idProducto);
      if (producto) {
        producto.cantidad += removedItem.cantidad; // Modifica la cantidad del producto en stock
      }
    }
    req.session.carrito = carrito; // Actualiza el carrito en la sesión
    res.redirect('/carrito');
});

// Middleware para procesar la compra
app.post('/procesar-compra', (req, res) => {
    // Aquí iría la lógica para procesar la compra, por ejemplo, actualizar la base de datos y vaciar el carrito
    const carrito = req.session.carrito || []; // Obtiene el carrito de la sesión del usuario

    // Lógica para procesar la compra...

    // Vaciar el carrito después de procesar la compra
    req.session.carrito = [];
    
    res.render('confirmacion-compra', { title: 'Compra Exitosa' });
});
  
// Puerto en el que escucha el servidor
const port = 3000;
app.listen(port, () => {
    console.log(`Servidor iniciado en http://localhost:${port}`);
});
