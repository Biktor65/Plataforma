from flask import Blueprint, render_template, jsonify
from .models import fetch_promorack_data_from_sql

gestor_promorack_bp = Blueprint('gestor_promorack', __name__)

@gestor_promorack_bp.route('/promorack')
def promorack_cambios():
    return render_template('promorack_cambios.html')

@gestor_promorack_bp.route('/api/promorack',methods=['GET'])
def get_promorack_data_from_sql():
    data = fetch_promorack_data_from_sql()
    if isinstance(data, str):  
        return jsonify({"error": data}), 500
    return jsonify(data)