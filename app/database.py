import pyodbc
import os
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    conexion_str = pyodbc.connect(    
        f"DRIVER={{{os.getenv('DRIVER')}}};"
        f"SERVER={os.getenv('SERVER')};"
        f"DATABASE={os.getenv('DATABASE')};"
        f"Trusted_Connection={os.getenv('Trusted_Connection')};"
        )
    return conexion_str