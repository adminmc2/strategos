#!/usr/bin/env python3
"""Diagrama de procesos del proyecto - Strategos.

Genera dashboard de gestión de agentes desde la BD.
Uso: python3 diagrama.py -> http://127.0.0.1:4567
"""

import datetime
import http.server
import json
import os
import re
import shutil
import subprocess
import sys
import threading
import time
import uuid
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))

PROJECT = Path(__file__).parent
PORT = 4567
SERVER_VERSION = "2.1.0"

# --- Langfuse client (para API de trazas) ---
_langfuse_client = None
if os.environ.get("LANGFUSE_PUBLIC_KEY"):
    try:
        from langfuse import Langfuse
        _langfuse_client = Langfuse()
        print("[Langfuse] API de trazas disponible")
    except Exception as e:
        print(f"[Langfuse] No disponible: {e}")

DATABASE_URL = os.environ.get("DATABASE_URL", "")


def _db():
    return psycopg2.connect(DATABASE_URL)


# ─────────────────────────────────────────────────
#  CRUD: crew_agents
# ─────────────────────────────────────────────────

def get_crews():
    """Autodiscover all crews from BD."""
    conn = _db()
    cur = conn.cursor()
    cur.execute("SELECT DISTINCT crew FROM crew_agents ORDER BY crew")
    crews = [r[0] for r in cur.fetchall()]
    conn.close()
    return crews


def get_crew_agents(crew_name):
    conn = _db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        SELECT id, crew, agent_key, agent_order, role, goal, backstory,
               task_description, task_expected_output, max_iter,
               llm_model, llm_temperature, llm_max_tokens, llm_top_p,
               updated_at
        FROM crew_agents
        WHERE crew = %s
        ORDER BY agent_order
    """, (crew_name,))
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows


def update_crew_agent(agent_id, data):
    allowed = {"role", "goal", "backstory", "task_description",
               "task_expected_output", "max_iter",
               "llm_model", "llm_temperature", "llm_max_tokens", "llm_top_p"}
    fields = {k: v for k, v in data.items() if k in allowed}
    if not fields:
        return False
    conn = _db()
    cur = conn.cursor()
    set_clause = ", ".join(f"{k} = %s" for k in fields)
    values = list(fields.values()) + [agent_id]
    cur.execute(
        f"UPDATE crew_agents SET {set_clause}, updated_at = NOW() WHERE id = %s",
        values,
    )
    ok = cur.rowcount > 0
    conn.commit()
    conn.close()
    return ok


# ─────────────────────────────────────────────────
#  CRUD: correcciones
# ─────────────────────────────────────────────────

def get_correcciones(agent_key=None):
    conn = _db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    if agent_key:
        cur.execute("""
            SELECT id, agente, unidad, palabra, campo, valor_original,
                   valor_corregido, tipo_error, fecha
            FROM correcciones WHERE agente = %s ORDER BY fecha DESC
        """, (agent_key,))
    else:
        cur.execute("""
            SELECT id, agente, unidad, palabra, campo, valor_original,
                   valor_corregido, tipo_error, fecha
            FROM correcciones ORDER BY fecha DESC LIMIT 100
        """)
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows


def insert_correccion(data):
    conn = _db()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO correcciones (agente, unidad, palabra, campo,
                                  valor_original, valor_corregido, tipo_error)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        RETURNING id
    """, (
        data.get("agente", "lucapi"),
        data.get("unidad"),
        data.get("palabra"),
        data.get("campo"),
        data.get("valor_original"),
        data.get("valor_corregido"),
        data.get("tipo_error"),
    ))
    new_id = cur.fetchone()[0]
    conn.commit()
    conn.close()
    return new_id


def get_correcciones_stats(agent_key=None):
    conn = _db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    if agent_key:
        cur.execute("""
            SELECT tipo_error, COUNT(*) as total,
                   array_agg(DISTINCT palabra) as palabras
            FROM correcciones WHERE agente = %s
            GROUP BY tipo_error ORDER BY total DESC
        """, (agent_key,))
    else:
        cur.execute("""
            SELECT tipo_error, COUNT(*) as total,
                   array_agg(DISTINCT palabra) as palabras
            FROM correcciones
            GROUP BY tipo_error ORDER BY total DESC
        """)
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows


