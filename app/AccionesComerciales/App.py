from flask import request, jsonify, Blueprint,render_template,redirect, url_for, jsonify, session
from app.usuarios.views import login_required,role_required
from app.usuarios.models import obtener_usuario_por_id
import pyodbc
import pandas as pd
import os
from dotenv import load_dotenv

load_dotenv()

UPLOAD_FOLDER = './app/static/uploads'
ALLOWED_EXTENSIONS = {'xlsx'}


acciones_clientes = Blueprint('acciones_clientes', __name__)

conexion_str = (    
    f"DRIVER={{{os.getenv('DRIVER')}}};"
    f"SERVER={os.getenv('SERVER')};"
    f"DATABASE={os.getenv('DATABASE')};"
    f"Trusted_Connection={os.getenv('Trusted_Connection')};"
    )

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@acciones_clientes.route('/upload_excel', methods=['POST'])
@login_required
@role_required('admin')
def upload_excel():
    if 'file' not in request.files:
        return redirect(url_for('acciones_clientes.clientes_accion', error="No se seleccionó ningún archivo."))

    file = request.files['file']

    if file.filename == '':
        return redirect(url_for('acciones_clientes.clientes_accion', error="El archivo no tiene un nombre válido."))

    if file and allowed_file(file.filename):
        filepath = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(filepath)
        try:
            procesar_excel(filepath)
            return redirect(url_for('acciones_clientes.clientes_accion', success="Archivo procesado con éxito."))
        except Exception as e:
            return redirect(url_for('acciones_clientes.clientes_accion', error=f"Error al procesar el archivo: {e}"))

    return redirect(url_for('acciones_clientes.clientes_accion', error="Archivo no permitido."))


def procesar_excel(filepath):
    # Leer el archivo Excel con las columnas `CODCLIENTE` como cadenas
    df = pd.ExcelFile(filepath)
    with pyodbc.connect(conexion_str) as conexion:
        cursor = conexion.cursor()

        for sheet_name in df.sheet_names:
            data = df.parse(sheet_name, dtype={'CODCLIENTE': str})  # Forzar `CODCLIENTE` como string

            # Validar si las columnas requeridas están presentes
            if 'CODCLIENTE' not in data.columns or 'ACCIONCOMERCIAL' not in data.columns:
                print(f"Hoja '{sheet_name}' no tiene las columnas requeridas. Saltando...")
                continue

            for _, row in data.iterrows():
                codcliente = row['CODCLIENTE'].zfill(13)  # Asegurarse de que tenga 13 dígitos
                accion_comercial = row['ACCIONCOMERCIAL']

                # Ignorar filas con datos faltantes
                if pd.isnull(codcliente) or pd.isnull(accion_comercial):
                    print(f"Fila inválida en hoja '{sheet_name}' (Datos faltantes). Saltando...")
                    continue

                # Validar si la acción comercial existe
                cursor.execute("SELECT CODAccionComercial FROM AccionesComerciales WHERE Descripcion = ?", (accion_comercial,))
                accion_row = cursor.fetchone()
                if not accion_row:
                    print(f"Acción comercial '{accion_comercial}' no existe. Saltando...")
                    continue

                codaccion = accion_row[0]

                # Verificar si la relación cliente-acción ya existe
                cursor.execute("""
                    SELECT COUNT(*) FROM ClienteAccionComercial
                    WHERE CODCLIENTE = ? AND CODAccionComercial = ?
                """, (codcliente, codaccion))
                if cursor.fetchone()[0] > 0:
                    print(f"Cliente {codcliente} ya tiene la acción comercial '{accion_comercial}'. Saltando...")
                    continue

                # Insertar relación cliente-acción comercial
                cursor.execute("""
                    INSERT INTO ClienteAccionComercial (CODCLIENTE, CODAccionComercial)
                    VALUES (?, ?)
                """, (codcliente, codaccion))

        conexion.commit()
        print("Datos procesados exitosamente.")



