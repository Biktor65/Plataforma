from flask import Blueprint, render_template, jsonify, request
from .models import fetch_promorack_data_from_sql, guardar_formulario, actualizar_estado_formulario
from app.usuarios.views import login_required, role_required
import logging


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

import logging

@gestor_promorack_bp.route('/api/promorack/guardar_formulario', methods=['POST'])
@login_required
@role_required('usuario')
def guardar_formulario_promorack():
    try:
        data = request.get_json()
        resultado = guardar_formulario(data)
        if "error" in resultado:
            return jsonify({"error": resultado["error"]}), 500
        return jsonify({"message": "Formulario guardado exitosamente"}), 201
    except Exception as e:
        logging.error(f"Error al guardar el formulario: {str(e)}")
        return jsonify({"error": "Hubo un error al guardar los datos en la base de datos"}), 500



@gestor_promorack_bp.route('/api/promorack/actualizar_estado/<int:formulario_id>', methods=['PUT'])
@login_required
@role_required('admin')
def actualizar_estado_promorack(formulario_id):
    data = request.get_json()
    estado = data.get("estado")
    if not estado:
        return jsonify({"error": "Estado no proporcionado"}), 400
    resultado = actualizar_estado_formulario(formulario_id, estado)
    if "error" in resultado:
        return jsonify({"error": resultado["error"]}), 500
    return jsonify({"message": "Estado actualizado exitosamente"}), 200
