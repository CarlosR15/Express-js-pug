const usuarios = [
    { id: 1, usuario: 'admin', contrasena: '1234' }
  ];

function getUsuariosPorUsuario(usuario) {
    return usuarios.find(consulta => consulta.usuario === usuario);
}

module.exports = {
    getUsuariosPorUsuario
};