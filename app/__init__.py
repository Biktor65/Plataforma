from flask import Flask, render_template, redirect, url_for, session
from app.Envase.views import clientes_bp
from app.gestor_promorack.views import gestor_promorack_bp
from app.AccionesComerciales.App import acciones_clientes
from app.usuarios.views import usuarios_bp
import os

def create_app():
    app = Flask(__name__)
    
    
    app.secret_key = os.urandom(24)
    os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

    # Registrar el blueprint de clientes
    app.register_blueprint(clientes_bp, url_prefix='/usuario')
    app.register_blueprint(gestor_promorack_bp, url_prefix='/usuario')
    app.register_blueprint(acciones_clientes, url_prefix='/admin')
    app.register_blueprint(usuarios_bp, url_prefix='/auth')
    
    @app.route('/')
    def home():
        if 'usuario_id' not in session:
            return redirect(url_for('usuarios.login'))
        elif session.get('rol') == 'admin':
            return redirect(url_for('usuarios.dashboard_admin'))
        elif session.get('rol') == 'usuario':
            return redirect(url_for('usuarios.dashboard_usuario'))
        return redirect(url_for('usuarios.login'))
    
    return app
