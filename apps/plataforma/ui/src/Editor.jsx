import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PlayIcon, XIcon, TerminalIcon } from '@phosphor-icons/react'
import Sidebar from './Sidebar'
import PipelineCanvas from './PipelineCanvas'
import AgentPanel from './AgentPanel'
import RunOutput from './RunOutput'
import { fetchCrewAgents, createAgent, deleteAgent, runCrew, fetchRunStatus } from './api'

export default function Editor({ modelos, version }) {
  const { crewName } = useParams()
  const navigate = useNavigate()
  const [agents, setAgents] = useState([])
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showRunModal, setShowRunModal] = useState(false)
  const [runTexto, setRunTexto] = useState('')
  const [running, setRunning] = useState(false)
  // Right panel mode: 'agent' | 'terminal' | null
  const [panelMode, setPanelMode] = useState(null)
  const [activeRun, setActiveRun] = useState(null)
  const pollRef = useRef(null)
  const outputRef = useRef(null)

  const loadAgents = useCallback(async () => {
    setLoading(true)
    const ag = await fetchCrewAgents(crewName)
    setAgents(ag)
    setLoading(false)
  }, [crewName])

  useEffect(() => { loadAgents() }, [loadAgents])
  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  // Auto-scroll terminal output
  useEffect(() => {
    if (outputRef.current && panelMode === 'terminal') {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [activeRun?.output, panelMode])

  const handleSelectAgent = (agent) => {
    if (selectedAgent?.agent_key === agent.agent_key && panelMode === 'agent') {
      setPanelMode(null)
      setSelectedAgent(null)
    } else {
      setSelectedAgent(agent)
      setPanelMode('agent')
    }
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
      if (selectedAgent?.id === agentId) { setSelectedAgent(null); setPanelMode(null) }
      await loadAgents()
    }
  }

  const startPolling = (runId) => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      try {
        const data = await fetchRunStatus(runId)
        setActiveRun(prev => ({ ...prev, status: data.status, output: data.output || '' }))
        if (data.status === 'completed' || data.status === 'error') {
          clearInterval(pollRef.current)
          pollRef.current = null
        }
      } catch (e) { console.error('Polling error:', e) }
    }, 2000)
  }

  const handleRun = async () => {
    if (!runTexto.trim()) return alert('Escribe un texto para analizar')
    setRunning(true)
    try {
      const res = await runCrew(crewName, null, runTexto)
      if (res.run_id) {
        setActiveRun({ run_id: res.run_id, status: 'running', output: '' })
        startPolling(res.run_id)
      } else {
        alert(`Error: ${res.error || 'unknown'}`)
      }
    } catch (e) {
      alert(`Error: ${e.message}`)
    }
    setRunning(false)
    setShowRunModal(false)
  }

  const closePanel = () => {
    setPanelMode(null)
    setSelectedAgent(null)
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }

  const showTerminal = () => {
    setPanelMode(panelMode === 'terminal' ? null : 'terminal')
  }

  const panelOpen = panelMode !== null

  return (
    <div className={`editor ${panelOpen ? 'panel-open' : ''}`}>
      <header>
        <div className="header-left">
          <button className="btn-back" onClick={() => navigate('/')}>&larr;</button>
          <h1>{crewName.toUpperCase()} Pipeline</h1>
        </div>
        <div className="header-right">
          <button
            className={`header-btn ${panelMode === 'terminal' ? 'active' : ''}`}
            onClick={showTerminal}
            title="Terminal"
          >
            <TerminalIcon size={14} weight="bold" />
            {activeRun && <span className={`run-dot ${activeRun.status}`} />}
          </button>
          <button className="header-btn" onClick={() => setShowRunModal(true)}>
            <PlayIcon size={14} weight="bold" /> Run
          </button>
          <span className="status">v{version}</span>
        </div>
      </header>

      <Sidebar
        agents={agents}
        selectedAgent={panelMode === 'agent' ? selectedAgent : null}
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
          selectedAgent={panelMode === 'agent' ? selectedAgent : null}
          onSelectAgent={handleSelectAgent}
        />
      )}

      {/* Right panel: agent config OR terminal */}
      {panelMode === 'agent' && selectedAgent && (
        <AgentPanel
          agent={selectedAgent}
          modelos={modelos}
          onClose={closePanel}
          onSaved={handleAgentSaved}
        />
      )}

      {panelMode === 'terminal' && (
        <div className="config-panel terminal-panel">
          <div className="panel-header">
            <h2>
              <TerminalIcon size={18} weight="bold" style={{ marginRight: 8 }} />
              {activeRun ? `Run ${activeRun.run_id}` : 'Terminal'}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {activeRun && (
                <span className={`run-status ${activeRun.status}`}>
                  {activeRun.status === 'running' ? 'Ejecutando...' :
                   activeRun.status === 'completed' ? 'Completado' :
                   'Error'}
                </span>
              )}
              <button className="close-btn" onClick={closePanel}><XIcon size={18} /></button>
            </div>
          </div>
          <div className="terminal-output" ref={outputRef}>
            {activeRun
              ? <RunOutput output={activeRun.output} />
              : <div className="run-empty">Sin ejecuciones. Haz click en Run para lanzar el pipeline.</div>
            }
          </div>
        </div>
      )}

      {showRunModal && (
        <div className="modal-overlay" onClick={() => setShowRunModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Test pipeline — {crewName.toUpperCase()}</h3>
              <button className="close-btn" onClick={() => setShowRunModal(false)}>
                <XIcon size={18} />
              </button>
            </div>
            <textarea
              className="modal-textarea"
              placeholder="Pega aqui el texto en espanol para analizar..."
              value={runTexto}
              onChange={e => setRunTexto(e.target.value)}
              rows={10}
            />
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowRunModal(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleRun} disabled={running}>
                {running ? 'Ejecutando...' : 'Ejecutar pipeline'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
