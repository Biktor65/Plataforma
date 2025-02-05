from flask import Blueprint, render_template, request, redirect, url_for, session, flash, jsonify
from app.usuarios.models import obtener_usuario, verificar_contra, obtener_perfil, actualizar_perfil,obtener_usuario_por_id
from functools import wraps
from werkzeug.security import generate_password_hash

usuarios_bp = Blueprint('usuarios',__name__)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'usuario_id' not in session:
            return redirect(url_for('usuarios.login'))
        return f(*args, **kwargs)
    return decorated_function

def role_required(rol):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if session.get('rol') !=rol:
                return redirect(url_for('usuarios.unauthorized'))
            return f(*args, **kwargs)
        return decorated_function
    return decorator

@usuarios_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        nom_usuario = request.form['nom_usuario']
        contraseña = request.form['contraseña']

        usuario = obtener_usuario(nom_usuario)

        if usuario and verificar_contra(usuario,contraseña):
            session['usuario_id'] = usuario[0]
            session['rol'] = usuario[3]
            return redirect(url_for('home'))
        else:
            flash('Credenciales invadlidas', 'error')
    return render_template('login.html')

@usuarios_bp.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('usuarios.login'))

@usuarios_bp.route('/unauthorized')
def unauthorized():
    return "NO TIENES PERMISO PARA ACCEDER A ESTA PÁGINA", 403    

@usuarios_bp.route('/admin/dashboard')
@login_required
@role_required('admin')
def dashboard_admin():
    usuario_id = session.get('usuario_id')
    usuario = obtener_usuario_por_id(usuario_id)

    if usuario:
        datos_usuario = {
            "nombre": usuario[1],  # Columna 'usuario'
            "rol": usuario[3]  # Columna 'rol'
        }
    else:
        datos_usuario = {
            "nombre": "Desconocido",
            "rol": "Sin Rol"
        }

    return render_template('dashboard_admin.html', usuario=datos_usuario)

@usuarios_bp.route('/usuario/dashboard')
@login_required
@role_required('usuario')
def dashboard_usuario():
    return render_template('dashboard_usuario.html')

@usuarios_bp.route('/perfil')
@login_required
def perfil():
    return render_template('perfil.html')

@usuarios_bp.route('/api/get_usuario_id', methods=['GET'])
@login_required
def get_usuario_id():
    try:
        usuario_id = session.get('usuario_id')
        if not usuario_id:
            return jsonify({"error": "Usuario no autenticado"}), 401

        return jsonify({"UsuarioID": usuario_id}), 200
    except Exception as e:
        return jsonify({"error": f"Error al obtener el UsuarioID: {str(e)}"}), 500

@usuarios_bp.route('/perfil_data', methods=['GET'])
@login_required
def mostrar_perfil():
    try:
        usuario_id = session.get('usuario_id')
        perfil = obtener_perfil(usuario_id)

        if perfil:
            # Retornar JSON con los datos del perfil
            return jsonify({
                "usuario_id": perfil[0],
                "usuario": perfil[1]
            }), 200
        else:
            return jsonify({"error": "Usuario no encontrado"}), 404
    except Exception as e:
        return jsonify({"error": f"Error al obtener el perfil: {str(e)}"}), 500

@usuarios_bp.route('/perfil_data', methods=['PUT'])
@login_required
def actualizar_perfil_vista():
    try:
        usuario_id = session.get('usuario_id')
        data = request.json  # Datos enviados desde el frontend

        # Validar la contraseña actual si se proporciona una nueva contraseña
        if data.get("nueva_contraseña"):
            contraseña_actual = data.get("contraseña_actual")
            if not contraseña_actual:
                return jsonify({"error": "Debes proporcionar la contraseña actual para cambiarla."}), 400

            usuario = obtener_usuario_por_id(usuario_id)
            if not usuario or not verificar_contra(usuario, contraseña_actual):
                return jsonify({"error": "La contraseña actual es incorrecta."}), 400

            # Validar que la nueva contraseña y la confirmación coincidan
            if data.get("nueva_contraseña") != data.get("confirmar_contraseña"):
                return jsonify({"error": "La nueva contraseña y la confirmación no coinciden."}), 400

            # Validar la longitud de la nueva contraseña
            if len(data.get("nueva_contraseña")) < 8:
                return jsonify({"error": "La nueva contraseña debe tener al menos 8 caracteres."}), 400

        # Validamos los campos permitidos
        datos_a_actualizar = {}

        if data.get("usuario"):
            datos_a_actualizar["usuario"] = data.get("usuario")

        if data.get("nueva_contraseña"):
            nueva_contraseña = data.get("nueva_contraseña")
            datos_a_actualizar["contraseña"] = generate_password_hash(nueva_contraseña)

        if not datos_a_actualizar:
            return jsonify({"error": "No se proporcionaron datos para actualizar"}), 400

        # Actualizamos el perfil en la base de datos
        actualizar_perfil(usuario_id, datos_a_actualizar)

        return jsonify({"mensaje": "Perfil actualizado correctamente"}), 200
    except Exception as e:
        return jsonify({"error": f"Error al actualizar el perfil: {str(e)}"}), 500