# CRUD para AccionesComerciales
@acciones_clientes.route('/acciones', methods=['GET', 'POST'])
@login_required
@role_required('admin')
def cargar_acciones():
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

        if request.method == 'POST':
            descripcion = request.form['descripcion']
            
            with pyodbc.connect(conexion_str) as conexion:
                cursor = conexion.cursor()
                try:
                    cursor.execute("SELECT MAX(CODAccionComercial) FROM AccionesComerciales")
                    max_codigo = cursor.fetchone()[0]
                    nuevo_codigo = max_codigo + 1 if max_codigo is not None else 1
                    
                    cursor.execute(
                        "INSERT INTO AccionesComerciales (CODAccionComercial, Descripcion) VALUES (?, ?)",
                        (nuevo_codigo, descripcion)
                    )
                    conexion.commit()
                except Exception as e:
                    print(f"Error al insertar acción comercial: {e}")
                    return redirect(url_for('acciones_clientes.cargar_acciones'))

            return redirect(url_for('acciones_clientes.cargar_acciones'))

        with pyodbc.connect(conexion_str) as conexion:
            cursor = conexion.cursor()
            cursor.execute("SELECT * FROM AccionesComerciales")
            acciones = cursor.fetchall()

        return render_template('acciones.html', acciones=acciones, usuario=datos_usuario)

    except Exception as e:
        print("Error en cargar_acciones:", str(e))
        return render_template('acciones.html', acciones=[], usuario={"nombre": "Desconocido", "rol": "Sin Rol"})


@acciones_clientes.route('/acciones/edit/<int:codaccion>', methods=['GET', 'POST'])
@login_required
@role_required('admin')
def edit_accion(codaccion):
    with pyodbc.connect(conexion_str) as conexion:
        cursor = conexion.cursor()
        if request.method == 'POST':
            descripcion = request.form['descripcion']
            cursor.execute("UPDATE AccionesComerciales SET Descripcion = ? WHERE CODAccionComercial = ?", (descripcion, codaccion))
            conexion.commit()
            return redirect(url_for('acciones_clientes.cargar_acciones'))

        cursor.execute("SELECT * FROM AccionesComerciales WHERE CODAccionComercial = ?", (codaccion,))
        accion = cursor.fetchone()
    return render_template('edit_accion.html', accion=accion)

@acciones_clientes.route('/acciones/delete/<int:codaccion>', methods=['POST'])
@login_required
@role_required('admin')
def delete_accion(codaccion):
    with pyodbc.connect(conexion_str) as conexion:
        cursor = conexion.cursor()
        cursor.execute("DELETE FROM AccionesComerciales WHERE CODAccionComercial = ?", (codaccion,))
        conexion.commit()
    return redirect(url_for('acciones_clientes.cargar_acciones'))

# CRUD para ClienteAccionComercial

@acciones_clientes.route('/clientes_accion', methods=['GET', 'POST'])
@login_required
@role_required('admin')
def clientes_accion():
    acciones_comerciales = []
    clientes_accion = []
    datos_usuario = {"nombre": "Desconocido", "rol": "Sin Rol"}

    try:
        # Obtener usuario desde la sesión
        usuario_id = session.get('usuario_id')
        usuario = obtener_usuario_por_id(usuario_id)

        if usuario:
            datos_usuario = {
                "nombre": usuario[1],  # Nombre del usuario
                "rol": usuario[3]  # Rol del usuario
            }

        with pyodbc.connect(conexion_str) as conexion:
            cursor = conexion.cursor()

            # Obtener lista de acciones comerciales
            cursor.execute("SELECT CODAccionComercial, Descripcion FROM AccionesComerciales")
            acciones_comerciales = cursor.fetchall()

            # Obtener lista de clientes con acciones comerciales
            cursor.execute("""
                SELECT cac.CODCLIENTE, cac.CODAccionComercial, c.NombreClienteLegal, c.NombreComercial, ac.Descripcion
                FROM ClienteAccionComercial AS cac
                JOIN AccionesComerciales AS ac ON cac.CODAccionComercial = ac.CODAccionComercial
                JOIN Clientes AS c ON cac.CODCLIENTE = c.CODCliente
                ORDER BY cac.CODCLIENTE
                OFFSET 0 ROWS FETCH NEXT 100 ROWS ONLY
            """)
            clientes_accion = cursor.fetchall()

    except Exception as e:
        print(f"Error al obtener datos: {e}")

    if request.method == 'POST':
        codcliente = request.form['codcliente']
        codaccion = request.form['codaccion']

        try:
            with pyodbc.connect(conexion_str) as conexion:
                cursor = conexion.cursor()

                # Verificar si el cliente existe
                cursor.execute("SELECT COUNT(*) FROM Clientes WHERE CODCLIENTE = ?", (codcliente,))
                if cursor.fetchone()[0] == 0:
                    return render_template('clientes_accion.html', 
                                           error="El cliente no existe.", 
                                           clientes_accion=clientes_accion, 
                                           acciones_comerciales=acciones_comerciales, 
                                           usuario=datos_usuario)

                # Insertar la acción comercial para el cliente
                cursor.execute("INSERT INTO ClienteAccionComercial (CODCLIENTE, CODAccionComercial) VALUES (?, ?)", 
                               (codcliente, codaccion))
                conexion.commit()
                
                return render_template('clientes_accion.html', 
                                       success="Cliente y acción comercial añadidos correctamente.", 
                                       clientes_accion=clientes_accion, 
                                       acciones_comerciales=acciones_comerciales, 
                                       usuario=datos_usuario)
        except Exception as e:
            print(f"Error al procesar el POST: {e}")
            return render_template('clientes_accion.html', 
                                   error="Error al procesar la solicitud.", 
                                   clientes_accion=clientes_accion, 
                                   acciones_comerciales=acciones_comerciales, 
                                   usuario=datos_usuario)

    return render_template('clientes_accion.html', 
                           acciones_comerciales=acciones_comerciales, 
                           clientes_accion=clientes_accion, 
                           usuario=datos_usuario)



