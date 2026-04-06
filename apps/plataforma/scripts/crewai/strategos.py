#!/usr/bin/env python3
"""
Crew Strategos — Learning strategy agent pipeline.
Run with: python scripts/crewai/strategos.py [agent_key]

Architecture: N sequential agents, each with its own LLM.
Agent config (role, goal, backstory, task_description, task_expected_output,
max_iter) lives in the crew_agents table in Neon PostgreSQL.
Tools and LLM params stay in code / env vars.
"""

import os
import sys
import time

import psycopg2
from dotenv import load_dotenv
load_dotenv()

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

# --- LLMs (configurable per agent via env vars) ---
# Default: all agents use DeepSeek (affordable, good quality)
# Override with STRATEGOS_LLM_<KEY>, STRATEGOS_TEMP_<KEY>, etc.
DEFAULT_MODEL = os.environ.get("STRATEGOS_LLM", "deepseek/deepseek-chat")
DEFAULT_TEMP = float(os.environ.get("STRATEGOS_TEMP", "0.5"))
DEFAULT_MAXTOK = int(os.environ.get("STRATEGOS_MAXTOK", "4096"))
DEFAULT_TOPP = float(os.environ.get("STRATEGOS_TOPP", "1.0"))

# --- Tools by agent_key (stays in code, not in BD) ---
TOOLS_MAP = {
    "lucapi": [
        ConsultarReglas(),
        ConsultarCorrecciones(),
        ConsultarSesionesPrevias(),
        RegistrarSesion(),
    ],
}


def _get_llm_config(agent_key: str) -> dict:
    """Build LLM config for an agent from env vars, with fallback to defaults."""
    key = agent_key.upper()
    return {
        "model": os.environ.get(f"STRATEGOS_LLM_{key}", DEFAULT_MODEL),
        "max_tokens": int(os.environ.get(f"STRATEGOS_MAXTOK_{key}", str(DEFAULT_MAXTOK))),
        "temperature": float(os.environ.get(f"STRATEGOS_TEMP_{key}", str(DEFAULT_TEMP))),
        "top_p": float(os.environ.get(f"STRATEGOS_TOPP_{key}", str(DEFAULT_TOPP))),
    }


def cargar_config_bd(crew_name: str) -> list[dict]:
    """Load agent configs from crew_agents table, ordered by agent_order."""
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()
    cur.execute(
        "SELECT agent_key, agent_order, role, goal, backstory, "
        "task_description, task_expected_output, max_iter "
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


def crear_crew(agent_key: str = None) -> Crew:
    """Build agents, tasks and Crew from BD config + code-level tools/LLMs.
    If agent_key is specified, only that agent runs (single-agent crew).
    """
    configs = cargar_config_bd("strategos")

    if agent_key:
        configs = [c for c in configs if c["agent_key"] == agent_key]
        if not configs:
            raise RuntimeError(f"Agent '{agent_key}' not found in crew strategos")

    agents = []
    tasks = []
    prev_task = None

    for cfg in configs:
        key = cfg["agent_key"]
        llm_cfg = _get_llm_config(key)
        llm = LLM(**llm_cfg)

        agent = Agent(
            name=f"strategos_{key}",
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
    agent_key = sys.argv[1] if len(sys.argv) > 1 else None
    t0 = time.time()

    configs = cargar_config_bd("strategos")
    if agent_key:
        configs = [c for c in configs if c["agent_key"] == agent_key]

    print(f"\n{'='*70}")
    print(f"  CREW STRATEGOS")
    if agent_key:
        print(f"  Agent: {agent_key}")
    print(f"  Agents: {', '.join(c['agent_key'] for c in configs)}")
    for cfg in configs:
        llm_cfg = _get_llm_config(cfg["agent_key"])
        print(f"  {cfg['agent_key']}: {llm_cfg['model']}  "
              f"temp={llm_cfg['temperature']}  max={llm_cfg['max_tokens']}")
    print(f"  Config: crew_agents table (Neon PostgreSQL)")
    print(f"{'='*70}\n")

    crew = crear_crew(agent_key)
    resultado = crew.kickoff()
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
    key_label = agent_key or "all"
    output_path = os.path.join(output_dir, f"{key_label}-output.json")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(str(resultado))
    print(f"\nOutput guardado en: {output_path}")
    print(f"Duración: {duracion:.1f}s")

    print("[Langfuse] Trazas enviadas automáticamente via litellm callback")


if __name__ == "__main__":
    main()
