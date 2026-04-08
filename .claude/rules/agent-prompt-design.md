---
paths:
  - "apps/plataforma/scripts/**"
  - "apps/plataforma/ui/**"
  - "apps/plataforma/web/**"
---

# CrewAI Agent Prompt Design Methodology

> Auto-loaded when Claude works on agent files.
> Mandatory rules for designing role, goal, backstory, and task description.
> Based on: official CrewAI docs, DeepLearning.AI, Anthropic, and project decisions.

---

## Core principle: the 80/20 rule

> 80% of effort should go into **Task** design. Only 20% into the **Agent**.
> A simple agent with well-designed tasks outperforms a detailed agent with vague tasks.
>
> — [CrewAI Practical Lessons Learned](https://ondrej-popelka.medium.com/crewai-practical-lessons-learned-b696baa67242)

---

## Language policy

CrewAI wraps role/goal/backstory into an **English** system prompt template:
```
You are {role}. {backstory}
Your personal goal is: {goal}
```

Mixing non-English config into this English template causes **code-switching** in the system prompt, which reduces instruction-following performance.

| Field | Language | Reason |
|-------|----------|--------|
| **Role** | English | Inserted into "You are {role}" |
| **Goal** | English | Inserted into "Your personal goal is: {goal}" |
| **Backstory** | English (with target-language domain terms) | Inserted into English context. Domain terms (e.g. "ELE A1.1", "sílaba tónica", "Protocole L") stay in the target language |
| **Task description** | English for instructions, target language for examples | Steps = English. Content examples = target language (the language the agent outputs) |
| **Expected output** | Target language | The agent's output must be in the target language defined by the crew |
| **Explicit instruction** | Add: "Generate all content in the target language defined by the crew configuration" | Ensures output language. For Strategos (ELE): "Generate all content in Spanish (es-ES)" |

---

## What goes in each field

### Role (1 line)

**Purpose:** Professional title. Defines what the agent DOES, not what it IS.

| Good | Bad | Why |
|------|-----|-----|
| "Vocabulary card extractor and generator" | "Vocabulary expert" | Too generic, no action indicated |
| "Spanish reading text analyzer and comprehension lesson planner" | "Reading comprehension specialist" | Too generic, no concrete action |

**Rule:** If you can use the role as an email subject line and the job is clear, it's correct.

---

### Goal (1-2 sentences)

**Purpose:** The outcome the agent pursues. CrewAI uses it internally to determine when the agent is done. Must be **outcome-oriented**, not **process-oriented**.

| Good | Bad | Why |
|------|-----|-----|
| "Generate complete vocabulary cards from activity inventories, incorporating prior editorial corrections to improve with each iteration." | "Query the database, extract vocabulary, and generate standardized cards with all required fields." | The bad one describes steps (query, extract, generate) instead of the outcome |

**What NOT to include in the goal:**

| Element | Where it actually goes | Example |
|---------|----------------------|---------|
| Format details (fields, structure) | Task description | "24 fields per card" |
| Course name or data source | Backstory (if context) or Task (if instruction) | "Nuevo Compañeros 1" |
| Step-by-step procedures | Task description | "Step 1: query inventory..." |
| Terminology the LLM can't understand without context | Task description (with explanation) | "Protocol L" |
| Information that repeats the backstory | Remove from goal | "you know the 7 L1s..." |
| Numeric implementation details | Task description | "4 frequent combinations" |

**What to INCLUDE in the goal:**

- The **product** it generates (cards, lesson plans, evaluations...)
- The **quality standard** in terms the LLM understands ("accurate", "error-free", "verified")
- The **input** it receives, described generically ("from activity inventories")
- The agent's **differentiator** if it has one ("incorporating prior human corrections")

> **Source:** CrewAI's own examples of good goals are short and outcome-focused:
> - "Transform research into engaging, clear content that educates and informs"
> - "Ensure content is accurate, well-structured, and polished while maintaining consistency"
>
> — [Crafting Effective Agents - CrewAI](https://docs.crewai.com/en/guides/agents/crafting-effective-agents)

---

### Backstory (3-6 sentences)

**Purpose:** Experience, knowledge, and work philosophy. Influences HOW the agent approaches problems. It is NOT an instruction list.

**Recommended structure:**

1. **Domain expertise** — what it knows (1 sentence)
2. **Operational context** — what environment it works in (1 sentence)
3. **Critical constraint** — what must not fail (1 sentence)
4. **Work philosophy** — how it approaches decisions (1 sentence)

| Good | Bad | Why |
|------|-----|-----|
| "You are a specialist in vocabulary instruction for ELE A1.1." | "Your objective is to generate vocabulary cards." | That's the goal, not the backstory |
| "Error tolerance = ZERO. Cards are printed material that reaches the student." | "Step 1: check corrections. Step 2: generate cards." | Procedures go in Task |
| "ALWAYS check prior corrections before generating." | "You must query the Neon PostgreSQL database." | Technical details go in Task/Tools |

**What NOT to put in backstory:**

- Step-by-step procedures (go in Task description)
- Technical tool details (go in Task/Tools)
- Information that repeats the goal
- Database names, URLs, file formats

---

### Task description (the most important — 80% of effort)

**Purpose:** Step-by-step instructions for a specific execution. ALL detail goes here.

> *"Even the most perfectly defined agent will fail with poorly designed tasks, but well-designed tasks can elevate even a simple agent."*
> — [Crafting Effective Agents - CrewAI](https://docs.crewai.com/en/guides/agents/crafting-effective-agents)

#### Principle 1: One objective per task — no "God Tasks"

Do not bundle multiple complex operations into one task. If a task crosses domains (research + analysis + writing), split it into separate tasks for separate agents.

> *"Avoid 'God Tasks' — tasks bundling research, analysis, planning, and design simultaneously should be decomposed into sequential, focused operations."* — CrewAI

Exception: sequential steps within the **same domain** (query data → classify → generate) are acceptable in one task.

#### Principle 2: Separate description from expected_output

| Field | Contains | Example |
|-------|----------|---------|
| `task_description` | The **process** — what to do, step by step | "1. Query inventory. 2. Classify vocabulary. 3. Generate cards." |
| `task_expected_output` | The **product** — what the result looks like | "A JSON array of cards, each with 24 fields. Example: {...}" |

> *"Misaligned descriptions and outputs — task descriptions requesting something different than the specified outputs — is a common anti-pattern."* — CrewAI

#### Principle 3: Be explicit — the golden rule

> *"Show your prompt to a colleague with minimal context and ask them to follow it. If they'd be confused, Claude will be too."* — [Anthropic Prompting Best Practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)

Every instruction must be unambiguous. If the task says "generate a lesson plan", it must explain what each section contains. If it says "analyze the text", it must define what aspects to analyze.

#### Principle 4: Examples over abstract rules (few-shot)

> *"Include 3-5 diverse, relevant examples. Claude 4.x models pay close attention to details and examples."* — [Anthropic Prompting Best Practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)

For each complex aspect of the task, provide at least one correct and one incorrect example. The LLM calibrates its output by imitating the examples, not by interpreting abstract rules.

#### Principle 5: Explain the WHY, not just the WHAT

> *"Providing context or motivation behind your instructions helps Claude better understand your goals and deliver more targeted responses."* — [Anthropic Prompting Best Practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)

When the agent encounters an ambiguous case, the WHY helps it decide. Without it, it guesses.

| With WHY | Without WHY |
|----------|-------------|
| "One guide question per step — the student needs a single focus to avoid cognitive overload at A1 level." | "One guide question per step." |
| "Instructions in the student's L1 — comprehension of task instructions must not depend on target language proficiency." | "Instructions in the student's language." |

#### Principle 6: Verify against source data, not general knowledge

> *"Ground responses in quotes — ask Claude to quote relevant parts of the documents before carrying out its task."* — [Anthropic Prompting Best Practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)

The agent must verify its output against **data from tools** (inventory, corrections, rules), not against its own training data. The LLM "knows" the target language, but its knowledge may conflict with the specific inventory or pedagogical decisions of the project.

#### Principle 7: No hardcoded rules that exist in BD

Dynamic rules (things that change with feedback) must live **only** in `reglas_aprendidas` (BD). The task_description should instruct the agent to **read** them via `consultar_reglas`, not duplicate them.

| Good | Bad | Why |
|------|-----|-----|
| "Step 1: Call consultar_reglas. Apply ALL returned rules." | "CRITICAL RULES: Never give direct answers. Always use evidence trick." | The bad one hardcodes rules that are also in BD — if BD changes, the task contradicts |

Static rules (things that never change, like "output in target language" or "one step at a time") CAN stay in the task_description because they are structural, not editorial.

#### Principle 8: What to include (summary)

| Element | Required | Source |
|---------|----------|--------|
| Numbered, explicit steps | Yes | CrewAI |
| Exact tool names and parameters | Yes | CrewAI |
| Language instruction: "Generate all content in [target language]" | Yes | Project policy |
| Execution-specific context via template variables | Yes | CrewAI |
| Examples (correct + incorrect) for each complex aspect | Yes | Anthropic |
| WHY behind each non-obvious requirement | Yes | Anthropic |
| Instruction to read dynamic rules from BD before generating | Yes | Project architecture |
| Validation criteria with examples | Yes | Anthropic, CrewAI |

**What to include in expected_output:**

- Exact format expected (JSON, structured text, etc.)
- Complete example of a well-generated element (in target language)
- This helps the LLM calibrate format and detail level
- The expected_output describes the PRODUCT, not the process

---

## Mandatory checklists

### Before writing/modifying a GOAL:

- [ ] Does it describe an outcome, not steps?
- [ ] Is it 2 sentences max?
- [ ] Does it exclude format details that belong in Task?
- [ ] Does it avoid repeating backstory information?
- [ ] Is every word understandable by an LLM without additional context?
- [ ] Is the input described generically (not "the Neon PostgreSQL DB")?

### Before writing/modifying a BACKSTORY:

- [ ] Does it define who the agent is, not what it should do?
- [ ] Does it contain no step-by-step procedures?
- [ ] Does it avoid repeating the goal?
- [ ] Does it include the quality standard if critical?
- [ ] Is the work philosophy clear?

### Before writing/modifying a TASK:

- [ ] Are steps numbered and explicit? (Principle 1)
- [ ] Are tool names and parameters exact? (Principle 8)
- [ ] Is description separated from expected_output? (Principle 2)
- [ ] Does expected_output have a complete example? (Principle 2)
- [ ] Is every instruction unambiguous to a "new employee"? (Principle 3)
- [ ] Does each complex aspect have correct + incorrect examples? (Principle 4)
- [ ] Does each non-obvious requirement explain WHY? (Principle 5)
- [ ] Does verification use source data, not LLM general knowledge? (Principle 6)
- [ ] Are dynamic rules read from BD, not hardcoded? (Principle 7)
- [ ] Does it include the target language instruction? (Principle 8)

---

## Where agent config lives (architecture rule)

Agent configuration is **split into two layers** based on mutability:

| Config element | Where it lives | Why |
|----------------|---------------|-----|
| `role`, `goal`, `backstory` | **BD → `crew_agents`** | Mutable, editable from dashboard without redeploy |
| `task_description` | **BD → `crew_agents`** | The main prompt — must be editable without touching code |
| `task_expected_output` | **BD → `crew_agents`** | Output format spec — tuned iteratively |
| `max_iter` | **BD → `crew_agents`** | Occasional tuning parameter |
| `llm_model`, `llm_temperature`, `llm_max_tokens`, `llm_top_p` | **BD → `crew_agents`** | Per-agent LLM config, editable from dashboard |
| `tools` | **Python code** | Class instances, cannot serialize to DB |
| `context` (task chaining) | **Python code** | Pipeline structure, changes require code review |
| `process` (sequential/hierarchical) | **Python code** | Structural, not tunable at runtime |

**Practical rule:** If a human might want to edit it to improve output quality, it goes in `crew_agents`. If it requires Python code to change, it stays in code.

---

## Reference example 1: Crew Recurvo (Guía Didáctica)

3 agents, sequential pipeline: Generador → Verificador → Escritor.
Each agent has its own LLM + parameters. Config in `crew_agents` table.

### Agent 1: Generador

**Role:** `Vocabulary card extractor and generator`

**Goal:**
```
Generate complete vocabulary cards from activity inventories,
incorporating prior editorial corrections to improve with each iteration.
```

**Backstory:**
```
You are a specialist in vocabulary instruction for ELE (Spanish as a Foreign
Language) at A1.1 level, working with adolescent learners (12-15 years).
You produce vocabulary cards for a printed editorial course — errors cannot
be corrected after printing. You have working knowledge of the Spanish
linguistic system relevant to A1 vocabulary: gender and number rules, stress
patterns, word formation, and how words combine in frequent combinations
(chunks / construction patterns). Your approach: always consult learned rules
and prior corrections before generating, prioritize common everyday usage
over literary forms, and verify every linguistic detail against source material.
```

### Agent 2: Verificador

**Role:** `Vocabulary card quality verifier`

**Goal:**
```
Ensure every vocabulary card is accurate, complete, and consistent
with the source inventory before finalization.
```

**Backstory:**
```
You are a quality control specialist for printed ELE (Spanish as a Foreign
Language) materials at A1.1 level, with knowledge of Spanish gender rules,
stress patterns, and grammatical constructions for beginners. You work in a
sequential pipeline where you receive cards from the generator and must deliver
corrected cards to the writer — there is no cycle back to the generator. Error
tolerance is zero: cards are printed material that cannot be corrected after
publication. Your approach: verify every detail against source data from tools
and learned rules, never rely on assumptions alone. You do not generate new
cards — you only validate and correct what you receive.
```

### Agent 3: Escritor

**Role:** `Database card writer and CSV exporter`

**Goal:**
```
Ensure all verified vocabulary cards are safely stored and available
in both database and InDesign-ready CSV format.
```

**Backstory:**
```
You are a data persistence specialist responsible for the final step
in a vocabulary card production pipeline. You operate in a sequential
pipeline where you receive already-verified cards from the quality
verifier — your input is trusted and must not be modified. Reliability
is critical: if cards are not correctly written to the database or the
CSV is malformed, the entire pipeline run is wasted. Your approach:
execute tools precisely as specified, report results transparently,
and flag any anomalies without attempting to fix content.
```

---

## Reference example 2: Crew LUCAPI (Strategos)

2 agents, sequential pipeline: Analizador → Coach.
Analizador uses vision-capable LLM (Llama 4 Scout). Coach uses conversational LLM (DeepSeek V3).

### Agent 1: Analizador

**Role:** `Spanish reading text analyzer and comprehension lesson planner`

**Goal:**
```
Produce a complete text analysis and reading lesson plan that enables
a comprehension coach to guide an ELE student through the text,
incorporating learned pedagogical rules to improve accuracy over time.
```

**Backstory:**
```
You are a specialist in reading comprehension pedagogy for ELE (Español
como Lengua Extranjera) at A1-A2 level, with expertise in text analysis
for adolescent learners (12-15 years). You receive texts as images or
plain text and work as the preparation stage in a two-agent pipeline:
your analysis feeds directly into an interactive coach who has no time
to analyze during conversation. Your analysis must be thorough enough
that the coach can scaffold the entire reading process without
improvising. Your approach: identify what makes a text challenging for
the target level, anticipate comprehension obstacles, and design
questions that lead to discovery rather than direct answers.
```

### Agent 2: Coach

**Role:** `Interactive reading comprehension coach for ELE students`

**Goal:**
```
Guide ELE students to independently comprehend Spanish texts using
a pre-analyzed lesson plan as the foundation for each session,
incorporating learned pedagogical rules to improve effectiveness over time.
```

**Backstory:**
```
You are an interactive reading coach for ELE (Español como Lengua
Extranjera) at A1-A2 level, working with adolescent learners (12-15
years) in a chat environment. You operate in a two-agent pipeline
where you receive a complete text analysis and lesson plan from a
text analyzer — your input is trusted and ready to use. You never
provide answers directly: the student must discover meaning through
their own reading process. Your approach: one step at a time across
multiple conversation turns, instructions in the student's native
language (multilingual — any L1), text work always in Spanish.
```

### Task descriptions
Stored in BD table `crew_agents` (columns: `task_description`, `task_expected_output`). Editable from Languagent dashboard. Read by `lucapi.py` at runtime via `cargar_config_bd("lucapi")`.

---

## Sources

- [Crafting Effective Agents - CrewAI](https://docs.crewai.com/en/guides/agents/crafting-effective-agents)
- [Tasks - CrewAI](https://docs.crewai.com/en/concepts/tasks)
- [Goal vs Backstory overlap - DeepLearning.AI](https://community.deeplearning.ai/t/confusing-lack-of-separation-between-abstractions-agent-vs-task-and-goal-vs-backstory/885785)
- [CrewAI Practical Lessons Learned](https://ondrej-popelka.medium.com/crewai-practical-lessons-learned-b696baa67242)
- [Claude Prompting Best Practices - Anthropic](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
- [Prompt Engineering for AI Agents - PromptHub](https://www.prompthub.us/blog/prompt-engineering-for-ai-agents)
- [Multi-Agent Systems: Context Engineering - Vellum](https://www.vellum.ai/blog/multi-agent-systems-building-with-context-engineering)
- [Native vs Non-Native Language Prompting](https://arxiv.org/html/2409.07054v1)
