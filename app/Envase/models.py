import pyodbc
import os
from dotenv import load_dotenv

load_dotenv()

conexion_string = (    
    f"DRIVER={{{os.getenv('DRIVER')}}};"
    f"SERVER={os.getenv('SERVER')};"
    f"DATABASE={os.getenv('DATABASE')};"
    f"Trusted_Connection={os.getenv('Trusted_Connection')};"
    )

def fetch_data_from_sql():
    try:
        # Conectar a la base de datos
        conexion = pyodbc.connect(conexion_string)
        
        # Consulta SQL
        consulta = """
        SELECT DISTINCT(C.CODCliente), NombreClienteLegal, NombreComercial, NumeroIdentidadCliente, DirecciónNegocio 
        FROM Clientes C
        JOIN VentaMensual V ON V.CODCliente = C.CODCliente 
        JOIN Territorios T ON T.CODTerritorio = V.CODTerritorio
        WHERE T.Zona = '01#Zona Metro' AND V.Año='2024'
        """
        
        # Ejecutar consulta y guardar resultados
        cursor = conexion.cursor()
        cursor.execute(consulta)
        filas = cursor.fetchall()
        
        # Crear lista de diccionarios
        clientes = []
        for fila in filas:
            clientes.append({
                "CODCliente": fila.CODCliente,
                "NombreClienteLegal": fila.NombreClienteLegal,
                "NombreComercial": fila.NombreComercial,
                "NumeroIdentidadCliente": fila.NumeroIdentidadCliente,
                "DireccionNegocio": fila.DirecciónNegocio
            })
        
        # Cerrar conexión
        conexion.close()
        return clientes
    except Exception as e:
        return f"Error al descargar los datos de SQL: {e}"
