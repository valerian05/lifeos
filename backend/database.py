import os
import asyncpg
import json
from datetime import datetime

# DATABASE_URL is automatically provided by Railway when you add a Postgres plugin
DATABASE_URL = os.environ.get("DATABASE_URL")

async def get_db_connection():
    """Establishes a connection to the PostgreSQL database."""
    if not DATABASE_URL:
        raise Exception("DATABASE_URL environment variable is not set.")
    return await asyncpg.connect(DATABASE_URL)

async def init_db():
    """Initializes the database schema."""
    conn = await get_db_connection()
    try:
        # Table for storing the current state of life metrics (Sensors)
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS life_context (
                id SERIAL PRIMARY KEY,
                key TEXT UNIQUE,
                value TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        # Table for logging the AI's historical analysis and scores
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS life_history (
                id SERIAL PRIMARY KEY,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                insight TEXT,
                score INTEGER
            )
        ''')
    finally:
        await conn.close()

async def update_context(data: dict):
    """Updates or inserts new sensor data into the database."""
    conn = await get_db_connection()
    try:
        for key, value in data.items():
            await conn.execute('''
                INSERT INTO life_context (key, value, updated_at)
                VALUES ($1, $2, $3)
                ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = $3
            ''', key, str(value), datetime.now())
    finally:
        await conn.close()

async def fetch_context():
    """Retrieves all current metrics from the database."""
    conn = await get_db_connection()
    try:
        rows = await conn.fetch('SELECT key, value FROM life_context')
        return {row['key']: row['value'] for row in rows}
    finally:
        await conn.close()

async def log_history(score: int, insight: str):
    """Logs the result of a LifeOS analysis cycle."""
    conn = await get_db_connection()
    try:
        await conn.execute(
            'INSERT INTO life_history (score, insight) VALUES ($1, $2)',
            score, insight
        )
    finally:
        await conn.close()
