import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import PipelineCanvas from './PipelineCanvas'
import AgentPanel from './AgentPanel'
import { fetchCrewAgents, createAgent, deleteAgent, runCrew } from './api'

export default function Editor({ modelos, version }) {
  const { crewName } = useParams()
  const navigate = useNavigate()
  const [agents, setAgents] = useState([])
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadAgents = useCallback(async () => {
    setLoading(true)
    const ag = await fetchCrewAgents(crewName)
    setAgents(ag)
    setLoading(false)
  }, [crewName])

  useEffect(() => { loadAgents() }, [loadAgents])

  const handleSelectAgent = (agent) => {
    setSelectedAgent(prev => prev?.agent_key === agent.agent_key ? null : agent)
  }

  const handleAgentSaved = (updatedAgent) => {
    setAgents(prev => prev.map(a => a.id === updatedAgent.id ? updatedAgent : a))
    setSelectedAgent(updatedAgent)
  }

  const handleAddAgent = async () => {
    const key = prompt('Agent key (e.g. "verificador"):')
    if (!key) return
    const res = await createAgent({ crew: crewName, agent_key: key.toLowerCase().trim() })
    if (res.ok) await loadAgents()
  }

  const handleDeleteAgent = async (agentId) => {
    if (!confirm('Eliminar este agente?')) return
    const res = await deleteAgent(agentId)
    if (res.ok) {
      if (selectedAgent?.id === agentId) setSelectedAgent(null)
      await loadAgents()
    }
  }

  const handleRun = async () => {
    const res = await runCrew(crewName)
    if (res.run_id) alert(`Ejecución iniciada: ${res.run_id}`)
    else alert(`Error: ${res.error || 'unknown'}`)
  }

  return (
    <div className={`editor ${selectedAgent ? 'panel-open' : ''}`}>
      <header>
        <div className="header-left">
          <button className="btn-back" onClick={() => navigate('/')}>&larr;</button>
          <h1>{crewName.toUpperCase()} Pipeline</h1>
        </div>
        <div className="header-right">
          <button className="btn btn-primary btn-sm" onClick={handleRun}>&#9654; Run</button>
          <span className="status">v{version}</span>
        </div>
      </header>

      <Sidebar
        agents={agents}
        selectedAgent={selectedAgent}
        onSelectAgent={handleSelectAgent}
        onAddAgent={handleAddAgent}
        onDeleteAgent={handleDeleteAgent}
        crewName={crewName}
      />

      {loading ? (
        <div className="canvas-area"><div className="loading">Cargando pipeline...</div></div>
      ) : (
        <PipelineCanvas
          agents={agents}
          modelos={modelos}
          selectedAgent={selectedAgent}
          onSelectAgent={handleSelectAgent}
        />
      )}

      <AgentPanel
        agent={selectedAgent}
        modelos={modelos}
        onClose={() => setSelectedAgent(null)}
        onSaved={handleAgentSaved}
      />
    </div>
  )
}
