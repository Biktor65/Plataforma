import pyodbc
from werkzeug.security import generate_password_hash, check_password_hash
from app.database import get_db_connection

def obtener_usuario(nom_usuario):
    conexion = get_db_connection()
    cursor=conexion.cursor()
    query = "SELECT id, usuario, contraseña, rol FROM usuarios where usuario =?"
    cursor.execute(query,(nom_usuario,))
    usuario = cursor.fetchone()
    conexion.close()
    return usuario

def verificar_contra(usuario,contraseña):
    return check_password_hash(usuario[2], contraseña)