# ─────────────────────────────────────────────────
#  CRUD: reglas_aprendidas
# ─────────────────────────────────────────────────

def get_reglas(crew=None):
    conn = _db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        SELECT id, crew, tipo_error, regla, ejemplos, n_correcciones, activa,
               created_at, updated_at
        FROM reglas_aprendidas
        WHERE crew = %s
        ORDER BY activa DESC, n_correcciones DESC
    """, (crew,))
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows


def upsert_regla(data):
    conn = _db()
    cur = conn.cursor()
    regla_id = data.get("id")
    if regla_id:
        cur.execute("""
            UPDATE reglas_aprendidas
            SET tipo_error = %s, regla = %s, ejemplos = %s,
                n_correcciones = %s, activa = %s, updated_at = NOW()
            WHERE id = %s RETURNING id
        """, (
            data["tipo_error"], data["regla"], data.get("ejemplos", ""),
            data.get("n_correcciones", 0), data.get("activa", True), regla_id
        ))
    else:
        cur.execute("""
            INSERT INTO reglas_aprendidas (crew, tipo_error, regla, ejemplos, n_correcciones, activa)
            VALUES (%s, %s, %s, %s, %s, %s) RETURNING id
        """, (
            data.get("crew", "lucapi"), data["tipo_error"], data["regla"],
            data.get("ejemplos", ""), data.get("n_correcciones", 0),
            data.get("activa", True)
        ))
    regla_id = cur.fetchone()[0]
    conn.commit()
    conn.close()
    return regla_id


def delete_regla(regla_id):
    conn = _db()
    cur = conn.cursor()
    cur.execute("DELETE FROM reglas_aprendidas WHERE id = %s", (regla_id,))
    conn.commit()
    conn.close()


# ─────────────────────────────────────────────────
#  CRUD: evaluaciones
# ─────────────────────────────────────────────────

def get_evaluaciones(agent_key=None):
    conn = _db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    if agent_key:
        cur.execute("""
            SELECT id, run_id, unidad, modelo, prompt_version,
                   total_tarjetas, metricas, duracion_s,
                   tokens_input, tokens_output, coste_usd, fecha
            FROM evaluaciones WHERE modelo LIKE %s ORDER BY fecha DESC LIMIT 50
        """, (f"%{agent_key}%",))
    else:
        cur.execute("""
            SELECT id, run_id, unidad, modelo, prompt_version,
                   total_tarjetas, metricas, duracion_s,
                   tokens_input, tokens_output, coste_usd, fecha
            FROM evaluaciones ORDER BY fecha DESC LIMIT 50
        """)
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows


# ─────────────────────────────────────────────────
#  Langfuse: trazas
# ─────────────────────────────────────────────────

def get_trazas(limit=20):
    if not _langfuse_client:
        return {"error": "Langfuse no configurado", "trazas": []}
    try:
        traces = _langfuse_client.api.trace.list(limit=limit)
        result = []
        for t in traces.data:
            result.append({
                "id": t.id,
                "name": t.name,
                "timestamp": str(t.timestamp) if t.timestamp else None,
                "latency": t.latency,
                "total_cost": t.total_cost,
                "input": str(t.input)[:200] if t.input else None,
                "output": str(t.output)[:500] if t.output else None,
                "metadata": t.metadata,
                "tags": t.tags,
                "observations_count": len(t.observations) if t.observations else 0,
            })
        return {"trazas": result, "total": len(result)}
    except Exception as e:
        return {"error": str(e), "trazas": []}


def get_traza_detalle(trace_id):
    if not _langfuse_client:
        return {"error": "Langfuse no configurado"}
    try:
        t = _langfuse_client.api.trace.get(trace_id)
        observations = []
        for obs in (t.observations or []):
            observations.append({
                "id": obs.id,
                "type": obs.type,
                "name": obs.name,
                "start_time": str(obs.start_time) if obs.start_time else None,
                "end_time": str(obs.end_time) if obs.end_time else None,
                "latency": obs.latency,
                "input": str(obs.input)[:500] if obs.input else None,
                "output": str(obs.output)[:500] if obs.output else None,
                "level": obs.level,
                "status_message": obs.status_message,
                "usage": obs.usage.model_dump() if obs.usage else None,
                "total_cost": obs.calculated_total_cost,
                "parent_id": obs.parent_observation_id,
            })
        observations.sort(key=lambda x: x["start_time"] or "")
        return {
            "id": t.id,
            "name": t.name,
            "timestamp": str(t.timestamp) if t.timestamp else None,
            "latency": t.latency,
            "total_cost": t.total_cost,
            "input": str(t.input)[:1000] if t.input else None,
            "output": str(t.output)[:2000] if t.output else None,
            "observations": observations,
        }
    except Exception as e:
        return {"error": str(e)}


# ─────────────────────────────────────────────────
#  Ejecución de agentes en background
# ─────────────────────────────────────────────────

_agent_runs = {}  # run_id -> {status, agente, modelo, output, start_time, end_time}

# Crew runners are autodiscovered: scripts/crewai/{crew_name}.py
# No hardcoded mapping needed.

AVAILABLE_MODELS = [
    # --- Groq ---
    {"id": "groq/openai/gpt-oss-120b", "name": "GPT OSS 120B", "provider": "groq",
     "cost": "$0.15/$0.60", "ctx": "131K", "vision": False, "function_calling": True,
     "reasoning": True, "multilingual": True},
    {"id": "groq/openai/gpt-oss-20b", "name": "GPT OSS 20B", "provider": "groq",
     "cost": "$0.075/$0.30", "ctx": "131K", "vision": False, "function_calling": True,
     "reasoning": True, "multilingual": True},
    {"id": "groq/meta-llama/llama-4-scout-17b-16e-instruct", "name": "Llama 4 Scout 17B", "provider": "groq",
     "cost": "$0.11/$0.34", "ctx": "131K", "vision": True, "function_calling": True,
     "reasoning": False, "multilingual": True},
    {"id": "groq/llama-3.3-70b-versatile", "name": "Llama 3.3 70B", "provider": "groq",
     "cost": "$0.59/$0.79", "ctx": "131K", "vision": False, "function_calling": False,
     "reasoning": False, "multilingual": True},
    {"id": "groq/llama-3.1-8b-instant", "name": "Llama 3.1 8B", "provider": "groq",
     "cost": "$0.05/$0.08", "ctx": "131K", "vision": False, "function_calling": True,
     "reasoning": False, "multilingual": True},
    {"id": "groq/qwen/qwen3-32b", "name": "Qwen 3 32B", "provider": "groq",
     "cost": "$0.29/$0.59", "ctx": "131K", "vision": False, "function_calling": True,
     "reasoning": True, "multilingual": True},
    # --- DeepSeek ---
    {"id": "deepseek/deepseek-chat", "name": "DeepSeek V3", "provider": "deepseek",
     "cost": "$0.27/$1.10", "ctx": "64K", "vision": False, "function_calling": True,
     "reasoning": False, "multilingual": True},
    {"id": "deepseek/deepseek-reasoner", "name": "DeepSeek R1", "provider": "deepseek",
     "cost": "$0.55/$2.19", "ctx": "64K", "vision": False, "function_calling": False,
     "reasoning": True, "multilingual": True},
    # --- Anthropic ---
    {"id": "anthropic/claude-sonnet-4-20250514", "name": "Claude Sonnet 4", "provider": "anthropic",
     "cost": "$3/$15", "ctx": "200K", "vision": True, "function_calling": True,
     "reasoning": True, "multilingual": True},
    {"id": "anthropic/claude-haiku-4-5-20251001", "name": "Claude Haiku 4.5", "provider": "anthropic",
     "cost": "$0.80/$4", "ctx": "200K", "vision": True, "function_calling": True,
     "reasoning": False, "multilingual": True},
]


def get_modelos():
    """Return model catalog with availability based on configured API keys."""
    api_keys = {
        "groq": bool(os.environ.get("GROQ_API_KEY")),
        "deepseek": bool(os.environ.get("DEEPSEEK_API_KEY")),
        "anthropic": bool(os.environ.get("ANTHROPIC_API_KEY")),
    }
    result = []
    for m in AVAILABLE_MODELS:
        m_copy = dict(m)
        m_copy["available"] = api_keys.get(m["provider"], False)
        result.append(m_copy)
    return result


def start_agent(agente, agent_key, agents_cfg):
    """Lanza un crew en un subproceso. Devuelve run_id.
    agente: crew name (e.g. 'lucapi'). Script autodiscovered as scripts/crewai/{agente}.py
    agent_key: optional, to run a single agent within the crew.
    agents_cfg: ignored (LLM config now comes from BD).
    """
    script_path = (PROJECT / "scripts" / "crewai" / f"{agente}.py").resolve()
    if not script_path.exists():
        return {"error": f"Script '{agente}.py' not found in scripts/crewai/"}

    run_id = str(uuid.uuid4())[:8]
    cmd = [sys.executable, str(script_path)]
    if agent_key:
        cmd.append(agent_key)
    env = os.environ.copy()
    env["PYTHONUNBUFFERED"] = "1"

    modelo_display = "from BD"
    cwd = str(script_path.parent)

    _agent_runs[run_id] = {
        "status": "running",
        "agente": agente,
        "agent_key": agent_key,
        "modelo": modelo_display,
        "agents_cfg": agents_cfg if isinstance(agents_cfg, dict) else {},
        "output": "",
        "start_time": time.time(),
        "end_time": None,
    }

    def _run():
        try:
            proc = subprocess.Popen(
                cmd, env=env, cwd=cwd,
                stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                text=True, bufsize=1,
            )
            deadline = time.time() + 600
            for line in proc.stdout:
                _agent_runs[run_id]["output"] += line
                if time.time() > deadline:
                    proc.kill()
                    _agent_runs[run_id]["output"] += "\nTimeout: el agente tardó más de 10 minutos\n"
                    break
            proc.wait(timeout=10)
            _agent_runs[run_id]["status"] = "completed" if proc.returncode == 0 else "error"
        except Exception as e:
            _agent_runs[run_id]["output"] += f"\nError: {e}\n"
            _agent_runs[run_id]["status"] = "error"
        _agent_runs[run_id]["end_time"] = time.time()

    threading.Thread(target=_run, daemon=True).start()
    return {"run_id": run_id, "status": "running"}


def get_agent_status(run_id=None):
    if run_id:
        run = _agent_runs.get(run_id)
        if not run:
            return {"error": "run_id no encontrado"}
        elapsed = (run["end_time"] or time.time()) - run["start_time"]
        return {**run, "run_id": run_id, "elapsed_s": round(elapsed, 1)}
    runs = []
    for rid, r in sorted(_agent_runs.items(), key=lambda x: x[1]["start_time"], reverse=True):
        elapsed = (r["end_time"] or time.time()) - r["start_time"]
        runs.append({
            "run_id": rid,
            "status": r["status"],
            "agente": r["agente"],
            "agent_key": r.get("agent_key"),
            "modelo": r["modelo"],
            "elapsed_s": round(elapsed, 1),
            "start_time": r["start_time"],
        })
    return {"runs": runs[:20]}


# ─────────────────────────────────────────────────
#  Tool source editor
# ─────────────────────────────────────────────────

TOOLS_FILE = PROJECT / "scripts" / "crewai" / "tools.py"
TOOL_VERSIONS_FILE = PROJECT / "scripts" / "crewai" / "tool_versions.json"
TOOLS_BACKUP = PROJECT / "scripts" / "crewai" / "tools.py.backup"


def get_tool_sources():
    if not TOOLS_FILE.exists():
        return {}
    text = TOOLS_FILE.read_text(encoding="utf-8")
    parts = re.split(r"(?=^class \w+\(BaseTool\))", text, flags=re.MULTILINE)
    result = {}
    for part in parts:
        m = re.search(r'name:\s*str\s*=\s*["\'](\w+)["\']', part)
        if m:
            result[m.group(1)] = part.strip()
    return result


def get_tool_versions():
    if TOOL_VERSIONS_FILE.exists():
        return json.loads(TOOL_VERSIONS_FILE.read_text(encoding="utf-8"))
    sources = get_tool_sources()
    versions = {}
    for name in sources:
        versions[name] = {"version": 1, "updated_at": None}
    TOOL_VERSIONS_FILE.write_text(
        json.dumps(versions, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    return versions


def save_tool_source(tool_name, new_source):
    if not TOOLS_FILE.exists():
        return False, "tools.py not found"

    text = TOOLS_FILE.read_text(encoding="utf-8")
    parts = re.split(r"(?=^class \w+\(BaseTool\))", text, flags=re.MULTILINE)

    preamble = parts[0]
    classes = parts[1:]

    target_idx = None
    for i, part in enumerate(classes):
        m = re.search(r'name:\s*str\s*=\s*["\'](\w+)["\']', part)
        if m and m.group(1) == tool_name:
            target_idx = i
            break

    if target_idx is None:
        return False, f"Tool '{tool_name}' not found in tools.py"

    classes[target_idx] = new_source.strip()

    reconstructed = preamble.rstrip("\n") + "\n\n\n" + "\n\n\n".join(
        c.strip() for c in classes
    ) + "\n"

    try:
        compile(reconstructed, "tools.py", "exec")
    except SyntaxError as e:
        return False, f"Error de sintaxis: {e.msg} (línea {e.lineno})"

    recheck = re.split(r"(?=^class \w+\(BaseTool\))", reconstructed, flags=re.MULTILINE)
    if len(recheck) - 1 != len(classes):
        return False, "La estructura de clases cambió — operación cancelada"

    shutil.copy2(TOOLS_FILE, TOOLS_BACKUP)
    TOOLS_FILE.write_text(reconstructed, encoding="utf-8")

    versions = get_tool_versions()
    tv = versions.get(tool_name, {"version": 0, "updated_at": None})
    tv["version"] += 1
    tv["updated_at"] = datetime.datetime.now().isoformat()
    versions[tool_name] = tv
    TOOL_VERSIONS_FILE.write_text(
        json.dumps(versions, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    return True, tv["version"]


# ─────────────────────────────────────────────────
#  HTML
# ─────────────────────────────────────────────────

HTML_FILE = PROJECT / "web" / "index.html"


def load_html_template():
    return HTML_FILE.read_text(encoding="utf-8")


# ─────────────────────────────────────────────────
#  HTTP Handler
# ─────────────────────────────────────────────────

class Handler(http.server.BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        if os.environ.get("DEBUG"):
            print(fmt % args)

    def _respond(self, code, ctype, body):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(body.encode("utf-8"))

    def do_GET(self):
        parsed = urlparse(self.path)
        qs = parse_qs(parsed.query)

        if parsed.path == "/api/version":
            self._respond(200, "application/json; charset=utf-8",
                          json.dumps({"version": SERVER_VERSION}))

        elif parsed.path == "/api/crews":
            self._respond(200, "application/json; charset=utf-8",
                          json.dumps(get_crews(), ensure_ascii=False, default=str))

        elif parsed.path == "/api/crew_agents":
            crew = qs.get("crew", [None])[0]
            if not crew:
                crews = get_crews()
                crew = crews[0] if crews else "lucapi"
            self._respond(200, "application/json; charset=utf-8",
                          json.dumps(get_crew_agents(crew), ensure_ascii=False, default=str))

        elif parsed.path == "/api/correcciones":
            agent_key = qs.get("agent_key", [None])[0]
            self._respond(200, "application/json; charset=utf-8",
                          json.dumps(get_correcciones(agent_key), ensure_ascii=False, default=str))

        elif parsed.path == "/api/correcciones/stats":
            agent_key = qs.get("agent_key", [None])[0]
            self._respond(200, "application/json; charset=utf-8",
                          json.dumps(get_correcciones_stats(agent_key), ensure_ascii=False, default=str))

        elif parsed.path == "/api/reglas":
            crew = qs.get("crew", [None])[0]
            self._respond(200, "application/json; charset=utf-8",
                          json.dumps(get_reglas(crew), ensure_ascii=False, default=str))

        elif parsed.path == "/api/evaluaciones":
            agent_key = qs.get("agent_key", [None])[0]
            self._respond(200, "application/json; charset=utf-8",
                          json.dumps(get_evaluaciones(agent_key), ensure_ascii=False, default=str))

        elif parsed.path == "/api/agente/status":
            run_id = qs.get("run_id", [None])[0]
            self._respond(200, "application/json; charset=utf-8",
                          json.dumps(get_agent_status(run_id), ensure_ascii=False, default=str))

        elif parsed.path == "/api/agente/output":
            run_id = qs.get("run_id", [""])[0]
            run = _agent_runs.get(run_id, {})
            self._respond(200, "application/json; charset=utf-8",
                          json.dumps({"output": run.get("output", ""), "status": run.get("status", "unknown")}, default=str))

        elif parsed.path == "/api/modelos":
            self._respond(200, "application/json; charset=utf-8",
                          json.dumps(get_modelos(), ensure_ascii=False))

        elif parsed.path == "/api/tool_sources":
            sources = get_tool_sources()
            versions = get_tool_versions()
            merged = {}
            for name, src in sources.items():
                v = versions.get(name, {"version": 1, "updated_at": None})
                merged[name] = {"source": src, "version": v["version"],
                                "updated_at": v["updated_at"]}
            self._respond(200, "application/json; charset=utf-8",
                          json.dumps(merged, ensure_ascii=False))

        elif parsed.path == "/api/trazas":
            limit = int(qs.get("limit", [20])[0])
            self._respond(200, "application/json; charset=utf-8",
                          json.dumps(get_trazas(limit), ensure_ascii=False, default=str))

        elif parsed.path.startswith("/api/trazas/"):
            trace_id = parsed.path.split("/api/trazas/")[1]
            self._respond(200, "application/json; charset=utf-8",
                          json.dumps(get_traza_detalle(trace_id), ensure_ascii=False, default=str))

        elif parsed.path in ("/favicon.ico", "/favicon.svg", "/web/favicon.svg"):
            svg_path = PROJECT / "web" / "favicon.svg"
            if svg_path.exists():
                self._respond(200, "image/svg+xml", svg_path.read_text(encoding="utf-8"))
            else:
                self.send_response(204)
                self.end_headers()

        elif parsed.path == "/":
            html = load_html_template()
            self._respond(200, "text/html; charset=utf-8", html)

        else:
            self.send_error(404)

    def do_POST(self):
        parsed = urlparse(self.path)
        length = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(length)) if length else {}

        if parsed.path == "/api/crew_agents/update":
            agent_id = body.get("id")
            ok = update_crew_agent(agent_id, body)
            self._respond(200, "application/json; charset=utf-8",
                          json.dumps({"ok": ok}))

        elif parsed.path == "/api/correcciones":
            new_id = insert_correccion(body)
            self._respond(200, "application/json; charset=utf-8",
                          json.dumps({"id": new_id, "ok": True}))

        elif parsed.path == "/api/reglas":
            regla_id = upsert_regla(body)
            self._respond(200, "application/json; charset=utf-8",
                          json.dumps({"id": regla_id, "ok": True}))

        elif parsed.path == "/api/reglas/delete":
            delete_regla(body["id"])
            self._respond(200, "application/json; charset=utf-8",
                          json.dumps({"ok": True}))

        elif parsed.path == "/api/tool_sources/update":
            tool_name = body.get("tool_name", "")
            source = body.get("source", "")
            ok, result = save_tool_source(tool_name, source)
            if ok:
                self._respond(200, "application/json; charset=utf-8",
                              json.dumps({"ok": True, "version": result}))
            else:
                self._respond(400, "application/json; charset=utf-8",
                              json.dumps({"ok": False, "error": result}, ensure_ascii=False))

        elif parsed.path == "/api/agente/run":
            agente = body.get("agente", "lucapi")
            agent_key = body.get("agent_key")
            agents_cfg = body.get("agents", body.get("modelo", {}))
            result = start_agent(agente, agent_key, agents_cfg)
            self._respond(200, "application/json; charset=utf-8",
                          json.dumps(result, ensure_ascii=False, default=str))

        else:
            self.send_error(404)


if __name__ == "__main__":
    HOST = os.environ.get("HOST", "0.0.0.0")
    PORT = int(os.environ.get("PORT", PORT))
    server = http.server.HTTPServer((HOST, PORT), Handler)
    print(f"AgentIAELE Dashboard: http://{HOST}:{PORT}")
    print("En vivo - se actualiza cada 3 segundos")
    print("Ctrl+C para detener")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nDetenido.")
