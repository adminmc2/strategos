"""
Tools custom para agentes CrewAI — acceso a Neon PostgreSQL.
Todas las tools operan contra la BD (arquitectura BD-first).
"""

import json
import os

import psycopg2
from psycopg2.extras import Json, RealDictCursor
from crewai.tools import BaseTool
from pydantic import Field

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "",
)


def _get_conn():
    return psycopg2.connect(DATABASE_URL)


class ConsultarReglas(BaseTool):
    name: str = "consultar_reglas"
    description: str = (
        "Retrieves learned rules distilled from accumulated corrections. "
        "These are general patterns that MUST be applied to ALL interactions. "
        "Rules take priority over any default behavior. "
        "Parámetro: crew name (default: 'strategos')."
    )

    def _run(self, crew: str = "strategos") -> str:
        conn = _get_conn()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            """
            SELECT tipo_error, regla, ejemplos, n_correcciones
            FROM reglas_aprendidas
            WHERE crew = %s AND activa = true
            ORDER BY n_correcciones DESC
            """,
            (crew,),
        )
        reglas = [dict(r) for r in cur.fetchall()]
        conn.close()
        return json.dumps(
            {"reglas": reglas, "total": len(reglas)},
            ensure_ascii=False,
            default=str,
        )


class ConsultarCorrecciones(BaseTool):
    name: str = "consultar_correcciones"
    description: str = (
        "Recupera correcciones del editor para un agente de Strategos. "
        "Estas correcciones son errores de ejecuciones anteriores que NO debes repetir."
    )

    def _run(self, agente: str = "lucapi") -> str:
        conn = _get_conn()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            """
            SELECT unidad, palabra, campo, valor_original,
                   valor_corregido, tipo_error, fecha
            FROM correcciones
            WHERE agente = %s
            ORDER BY fecha DESC
            LIMIT 50
            """,
            (agente,),
        )
        correcciones = [dict(r) for r in cur.fetchall()]
        conn.close()
        return json.dumps(
            {"correcciones": correcciones, "total": len(correcciones)},
            ensure_ascii=False,
            default=str,
        )


class RegistrarSesion(BaseTool):
    name: str = "registrar_sesion"
    description: str = (
        "Registra una sesión de trabajo del agente con el estudiante. "
        "Guarda en la tabla evaluaciones: agente, texto trabajado, pasos completados, "
        "y métricas de la interacción. "
        "Parámetro: JSON string con datos de la sesión."
    )

    def _run(self, sesion_json: str = "") -> str:
        if not sesion_json:
            return json.dumps({"error": "No se recibieron datos de sesión"})
        sesion = json.loads(sesion_json)

        conn = _get_conn()
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO evaluaciones (
                run_id, unidad, modelo, prompt_version,
                total_tarjetas, metricas, duracion_s,
                tokens_input, tokens_output, coste_usd
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
            RETURNING id
            """,
            (
                sesion.get("run_id"),
                sesion.get("unidad"),
                sesion.get("modelo"),
                sesion.get("prompt_version"),
                sesion.get("total_pasos", 0),
                Json(sesion.get("metricas", {})),
                sesion.get("duracion_s"),
                sesion.get("tokens_input"),
                sesion.get("tokens_output"),
                sesion.get("coste_usd"),
            ),
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        conn.close()
        return json.dumps({"id": new_id, "ok": True})


class ConsultarSesionesPrevias(BaseTool):
    name: str = "consultar_sesiones_previas"
    description: str = (
        "Consulta sesiones previas de un agente para contextualizar la interacción actual. "
        "Permite saber qué textos se han trabajado y qué resultados se obtuvieron. "
        "Parámetro: modelo o agente utilizado."
    )

    def _run(self, modelo: str = "") -> str:
        conn = _get_conn()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        if modelo:
            cur.execute(
                """
                SELECT id, run_id, unidad, modelo, prompt_version,
                       total_tarjetas, metricas, duracion_s, fecha
                FROM evaluaciones
                WHERE modelo = %s
                ORDER BY fecha DESC
                LIMIT 20
                """,
                (modelo,),
            )
        else:
            cur.execute(
                """
                SELECT id, run_id, unidad, modelo, prompt_version,
                       total_tarjetas, metricas, duracion_s, fecha
                FROM evaluaciones
                ORDER BY fecha DESC
                LIMIT 20
                """
            )
        sesiones = [dict(r) for r in cur.fetchall()]
        conn.close()
        return json.dumps(
            {"sesiones": sesiones, "total": len(sesiones)},
            ensure_ascii=False,
            default=str,
        )
