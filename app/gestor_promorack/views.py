from flask import Blueprint, render_template, jsonify
from .models import fetch_promorack_data_from_sql
from app.usuarios.views import login_required, role_required

gestor_promorack_bp = Blueprint('gestor_promorack', __name__)



@gestor_promorack_bp.route('/promorack')
@login_required
@role_required('usuario')
def promorack_cambios():
    return render_template('promorack_cambios.html')

@gestor_promorack_bp.route('/api/promorack',methods=['GET'])
@login_required
@role_required('usuario')
def get_promorack_data_from_sql():
    data = fetch_promorack_data_from_sql()
    if isinstance(data, str):  
        return jsonify({"error": data}), 500
    return jsonify(data)