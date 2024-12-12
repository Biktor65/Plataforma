from flask import Flask, render_template
from app.Envase.views import clientes_bp
from app.gestor_promorack.views import gestor_promorack_bp
from app.AccionesComerciales.App import acciones_clientes
import os

def create_app():
    app = Flask(__name__)
    
    
    app.secret_key = os.urandom(24)
    os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

    # Registrar el blueprint de clientes
    app.register_blueprint(clientes_bp, url_prefix='/')
    app.register_blueprint(gestor_promorack_bp, url_prefix='/')
    app.register_blueprint(acciones_clientes, url_prefix='/')
    
    @app.route('/')
    def home():
        return render_template('dashboard.html')

    return app
