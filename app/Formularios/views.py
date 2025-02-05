from flask import Blueprint, render_template, jsonify, request, session
from .models import fetch_formularios, guardar_formulario, actualizar_estado_formulario,fetch_formularios_por_fecha
from .models import actualizar_detalles_formulario, fetch_formulario_por_id, eliminar_detalles_formulario, eliminar_formulario_si_vacio
from datetime import datetime, timedelta
from app.usuarios.models import obtener_usuario_por_id
from app.usuarios.views import login_required, role_required

# Crear un Blueprint para las rutas de formularios
formularios_bp = Blueprint('formularios', __name__)

@formularios_bp.route('/formularios')
@login_required
@role_required('admin') 
def listar_formularios():
    try:
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

        formularios = fetch_formularios()  
        if "error" in formularios:
            print("Error al obtener formularios:", formularios["error"])
            formularios = []  
            
        return render_template('formulario.html', formularios=formularios, usuario=datos_usuario)
    except Exception as e:
        print("Error en listar_formularios:", str(e))
        return render_template('formulario.html', formularios=[], usuario={"nombre": "Desconocido", "rol": "Sin Rol"})


@formularios_bp.route('/enviar_formulario', methods=['POST'])
@login_required
@role_required('admin') 
def enviar_formulario():
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
        if not data or "Detalles" not in data or "Eliminaciones" not in data:
            return jsonify({"error": "Datos incompletos"}), 400

        # Actualizar los registros editados
        resultado_actualizacion = actualizar_detalles_formulario(formulario_id, data["Detalles"])
        if "error" in resultado_actualizacion:
            return jsonify(resultado_actualizacion), 500

        # Eliminar los registros en la cola de eliminación
        resultado_eliminacion = eliminar_detalles_formulario(data["Eliminaciones"])
        if "error" in resultado_eliminacion:
            return jsonify(resultado_eliminacion), 500
        
        resultado_verificacion = eliminar_formulario_si_vacio(formulario_id)
        if "error" in resultado_verificacion:
            return jsonify(resultado_verificacion), 500

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
    
@formularios_bp.route('/api/formularios_por_fecha', methods=['GET'])
@login_required
@role_required('admin')
def obtener_formularios_por_fecha():
    try:
        resultados = fetch_formularios_por_fecha()
        return jsonify(resultados), 200
    except Exception as e:
        return jsonify({"error": f"Error al obtener datos del gráfico: {str(e)}"}), 500
    

@formularios_bp.route('/api/formularios_diarios', methods=['GET'])
@login_required
@role_required('admin')
def obtener_formularios_diarios():
    try:
        # Obtener todos los formularios
        formularios = fetch_formularios()

        # Si hubo un error en la consulta
        if "error" in formularios:
            return jsonify({"error": formularios["error"]}), 500

        # Obtener fechas de hoy y ayer
        hoy = datetime.now().date()
        ayer = hoy - timedelta(days=1)

        # Filtrar formularios por fecha
        formularios_hoy = sum(1 for f in formularios if f["FechaCreacion"].date() == hoy)
        formularios_ayer = sum(1 for f in formularios if f["FechaCreacion"].date() == ayer)

        # Calcular porcentaje de cambio
        porcentaje = ((formularios_hoy - formularios_ayer) / formularios_ayer * 100) if formularios_ayer > 0 else (100 if formularios_hoy > 0 else 0)

        return jsonify({
            "hoy": formularios_hoy,
            "ayer": formularios_ayer,
            "porcentaje": round(porcentaje, 2)
        }), 200
    except Exception as e:
        return jsonify({"error": f"Error al obtener estadísticas diarias: {str(e)}"}), 500
    
@formularios_bp.route('/api/comparacion_aprobados', methods=['GET'])
@login_required
@role_required('admin')
def obtener_comparacion_aprobados():
    try:
        # Obtener todos los formularios desde la base de datos
        formularios = fetch_formularios()

        # Si hubo un error en la consulta
        if "error" in formularios:
            return jsonify({"error": formularios["error"]}), 500

        # Contadores
        aprobados = sum(1 for f in formularios if f["Estado"] == "Aprobado")
        pendientes = sum(1 for f in formularios if f["Estado"] == "pending")

        return jsonify({
            "Aprobados": aprobados,
            "Pendientes": pendientes
        }), 200
    except Exception as e:
        return jsonify({"error": f"Error al obtener datos comparativos: {str(e)}"}), 500