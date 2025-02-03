from flask import Blueprint, render_template, jsonify, request
from .models import fetch_formularios, guardar_formulario, actualizar_estado_formulario,actualizar_detalles_formulario, fetch_formulario_por_id
from app.usuarios.views import login_required, role_required

# Crear un Blueprint para las rutas de formularios
formularios_bp = Blueprint('formularios', __name__)


@formularios_bp.route('/formularios')
@login_required
@role_required('admin') 
def listar_formularios():
    try:
        formularios = fetch_formularios()  
        if "error" in formularios:
            print("Error al obtener formularios:", formularios["error"])
            formularios = []  
        return render_template('formulario.html', formularios=formularios)
    except Exception as e:
        print("Error en listar_formularios:", str(e))
        return render_template('formulario.html', formularios=[])

@formularios_bp.route('/enviar_formulario', methods=['POST'])
@login_required
@role_required('admin') 
def enviar_formulario():
    """Guarda un nuevo formulario."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Datos no proporcionados"}), 400

        # Validar campos obligatorios
        if 'UsuarioID' not in data or 'Detalles' not in data:
            return jsonify({"error": "Campos obligatorios faltantes"}), 400

        resultado = guardar_formulario(data)
        if "error" in resultado:
            return jsonify({"error": resultado["error"]}), 500
        return jsonify({"message": "Formulario guardado correctamente", "data": resultado}), 201
    except Exception as e:
        return jsonify({"error": f"Error al guardar el formulario: {str(e)}"}), 500

@formularios_bp.route('/actualizar_estado/<int:formulario_id>', methods=['PUT'])
@login_required
@role_required('admin')  
def actualizar_estado(formulario_id):
    try:
        data = request.get_json()
        if not data or "Estado" not in data:
            return jsonify({"error": "Estado no proporcionado"}), 400

        resultado = actualizar_estado_formulario(formulario_id, data["Estado"])
        if "error" in resultado:
            return jsonify({"error": resultado["error"]}), 500
        return jsonify({"message": "Estado actualizado correctamente", "data": resultado}), 200
    except Exception as e:
        return jsonify({"error": f"Error al actualizar el estado: {str(e)}"}), 500

@formularios_bp.route('/actualizar_formulario/<int:formulario_id>', methods=['PUT'])
@login_required
@role_required('admin')
def actualizar_formulario(formulario_id):
    try:
        data = request.get_json()
        if not data or "Detalles" not in data:
            return jsonify({"error": "Datos incompletos"}), 400

        resultado = actualizar_detalles_formulario(formulario_id, data["Detalles"])  # Implementa esta función en models.py
        if "error" in resultado:
            return jsonify({"error": resultado["error"]}), 500
        return jsonify({"message": "Formulario actualizado correctamente"}), 200
    except Exception as e:
        return jsonify({"error": f"Error al actualizar el formulario: {str(e)}"}), 500

@formularios_bp.route('/api/formularios/<int:formulario_id>', methods=['GET'])
@login_required
@role_required('admin')  
def obtener_formulario(formulario_id):
    try:
        formulario = fetch_formulario_por_id(formulario_id)  # Asegúrate de definir esta función en `models.py`
        if "error" in formulario:
            return jsonify({"error": formulario["error"]}), 500
        return jsonify(formulario), 200
    except Exception as e:
        return jsonify({"error": f"Error al obtener el formulario: {str(e)}"}), 500
