from flask import Blueprint, render_template, jsonify, request,session
from .models import fetch_promorack_data_from_sql, guardar_formulario, actualizar_estado_formulario, fetch_promorack_data_for_dashboard
from app.usuarios.views import login_required, role_required, obtener_datos_usuario_y_formularios
import logging

gestor_promorack_bp = Blueprint('gestor_promorack', __name__)

@gestor_promorack_bp.route('/promorack')
@login_required
@role_required('usuario')
def promorack_cambios():
    try:
        # Usar la función auxiliar para obtener datos reutilizables
        datos_usuario, _, formularios_recientes = obtener_datos_usuario_y_formularios()

        return render_template('promorack_cambios.html', 
                             usuario=datos_usuario,
                             formularios_recientes=formularios_recientes)
    except Exception as e:
        print("Error en intro_envase:", str(e))
        return render_template('promorack_cambios.html',
                             usuario={"nombre": "Desconocido", "rol": "Sin Rol"},
                             formularios_recientes=[])

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

@gestor_promorack_bp.route('/api/dashboard_data', methods=['GET'])
@login_required
def get_dashboard_data():
    try:
        datos = fetch_promorack_data_for_dashboard()
        
        if isinstance(datos, str) and datos.startswith("Error"):
            return jsonify({"error": datos}), 500
        
        return jsonify(datos), 200
    except Exception as e:
        return jsonify({"error": f"Error al obtener los datos del dashboard: {str(e)}"}), 500