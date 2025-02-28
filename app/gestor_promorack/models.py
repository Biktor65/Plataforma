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

def guardar_formulario(data):
    try:
        conexion = pyodbc.connect(conexion_string)
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
        VALUES (?, ?, ?, ?, ?, ?, ?,?)
        """
        for detalle in data['Detalles']:
            cursor.execute(
                consulta_detalle,
                formulario_id,
                detalle.get('Centro'),
                detalle.get('JefeZona'),
                detalle.get('Ruta'),
                detalle.get('CODCliente'),
                detalle.get('Nombre_de_Cliente'),
                detalle.get('Nombre_de_Negocio'),
                detalle.get('Cluster')
            )

        conexion.commit()
        conexion.close()
        return {"message": "Formulario guardado correctamente"}
    except Exception as e:
        return {"error": f"Error al guardar el formulario: {e}"}

def actualizar_estado_formulario(formulario_id, estado):
    try:
        conexion = pyodbc.connect(conexion_string)
        cursor = conexion.cursor()

        # Actualiza el estado en la tabla Formulario
        consulta = """
        UPDATE Formulario
        SET Estado = ?
        WHERE FormularioID = ?
        """
        cursor.execute(consulta, estado, formulario_id)

        conexion.commit()
        conexion.close()
        return {"message": "Estado actualizado correctamente"}
    except Exception as e:
        return {"error": f"Error al actualizar el estado: {e}"}

def fetch_promorack_data_for_dashboard():
    try:
        # Conectar a la base de datos
        conexion = pyodbc.connect(conexion_string)
        
        # Consulta SQL para obtener los datos necesarios
        consulta = """
        SELECT 
            FASE, 
            PRODUCTOS, 
            FECHA_INICIO, 
            FECHA_FIN, 
            AÑO, 
            CENTRO, 
            CATEGORÍA, 
            PRODUCTO, 
            COD_CLIENTE, 
            NOMBRE_NEGOCIO, 
            AA, 
            AACT, 
            SEGMENTACION, 
            RUTA, 
            JEFEZONA, 
            ESTADO_COMPRA, 
            CLIENTES_NEGATIVOS, 
            DESCUENTOS
        FROM 
            Promorack2024
        """
        
        cursor = conexion.cursor()
        cursor.execute(consulta)
        filas = cursor.fetchall()
        
        # Convertir a una lista de diccionarios
        datos = []
        for fila in filas:
            datos.append({
                "FASE": fila.FASE,
                "PRODUCTOS": fila.PRODUCTOS,
                "FECHA_INICIO": fila.FECHA_INICIO,
                "FECHA_FIN": fila.FECHA_FIN,
                "AÑO": fila.AÑO,
                "CENTRO": fila.CENTRO,
                "CATEGORÍA": fila.CATEGORÍA,
                "PRODUCTO": fila.PRODUCTO,
                "COD_CLIENTE": fila.COD_CLIENTE,
                "NOMBRE_NEGOCIO": fila.NOMBRE_NEGOCIO,
                "AA": fila.AA,
                "AACT": fila.AACT,
                "SEGMENTACION": fila.SEGMENTACION,
                "RUTA": fila.RUTA,
                "JEFEZONA": fila.JEFEZONA,
                "ESTADO_COMPRA": fila.ESTADO_COMPRA,
                "CLIENTES_NEGATIVOS": fila.CLIENTES_NEGATIVOS,
                "DESCUENTOS": fila.DESCUENTOS
            })
        
        conexion.close()
        return datos
    except Exception as e:
        return f"Error al descargar los datos de SQL: {e}"