"""Database connection and utility functions."""
import mysql.connector
from mysql.connector import Error
from datetime import datetime, date, time, timedelta


def get_connection(config):
    """Create a new MySQL connection using config."""
    try:
        connection = mysql.connector.connect(
            host=config["DB_HOST"],
            user=config["DB_USER"],
            password=config["DB_PASSWORD"],
            database=config["DB_NAME"],
        )
        print(f"Database connection successful to {config['DB_NAME']} at {config['DB_HOST']}")
        return connection
    except Error as e:
        print(f"Database connection failed: {e}")
        print(f"Attempting to connect to: host={config['DB_HOST']}, user={config['DB_USER']}, database={config['DB_NAME']}")
        raise


def _serialize_value(val):
    """Convert MySQL values to JSON-safe strings."""
    if isinstance(val, (datetime, date, time)):
        return val.isoformat()
    if isinstance(val, timedelta):
        # Represent duration in HH:MM:SS
        total_seconds = int(val.total_seconds())
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        seconds = total_seconds % 60
        return f"{hours:02d}:{minutes:02d}:{seconds:02d}"
    return val


def dict_from_row(cursor, row):
    """Convert a DB row to a dict using cursor column names."""
    return {desc[0]: _serialize_value(value) for desc, value in zip(cursor.description, row)}
