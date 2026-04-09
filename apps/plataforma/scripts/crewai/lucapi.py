#!/usr/bin/env python3
"""
Crew LUCAPI — Reading comprehension agent pipeline.
Run with: python scripts/crewai/lucapi.py [texto_file]

Architecture: 2 sequential agents, each with its own LLM (from BD).
  Agent 1 (Analizador): analyzes text → produces lesson plan
  Agent 2 (Coach):      interacts with student using the lesson plan

Agent config (role, goal, backstory, task_description, task_expected_output,
max_iter, llm_model, llm_temperature, llm_max_tokens, llm_top_p) lives
in the crew_agents table in Neon PostgreSQL.
Tools stay in code (Python class instances, not serializable).
"""

import os
import sys
import time

import psycopg2
from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parents[4] / ".env")

from crewai import Agent, Task, Crew, Process, LLM
from tools import (
    ConsultarReglas,
    ConsultarCorrecciones,
    RegistrarSesion,
    ConsultarSesionesPrevias,
)

# --- Langfuse (trazabilidad via litellm callback) ---
if os.environ.get("LANGFUSE_PUBLIC_KEY"):
    import litellm
    litellm.success_callback = ["langfuse"]
    litellm.failure_callback = ["langfuse"]
    print("[Langfuse] Trazabilidad ACTIVA — cada llamada LLM se registra en cloud.langfuse.com")
else:
    print("[Langfuse] No configurado — ejecutando sin trazabilidad")

# --- Tools by agent_key (stays in code — class instances, not serializable) ---
TOOLS_MAP = {
    "analizador": [
        ConsultarReglas(),
        ConsultarCorrecciones(),
    ],
    "coach": [
        ConsultarSesionesPrevias(),
        RegistrarSesion(),
    ],
}

# Default LLM values (used when BD columns are NULL)
DEFAULT_LLM = {
    "model": "groq/llama-3.3-70b-versatile",
    "temperature": 0.5,
    "max_tokens": 4096,
    "top_p": 1.0,
}


def cargar_config_bd(crew_name: str) -> list[dict]:
    """Load agent configs from crew_agents table, ordered by agent_order."""
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()
    cur.execute(
        "SELECT agent_key, agent_order, role, goal, backstory, "
        "task_description, task_expected_output, max_iter, "
        "llm_model, llm_temperature, llm_max_tokens, llm_top_p "
        "FROM crew_agents WHERE crew = %s ORDER BY agent_order",
        (crew_name,),
    )
    cols = [d[0] for d in cur.description]
    rows = [dict(zip(cols, row)) for row in cur.fetchall()]
    conn.close()
    if not rows:
        raise RuntimeError(
            f"No agent configs found in crew_agents for crew='{crew_name}'. "
            "Run scripts/crear_crew_agents.py first."
        )
    return rows


def _build_llm(cfg: dict) -> LLM:
    """Build an LLM instance from BD config, with defaults for NULL values."""
    return LLM(
        model=cfg.get("llm_model") or DEFAULT_LLM["model"],
        temperature=cfg.get("llm_temperature") if cfg.get("llm_temperature") is not None else DEFAULT_LLM["temperature"],
        max_tokens=cfg.get("llm_max_tokens") or DEFAULT_LLM["max_tokens"],
        top_p=cfg.get("llm_top_p") if cfg.get("llm_top_p") is not None else DEFAULT_LLM["top_p"],
    )


def crear_crew(agent_key: str = None) -> Crew:
    """Build agents, tasks and Crew from BD config + code-level tools."""
    configs = cargar_config_bd("lucapi")

    if agent_key:
        configs = [c for c in configs if c["agent_key"] == agent_key]
        if not configs:
            raise RuntimeError(f"Agent '{agent_key}' not found in crew lucapi")

    agents = []
    tasks = []
    prev_task = None

    for cfg in configs:
        key = cfg["agent_key"]
        llm = _build_llm(cfg)

        agent = Agent(
            name=f"lucapi_{key}",
            role=cfg["role"],
            goal=cfg["goal"],
            backstory=cfg["backstory"],
            tools=TOOLS_MAP.get(key, []),
            llm=llm,
            verbose=True,
            max_iter=cfg["max_iter"],
        )
        agents.append(agent)

        task = Task(
            description=cfg["task_description"],
            expected_output=cfg["task_expected_output"],
            agent=agent,
            context=[prev_task] if prev_task else [],
        )
        tasks.append(task)
        prev_task = task

    crew = Crew(
        agents=agents,
        tasks=tasks,
        process=Process.sequential,
        verbose=True,
        memory=False,
    )
    return crew


def main():
    # Usage: python lucapi.py [texto_file]
    # Or: echo "texto..." | python lucapi.py
    # Or: LUCAPI_TEXTO="texto..." python lucapi.py
    texto = ""

    # 1. From file argument
    if len(sys.argv) > 1 and os.path.isfile(sys.argv[1]):
        texto = open(sys.argv[1], encoding="utf-8").read().strip()
    # 2. From env var (set by diagrama.py start_agent)
    elif os.environ.get("LUCAPI_TEXTO"):
        texto = os.environ["LUCAPI_TEXTO"]
    # 3. From stdin (non-interactive)
    elif not sys.stdin.isatty():
        texto = sys.stdin.read().strip()

    if not texto:
        print("ERROR: No text provided. Usage:")
        print("  python lucapi.py <texto_file>")
        print("  echo 'texto...' | python lucapi.py")
        print("  LUCAPI_TEXTO='texto...' python lucapi.py")
        sys.exit(1)

    t0 = time.time()
    configs = cargar_config_bd("lucapi")

    print(f"\n{'='*70}")
    print(f"  CREW LUCAPI")
    print(f"  Pipeline: {' → '.join(c['agent_key'] for c in configs)}")
    for cfg in configs:
        model = cfg.get("llm_model") or DEFAULT_LLM["model"]
        temp = cfg.get("llm_temperature") if cfg.get("llm_temperature") is not None else DEFAULT_LLM["temperature"]
        maxt = cfg.get("llm_max_tokens") or DEFAULT_LLM["max_tokens"]
        print(f"  {cfg['agent_key']}: {model}  temp={temp}  max={maxt}")
    print(f"  Texto: {len(texto)} chars")
    print(f"  Config: crew_agents table (Neon PostgreSQL)")
    print(f"{'='*70}\n")

    crew = crear_crew()
    resultado = crew.kickoff(inputs={"texto": texto})
    duracion = time.time() - t0

    print(f"\n{'='*60}")
    print("  RESULTADO")
    print(f"{'='*60}")
    print(resultado)

    # Save raw output
    output_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "datos", "sesiones",
    )
    os.makedirs(output_dir, exist_ok=True)
    key_label = f"lucapi-{int(t0)}"
    output_path = os.path.join(output_dir, f"{key_label}-output.json")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(str(resultado))
    print(f"\nOutput guardado en: {output_path}")
    print(f"Duración: {duracion:.1f}s")

    print("[Langfuse] Trazas enviadas automáticamente via litellm callback")


if __name__ == "__main__":
    main()
