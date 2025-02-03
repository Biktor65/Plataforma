import pyodbc
import os
from dotenv import load_dotenv

load_dotenv()

# Configuración de la conexión a SQL Server
conexion_string = (
    f"DRIVER={{{os.getenv('DRIVER')}}};"
    f"SERVER={os.getenv('SERVER')};"
    f"DATABASE={os.getenv('DATABASE')};"
    f"Trusted_Connection={os.getenv('Trusted_Connection')};"
)

def fetch_formularios():
    try:
        with pyodbc.connect(conexion_string) as conexion:
            cursor = conexion.cursor()
            consulta = """
                SELECT 
                    U.usuario, 
                    F.FormularioID, 
                    F.Estado, 
                    F.FechaCreacion  
                FROM Formulario AS F
                JOIN usuarios AS U ON F.UsuarioID = U.id;
            """
            cursor.execute(consulta)
            filas = cursor.fetchall()
            
            formularios_con_usuario = [{
                "Usuario": fila.usuario,
                "FormularioID": fila.FormularioID,
                "Estado": fila.Estado,
                "FechaCreacion": fila.FechaCreacion
            } for fila in filas]
            
            return formularios_con_usuario
    except Exception as e:
        return {"error": f"Error al obtener formularios con usuario: {str(e)}"}

def guardar_formulario(data):
    try:
        with pyodbc.connect(conexion_string) as conexion:
            cursor = conexion.cursor()

            # Inserta en la tabla Formulario
            consulta_principal = """
            INSERT INTO Formulario (UsuarioID, Estado, FechaCreacion)
            OUTPUT INSERTED.FormularioID
            VALUES (?, 'pending', GETDATE())
            """
            cursor.execute(consulta_principal, data['UsuarioID'])
            formulario_id = cursor.fetchone()[0]

            # Inserta en la tabla FormularioData
            consulta_detalle = """
            INSERT INTO FormularioData (FormularioID, Centro, JefeZona, Ruta, CODCliente, NombreCliente, NombreNegocio, Cluster)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """
            for detalle in data['Detalles']:
                cursor.execute(
                    consulta_detalle,
                    formulario_id,
                    detalle.get('Centro'),
                    detalle.get('JefeZona'),
                    detalle.get('Ruta'),
                    detalle.get('CODCliente'),
                    detalle.get('NombreCliente'),
                    detalle.get('NombreNegocio'),
                    detalle.get('Cluster')
                )

            conexion.commit()
            return {"message": "Formulario guardado correctamente", "FormularioID": formulario_id}
    except Exception as e:
        return {"error": f"Error al guardar el formulario: {str(e)}"}

def actualizar_estado_formulario(formulario_id, estado):
    try:
        with pyodbc.connect(conexion_string) as conexion:
            cursor = conexion.cursor()

            consulta = """
            UPDATE Formulario
            SET Estado = ?
            WHERE FormularioID = ?
            """
            cursor.execute(consulta, estado, formulario_id)
            conexion.commit()
            return {"message": "Estado actualizado correctamente"}
    except Exception as e:
        return {"error": f"Error al actualizar el estado: {str(e)}"}
    
def actualizar_detalles_formulario(formulario_id, detalles):
    try:
        with pyodbc.connect(conexion_string) as conexion:
            cursor = conexion.cursor()

            for detalle in detalles:
                consulta = """
                UPDATE FormularioData
                SET Centro = ?, JefeZona = ?, Ruta = ?, CODCliente = ?, NombreCliente = ?, NombreNegocio = ?, Cluster = ?
                WHERE DetalleID = ? AND FormularioID = ?
                """
                cursor.execute(consulta, 
                    detalle['Centro'],
                    detalle['JefeZona'],
                    detalle['Ruta'],
                    detalle['CODCliente'],
                    detalle['NombreCliente'],
                    detalle['NombreNegocio'],
                    detalle['Cluster'],
                    detalle['DetalleID'],
                    formulario_id
                )

            conexion.commit()
            return {"message": "Detalles del formulario actualizados correctamente"}
    except Exception as e:
        return {"error": f"Error al actualizar los detalles del formulario: {str(e)}"}    

def fetch_formulario_por_id(formulario_id):
    try:
        with pyodbc.connect(conexion_string) as conexion:
            cursor = conexion.cursor()
            
            # Obtener los datos del formulario principal
            consulta_formulario = """
                SELECT 
                    U.usuario, 
                    F.FormularioID, 
                    F.Estado, 
                    F.FechaCreacion  
                FROM Formulario AS F
                JOIN usuarios AS U ON F.UsuarioID = U.id
                WHERE F.FormularioID = ?
            """
            cursor.execute(consulta_formulario, formulario_id)
            formulario = cursor.fetchone()

            if not formulario:
                return {"error": "Formulario no encontrado"}

            # Convertir el formulario en un diccionario
            formulario_dict = {
                "Usuario": formulario.usuario,
                "FormularioID": formulario.FormularioID,
                "Estado": formulario.Estado,
                "FechaCreacion": formulario.FechaCreacion
            }

            # Obtener los detalles asociados al formulario
            consulta_detalles = """
                SELECT DetalleID, Centro, JefeZona, Ruta, CODCliente, NombreCliente, NombreNegocio, Cluster
                FROM FormularioData
                WHERE FormularioID = ?
            """
            cursor.execute(consulta_detalles, formulario_id)
            detalles = cursor.fetchall()

            # Convertir los detalles en una lista de diccionarios
            detalles_lista = [{
                "DetalleID": detalle.DetalleID,
                "Centro": detalle.Centro,
                "JefeZona": detalle.JefeZona,
                "Ruta": detalle.Ruta,
                "CODCliente": detalle.CODCliente,
                "NombreCliente": detalle.NombreCliente,
                "NombreNegocio": detalle.NombreNegocio,
                "Cluster": detalle.Cluster
            } for detalle in detalles]

            formulario_dict["Detalles"] = detalles_lista

            return formulario_dict
    except Exception as e:
        return {"error": f"Error al obtener el formulario: {str(e)}"}
