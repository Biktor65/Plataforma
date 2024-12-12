import pyodbc
import os
from dotenv import load_dotenv

load_dotenv()

# Configuración de la conexión a SQL Server (puedes reutilizarla)
conexion_string = (    
    f"DRIVER={{{os.getenv('DRIVER')}}};"
    f"SERVER={os.getenv('SERVER')};"
    f"DATABASE={os.getenv('DATABASE')};"
    f"Trusted_Connection={os.getenv('Trusted_Connection')};"
    )

def fetch_promorack_data_from_sql():
    try:
        # Conectar a la base de datos
        conexion = pyodbc.connect(conexion_string)
        
        # Consulta SQL adaptada para el nuevo módulo
        consulta = """
        SELECT
            rt.CODTerritorio,
            t.CD2,	
            c.CODCliente,
            c.NombreComercial,
            c.NombreClienteLegal,
            c.Cluster,
            c.DirecciónNegocio,
            t.JefeZona,
            ac.Descripcion	
        FROM 
            Clientes AS c
        FULL JOIN 
            ReestructuracionTest AS rt ON c.CODCliente = rt.CODCliente
        FULL JOIN 
            Territorios AS t ON rt.CODTerritorio = t.CODTerritorio
        FULL JOIN
            ClienteAccionComercial AS cac on c.CODCliente = cac.CODCLIENTE 
        FULL JOIN
            AccionesComerciales AS ac on cac.CODAccionComercial = ac.CODAccionComercial
        WHERE
            c.Cluster IS NOT NULL
        GROUP BY
            c.CODCliente, c.NombreComercial, c.NombreClienteLegal, c.Cluster, c.DirecciónNegocio, rt.CODTerritorio, t.CD2, t.JefeZona, ac.Descripcion;
        """
        
        cursor = conexion.cursor()
        cursor.execute(consulta)
        filas = cursor.fetchall()
        
        # Convertir a JSON
        clientes = []
        for fila in filas:
            clientes.append({
                "CODTerritorio":fila.CODTerritorio,
                "Centro":fila.CD2,
                "CODCliente": fila.CODCliente,
                "NombreComercial": fila.NombreComercial,
                "NombreClienteLegal": fila.NombreClienteLegal,
                "Cluster":fila.Cluster,
                "DireccionNegocio": fila.DirecciónNegocio,
                "JefeZona":fila.JefeZona,
                "Descripcion":fila.Descripcion
            })
        
        conexion.close()
        return clientes
    except Exception as e:
        return f"Error al descargar los datos de SQL: {e}"