def get_clientes_accion():
    try:
        with pyodbc.connect(conexion_str) as conexion:
            cursor = conexion.cursor()
            cursor.execute("""
            SELECT cac.CODCLIENTE, cac.CODAccionComercial, c.NombreClienteLegal, c.NombreComercial, ac.Descripcion
            FROM ClienteAccionComercial AS cac
            JOIN AccionesComerciales AS ac ON cac.CODAccionComercial = ac.CODAccionComercial
            JOIN Clientes AS c ON cac.CODCLIENTE = c.CODCliente
            """)
            return cursor.fetchall()  # Devuelve los resultados como una lista de tuplas
    except Exception as e:
        print(f"Error al obtener clientes-acciones: {e}")
        return []

@acciones_clientes.route('/fetch_clientes_accion_paginated', methods=['GET'])
@login_required
@role_required('admin')
def fetch_clientes_accion_paginated():
    try:
        draw = int(request.args.get('draw', 1))  # Control de DataTables
        start = int(request.args.get('start', 0))  # Desde qué registro comenzar
        length = int(request.args.get('length', 10))  # Cuántos registros obtener
        search_value = request.args.get('search[value]', '')  # Filtro de búsqueda

        with pyodbc.connect(conexion_str) as conexion:
            cursor = conexion.cursor()

            # Contar el total de registros sin filtrar
            cursor.execute("SELECT COUNT(*) FROM ClienteAccionComercial")
            total_records = cursor.fetchone()[0]

            # Filtrar por búsqueda si hay un valor de búsqueda
            if search_value:
                cursor.execute("""
                    SELECT COUNT(*) FROM ClienteAccionComercial AS cac
                    JOIN AccionesComerciales AS ac ON cac.CODAccionComercial = ac.CODAccionComercial
                    JOIN Clientes AS c ON cac.CODCLIENTE = c.CODCliente
                    WHERE c.NombreComercial LIKE ? OR c.CODCLIENTE LIKE ?
                """, ('%' + search_value + '%', '%' + search_value + '%'))
                filtered_records = cursor.fetchone()[0]
            else:
                filtered_records = total_records

            # Obtener los datos con paginación y filtro
            cursor.execute("""
                SELECT cac.CODCLIENTE, cac.CODAccionComercial, c.NombreClienteLegal, c.NombreComercial, ac.Descripcion
                FROM ClienteAccionComercial AS cac
                JOIN AccionesComerciales AS ac ON cac.CODAccionComercial = ac.CODAccionComercial
                JOIN Clientes AS c ON cac.CODCLIENTE = c.CODCliente
                WHERE c.NombreComercial LIKE ? OR c.CODCLIENTE LIKE ?
                ORDER BY cac.CODCLIENTE
                OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
            """, ('%' + search_value + '%', '%' + search_value + '%', start, length))

            clientes_accion = cursor.fetchall()

        clientes_data = [
            {
                'CODCLIENTE': cliente[0],
                'CODAccionComercial': cliente[1],
                'NombreClienteLegal': cliente[2],
                'NombreComercial': cliente[3],
                'Descripcion': cliente[4],
            }
            for cliente in clientes_accion
        ]

        return jsonify({
            "draw": draw,
            "recordsTotal": total_records,
            "recordsFiltered": filtered_records,
            "data": clientes_data
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@acciones_clientes.route('/clientes_accion/edit/<string:codcliente>/<int:codaccion>', methods=['GET', 'POST'])
@login_required
@role_required('admin')
def edit_cliente_accion(codcliente, codaccion):
    with pyodbc.connect(conexion_str) as conexion:
        cursor = conexion.cursor()
        if request.method == 'POST':
            nuevo_codcliente = request.form['codcliente']
            nueva_codaccion = request.form['codaccion']
            cursor.execute(
                "UPDATE ClienteAccionComercial SET CODCLIENTE = ?, CODAccionComercial = ? WHERE CODCLIENTE = ? AND CODAccionComercial = ?",
                (nuevo_codcliente, nueva_codaccion, codcliente, codaccion)
            )
            conexion.commit()
            return redirect(url_for('acciones_clientes.clientes_accion'))

        cursor.execute("SELECT * FROM ClienteAccionComercial WHERE CODCLIENTE = ? AND CODAccionComercial = ?", (codcliente, codaccion))
        cliente_accion = cursor.fetchone()

        # Obtener acciones comerciales
        cursor.execute("SELECT * FROM AccionesComerciales")
        acciones_comerciales = cursor.fetchall()

    return render_template('edit_cliente_accion.html', cliente_accion=cliente_accion, acciones_comerciales=acciones_comerciales)


@acciones_clientes.route('/clientes_accion/delete/<string:codcliente>/<int:codaccion>', methods=['POST'])
@login_required
@role_required('admin')
def delete_cliente_accion(codcliente, codaccion):
    with pyodbc.connect(conexion_str) as conexion:
        cursor = conexion.cursor()
        cursor.execute("DELETE FROM ClienteAccionComercial WHERE CODCLIENTE = ? AND CODAccionComercial = ?", (codcliente, codaccion))
        conexion.commit()
    return redirect(url_for('acciones_clientes.clientes_accion'))

@acciones_clientes.route('/fetch_cliente/<codcliente>', methods=['GET'])
@login_required
@role_required('admin')
def fetch_cliente(codcliente):
    with pyodbc.connect(conexion_str) as conexion:
        cursor = conexion.cursor()
        cursor.execute("SELECT NombreClienteLegal, NombreComercial FROM Clientes WHERE CODCLIENTE = ?", (codcliente,))
        cliente = cursor.fetchone()

        # Obtener promociones del cliente
        cursor.execute("""
            SELECT ac.Descripcion
            FROM ClienteAccionComercial AS cac
            JOIN AccionesComerciales AS ac ON cac.CODAccionComercial = ac.CODAccionComercial
            WHERE cac.CODCLIENTE = ?
        """, (codcliente,))
        promociones = cursor.fetchall()

    if cliente:
        # Formatear promociones
        descripcion_promociones = [promo[0] for promo in promociones]  # Extraer descripciones
        return {
            "NombreClienteLegal": cliente[0],
            "NombreComercial": cliente[1],
            "Promociones": descripcion_promociones
        }
    else:
        return {}, 404

@acciones_clientes.route('/fetch_clientes_accion/<string:filter>', methods=['GET'])
@login_required
@role_required('admin')
def fetch_clientes_accion(filter):
    with pyodbc.connect(conexion_str) as conexion:
        cursor = conexion.cursor()
        cursor.execute("""
            SELECT cac.CODCLIENTE, c.NombreComercial 
			FROM ClienteAccionComercial AS cac
			JOIN Clientes AS c ON cac.CODCLIENTE=c.CODCliente
            WHERE cac.CODCLIENTE LIKE ?
        """, (f"%{filter}%",))
        clientes = cursor.fetchall()

    return jsonify([{'CODCLIENTE': c[0], 'NombreComercial': c[1]} for c in clientes])

@acciones_clientes.route('/fetch_clientes/<string:filter>', methods=['GET'])
@login_required
@role_required('admin')
def fetch_clientes(filter):
    with pyodbc.connect(conexion_str) as conexion:
        cursor = conexion.cursor()
        cursor.execute("""
            SELECT CODCLIENTE, NombreComercial FROM Clientes
            WHERE CODCLIENTE LIKE ? OR NombreComercial LIKE ?
        """, (f"%{filter}%", f"%{filter}%"))
        clientes = cursor.fetchall()

    return jsonify([{'CODCLIENTE': c[0], 'NombreComercial': c[1]} for c in clientes])