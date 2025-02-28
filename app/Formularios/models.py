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

def fetch_formularios(usuario_id=None):
    try:
        with pyodbc.connect(conexion_string) as conexion:
            cursor = conexion.cursor()
            
            consulta_base = """
                SELECT 
                    U.usuario, 
                    F.FormularioID, 
                    F.Estado, 
                    F.FechaCreacion  
                FROM Formulario AS F
                JOIN usuarios AS U ON F.UsuarioID = U.id
            """
            
            params = []
            
            if usuario_id:
                consulta_base += " WHERE F.UsuarioID = ?"
                params.append(usuario_id)
            
            consulta_base += " ORDER BY F.FechaCreacion DESC"
            
            cursor.execute(consulta_base, params)
            
            formularios = []
            for fila in cursor.fetchall():
                formularios.append({
                    "Usuario": fila.usuario,
                    "FormularioID": fila.FormularioID,
                    "Estado": fila.Estado,
                    "FechaCreacion": fila.FechaCreacion
                })
            
            return formularios
            
    except Exception as e:
        return {"error": f"Error al obtener formularios: {str(e)}"}

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
                    detalle['Centro'], detalle['JefeZona'], detalle['Ruta'], 
                    detalle['CODCliente'], detalle['NombreCliente'], 
                    detalle['NombreNegocio'], detalle['Cluster'], 
                    detalle['DetalleID'], formulario_id
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
                    F.FechaCreacion,
                    F.UsuarioID
                FROM Formulario AS F
                JOIN usuarios AS U ON F.UsuarioID = U.id
                WHERE F.FormularioID = ?
            """
            cursor.execute(consulta_formulario, formulario_id)
            formulario = cursor.fetchone()

            if not formulario:
                print(f"Formulario con ID {formulario_id} no encontrado.")                
                return {"error": "Formulario no encontrado"}

            print(f"Datos del formulario: {formulario}")

            formulario_dict = {
                "Usuario": formulario.usuario,
                "FormularioID": formulario.FormularioID,
                "Estado": formulario.Estado,
                "FechaCreacion": formulario.FechaCreacion,
                "UsuarioID": formulario.UsuarioID

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
        print(f"Error en fetch_formulario_por_id: {str(e)}")
        return {"error": f"Error al obtener el formulario: {str(e)}"}

def eliminar_detalles_formulario(detalle_ids):

    try:
        if not detalle_ids:
            return {"message": "No hay registros para eliminar"}
        
        consulta_eliminar = "DELETE FROM FormularioData WHERE DetalleID IN ({})".format(
            ",".join("?" * len(detalle_ids))
        )
        
        with pyodbc.connect(conexion_string) as conexion:
            cursor = conexion.cursor()
            cursor.execute(consulta_eliminar, tuple(detalle_ids))
            conexion.commit()
            
        return {"message": "Registros eliminados correctamente"}
    except Exception as e:
        return {"error": f"Error al eliminar los registros: {str(e)}"}
    
def eliminar_formulario_si_vacio(formulario_id):
    try:
        with pyodbc.connect(conexion_string) as conexion:
            cursor = conexion.cursor()

            # Verificar si el formulario tiene registros asociados en FormularioData
            consulta_verificar = """
                SELECT COUNT(*) AS total
                FROM FormularioData
                WHERE FormularioID = ?
            """
            cursor.execute(consulta_verificar, formulario_id)
            total_registros = cursor.fetchone().total

            # Si no hay registros, eliminar el formulario
            if total_registros == 0:
                consulta_eliminar = """
                    DELETE FROM Formulario
                    WHERE FormularioID = ?
                """
                cursor.execute(consulta_eliminar, formulario_id)
                conexion.commit()
                return {"message": "Formulario eliminado porque no tiene registros asociados"}

            return {"message": "El formulario aún tiene registros asociados"}
    except Exception as e:
        return {"error": f"Error al verificar y eliminar el formulario: {str(e)}"}

def fetch_formularios_por_fecha():
    try:
        with pyodbc.connect(conexion_string) as conexion:
            cursor = conexion.cursor()
            consulta = """
                SELECT 
                    FORMAT(FechaCreacion, 'yyyy-MM-dd') AS Fecha,
                    COUNT(*) AS Total
                FROM Formulario
                GROUP BY FORMAT(FechaCreacion, 'yyyy-MM-dd')
                ORDER BY Fecha ASC
            """
            cursor.execute(consulta)
            filas = cursor.fetchall()

            datos = [{"fecha": fila.Fecha, "total": fila.Total} for fila in filas]
            return datos
    except Exception as e:
        return {"error": f"Error al obtener formularios por fecha: {str(e)}"}