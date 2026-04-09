const BASE = ''

async function request(url, options) {
  const r = await fetch(url, options)
  if (!r.ok) throw new Error(`API error ${r.status}: ${url}`)
  return r.json()
}

export async function fetchCrews() {
  return request(`${BASE}/api/crews`)
}

export async function fetchCrewAgents(crew) {
  return request(`${BASE}/api/crew_agents?crew=${encodeURIComponent(crew)}`)
}

export async function fetchModelos() {
  return request(`${BASE}/api/modelos`)
}

export async function updateAgent(id, data) {
  return request(`${BASE}/api/crew_agents/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...data }),
  })
}

export async function createAgent(data) {
  return request(`${BASE}/api/crew_agents/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export async function deleteAgent(id) {
  return request(`${BASE}/api/crew_agents/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  })
}

export async function fetchVersion() {
  return request(`${BASE}/api/version`)
}

export async function runCrew(crew, agentKey, texto) {
  return request(`${BASE}/api/agente/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agente: crew, agent_key: agentKey, texto }),
  })
}

export async function fetchRunStatus(runId) {
  return request(`${BASE}/api/agente/status?run_id=${encodeURIComponent(runId)}`)
}

export async function fetchCorrecciones(agentKey) {
  const url = agentKey
    ? `${BASE}/api/correcciones?agent_key=${encodeURIComponent(agentKey)}`
    : `${BASE}/api/correcciones`
  return request(url)
}

export async function fetchReglas(crew) {
  const url = crew
    ? `${BASE}/api/reglas?crew=${encodeURIComponent(crew)}`
    : `${BASE}/api/reglas`
  return request(url)
}

export async function fetchTrazas(limit = 20) {
  return request(`${BASE}/api/trazas?limit=${limit}`)
}

export async function fetchTrazaDetalle(id) {
  return request(`${BASE}/api/trazas/${encodeURIComponent(id)}`)
}

export async function fetchCorreccionesStats(agentKey) {
  const url = agentKey
    ? `${BASE}/api/correcciones/stats?agent_key=${encodeURIComponent(agentKey)}`
    : `${BASE}/api/correcciones/stats`
  return request(url)
}

export async function createRegla(data) {
  return request(`${BASE}/api/reglas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export async function deleteRegla(id) {
  return request(`${BASE}/api/reglas/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  })
}
