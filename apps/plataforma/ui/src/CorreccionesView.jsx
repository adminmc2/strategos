import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeftIcon, CaretDownIcon, CaretRightIcon, FunnelIcon } from '@phosphor-icons/react'
import { fetchCorrecciones, fetchCorreccionesStats, fetchCrewAgents } from './api'

export default function CorreccionesView() {
  const { crewName } = useParams()
  const navigate = useNavigate()
  const [correcciones, setCorrecciones] = useState([])
  const [stats, setStats] = useState(null)
  const [agents, setAgents] = useState([])
  const [selectedAgent, setSelectedAgent] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async (agentKey) => {
    setLoading(true)
    try {
      const [corrs, ag] = await Promise.all([
        fetchCorrecciones(agentKey || undefined),
        fetchCrewAgents(crewName),
      ])
      setCorrecciones(corrs)
      setAgents(ag)
      try {
        const s = await fetchCorreccionesStats(agentKey || undefined)
        setStats(s)
      } catch { setStats(null) }
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { load(selectedAgent) }, [crewName])

  const handleFilter = (agentKey) => {
    setSelectedAgent(agentKey)
    load(agentKey)
  }

  const toggleExpand = (id) => {
    setExpandedId(prev => prev === id ? null : id)
  }

  const formatDate = (d) => {
    if (!d) return '-'
    const date = new Date(d)
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="view-page">
      <header>
        <div className="header-left">
          <button className="btn-back" onClick={() => navigate(`/crew/${crewName}`)}>
            <ArrowLeftIcon size={18} weight="bold" />
          </button>
          <h1>{crewName.toUpperCase()} &mdash; Correcciones</h1>
        </div>
        <div className="header-right">
          <FunnelIcon size={16} weight="bold" style={{ color: 'rgba(255,255,255,.6)' }} />
          <select
            className="header-select"
            value={selectedAgent}
            onChange={e => handleFilter(e.target.value)}
          >
            <option value="">Todos los agentes</option>
            {agents.map(a => (
              <option key={a.agent_key} value={a.agent_key}>{a.agent_key.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </header>

      <div className="view-content">
        {stats && (
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-value">{stats.total || 0}</div>
              <div className="stat-label">Total</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.tipos || 0}</div>
              <div className="stat-label">Tipos de error</div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="loading">Cargando correcciones...</div>
        ) : correcciones.length === 0 ? (
          <div className="empty-state">No hay correcciones registradas</div>
        ) : (
          <div className="data-table">
            <div className="table-header">
              <span className="col-date">Fecha</span>
              <span className="col-agent">Agente</span>
              <span className="col-type">Tipo</span>
              <span className="col-field">Campo</span>
              <span className="col-expand"></span>
            </div>
            {correcciones.map(c => (
              <div key={c.id || c.fecha} className="table-row-group">
                <div className="table-row" onClick={() => toggleExpand(c.id)}>
                  <span className="col-date">{formatDate(c.fecha)}</span>
                  <span className="col-agent">{c.agente || '-'}</span>
                  <span className="col-type">
                    <span className="type-badge">{c.tipo_error || '-'}</span>
                  </span>
                  <span className="col-field">{c.campo || '-'}</span>
                  <span className="col-expand">
                    {expandedId === c.id
                      ? <CaretDownIcon size={14} />
                      : <CaretRightIcon size={14} />}
                  </span>
                </div>
                {expandedId === c.id && (
                  <div className="table-detail">
                    <div className="detail-row">
                      <span className="detail-label">Valor original:</span>
                      <span className="detail-value">{c.valor_original || '-'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Valor corregido:</span>
                      <span className="detail-value highlight">{c.valor_corregido || '-'}</span>
                    </div>
                    {c.palabra && (
                      <div className="detail-row">
                        <span className="detail-label">Palabra:</span>
                        <span className="detail-value">{c.palabra}</span>
                      </div>
                    )}
                    {c.unidad && (
                      <div className="detail-row">
                        <span className="detail-label">Unidad:</span>
                        <span className="detail-value">{c.unidad}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
