import pyodbc
from werkzeug.security import check_password_hash
from app.database import get_db_connection

def obtener_usuario(nom_usuario):
    conexion = get_db_connection()
    cursor=conexion.cursor()
    query = "SELECT id, usuario, contraseña, rol FROM usuarios where usuario =?"
    cursor.execute(query,(nom_usuario,))
    usuario = cursor.fetchone()
    conexion.close()
    return usuario

def obtener_usuario_por_id(usuario_id):
    conexion = get_db_connection()
    cursor = conexion.cursor()
    query = "SELECT id, usuario, contraseña, rol FROM usuarios WHERE id = ?"
    cursor.execute(query, (usuario_id,))
    usuario = cursor.fetchone()
    conexion.close()
    return usuario

def verificar_contra(usuario, contraseña):
    return usuario[2] == contraseña 

def obtener_perfil(usuario_id):
    conexion = get_db_connection()
    cursor = conexion.cursor()
    query = "SELECT id, usuario FROM usuarios WHERE id = ?"
    cursor.execute(query, (usuario_id,))
    perfil = cursor.fetchone()
    conexion.close()
    return perfil


def actualizar_perfil(usuario_id, datos_a_actualizar):
    conexion = get_db_connection()
    cursor = conexion.cursor()

    # Construimos el query dinámicamente en base a los datos proporcionados
    campos = []
    valores = []

    if "usuario" in datos_a_actualizar:
        campos.append("usuario = ?")
        valores.append(datos_a_actualizar["usuario"])

    if "contraseña" in datos_a_actualizar:
        campos.append("contraseña = ?")
        valores.append(datos_a_actualizar["contraseña"])

    valores.append(usuario_id)

    if campos:
        query = f"UPDATE usuarios SET {', '.join(campos)} WHERE id = ?"
        cursor.execute(query, valores)
        conexion.commit()

    conexion.close()

