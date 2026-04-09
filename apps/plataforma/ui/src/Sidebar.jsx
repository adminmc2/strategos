import { useNavigate } from 'react-router-dom'

export default function Sidebar({ agents, selectedAgent, onSelectAgent, onAddAgent, onDeleteAgent, crewName }) {
  const navigate = useNavigate()

  return (
    <div className="sidebar">
      <h3>Agentes en pipeline</h3>
      <div className="agent-list">
        {agents.map(a => (
          <div
            key={a.agent_key}
            className={`sidebar-agent ${selectedAgent?.agent_key === a.agent_key ? 'active' : ''}`}
          >
            <button className="agent-btn" onClick={() => onSelectAgent(a)}>
              <span className="dot agent" />
              <span className="agent-label">
                <span className="agent-name-text">{a.agent_key.toUpperCase()}</span>
                <span className="agent-order">#{a.agent_order}</span>
              </span>
            </button>
            <button className="agent-delete" onClick={() => onDeleteAgent(a.id)} title="Eliminar">&times;</button>
          </div>
        ))}
      </div>
      <button className="btn-add-agent" onClick={onAddAgent}>+ Añadir agente</button>

      <div className="sidebar-spacer" />

      <h3>Sistema</h3>
      <button onClick={() => navigate(`/crew/${crewName}/correcciones`)}>
        <span className="dot system" />Correcciones
      </button>
      <button onClick={() => navigate(`/crew/${crewName}/reglas`)}>
        <span className="dot system" />Reglas
      </button>
      <button onClick={() => navigate(`/crew/${crewName}/trazas`)}>
        <span className="dot system" />Trazas LLM
      </button>
    </div>
  )
}
