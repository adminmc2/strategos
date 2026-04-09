import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchCrews, fetchCrewAgents, createAgent } from './api'

export default function Dashboard({ version }) {
  const [crews, setCrews] = useState([])
  const [crewData, setCrewData] = useState({})
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const loadData = async () => {
    setLoading(true)
    try {
      const cs = await fetchCrews()
      setCrews(cs)
      const data = {}
      await Promise.all(cs.map(async c => { data[c] = await fetchCrewAgents(c) }))
      setCrewData(data)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const handleCreateCrew = async () => {
    const name = prompt('Nombre del nuevo crew (e.g. "reca"):')
    if (!name) return
    const crewName = name.toLowerCase().trim()
    const agentKey = prompt('Key del primer agente (e.g. "analizador"):')
    if (!agentKey) return
    try {
      const res = await createAgent({
        crew: crewName,
        agent_key: agentKey.toLowerCase().trim(),
        role: 'New agent — configure role',
        goal: '',
        backstory: '',
        task_description: '',
        task_expected_output: '',
      })
      if (res.ok) {
        await loadData()
        navigate(`/crew/${crewName}`)
      } else {
        alert(`Error al crear crew: ${res.error || 'unknown'}`)
      }
    } catch (e) {
      alert(`Error de conexión: ${e.message}`)
    }
  }

  return (
    <div className="dashboard">
      <header>
        <h1>Languagent</h1>
        <span className="status">v{version}</span>
      </header>

      <div className="dashboard-content">
        <div className="dashboard-header">
          <h2>Crews</h2>
        </div>

        {loading ? (
          <div className="loading">Cargando crews...</div>
        ) : (
          <div className="crew-grid">
            {crews.map(crew => {
              const agents = crewData[crew] || []
              return (
                <div key={crew} className="crew-card" onClick={() => navigate(`/crew/${crew}`)}>
                  <div className="crew-card-header">
                    <span className="crew-name">{crew.toUpperCase()}</span>
                    <span className="crew-count">{agents.length} agente{agents.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="crew-pipeline">
                    {agents.map((a, i) => (
                      <span key={a.agent_key}>
                        <span className="crew-agent-chip">{a.agent_key}</span>
                        {i < agents.length - 1 && <span className="crew-arrow">&rarr;</span>}
                      </span>
                    ))}
                  </div>
                  <div className="crew-models">
                    {agents.map(a => (
                      <span key={a.agent_key} className="crew-model-tag">
                        {(a.llm_model || '?').split('/').pop()}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}

            <div className="crew-card crew-card-new" onClick={handleCreateCrew}>
              <div className="crew-card-new-content">
                <span className="crew-new-icon">+</span>
                <span>Crear nuevo crew</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
