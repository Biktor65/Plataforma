from flask import Blueprint, render_template, request, redirect, url_for, session, flash
from app.usuarios.models import obtener_usuario, verificar_contra
from functools import wraps

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
    return render_template('dashboard_admin.html')

@usuarios_bp.route('/usuario/dashboard')
@login_required
@role_required('usuario')
def dashboard_usuario():
    return render_template('dashboard_usuario.html')
