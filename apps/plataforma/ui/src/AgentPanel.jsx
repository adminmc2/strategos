import { useState, useEffect } from 'react'
import { updateAgent } from './api'

export default function AgentPanel({ agent, modelos, onClose, onSaved }) {
  const [form, setForm] = useState({})
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (agent) {
      setForm({
        llm_model: agent.llm_model || '',
        llm_temperature: agent.llm_temperature ?? 0.5,
        llm_max_tokens: agent.llm_max_tokens ?? 4096,
        llm_top_p: agent.llm_top_p ?? 1.0,
        role: agent.role || '',
        goal: agent.goal || '',
        backstory: agent.backstory || '',
        task_description: agent.task_description || '',
        task_expected_output: agent.task_expected_output || '',
        max_iter: agent.max_iter ?? 15,
      })
      setEditing(false)
      setSaved(false)
    }
  }, [agent])

  if (!agent) return null

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    const data = { ...form }
    data.llm_temperature = parseFloat(data.llm_temperature)
    data.llm_max_tokens = parseInt(data.llm_max_tokens)
    data.llm_top_p = parseFloat(data.llm_top_p)
    data.max_iter = parseInt(data.max_iter)
    try {
      const res = await updateAgent(agent.id, data)
      if (res.ok) {
        setSaved(true)
        setError(null)
        setEditing(false)
        setTimeout(() => setSaved(false), 2000)
        if (onSaved) onSaved({ ...agent, ...data })
      } else {
        setError('Error al guardar')
        setTimeout(() => setError(null), 3000)
      }
    } catch (e) {
      setError('Error de conexión')
      setTimeout(() => setError(null), 3000)
    }
  }

  const modelOptions = modelos.map(m => {
    const badges = [m.vision ? 'vision' : '', m.function_calling ? 'tools' : '', m.reasoning ? 'reasoning' : ''].filter(Boolean).join(' ')
    const avail = m.available ? '' : ' (no key)'
    return (
      <option key={m.id} value={m.id} disabled={!m.available}>
        {m.name} -- {m.provider}{avail} {badges} {m.cost}
      </option>
    )
  })

  return (
    <div className="config-panel">
      <div className="panel-header">
        <h2>{agent.agent_key.toUpperCase()}</h2>
        <button className="close-btn" onClick={onClose}>&times;</button>
      </div>

      <div className="config-section">
        <h3>LLM Config</h3>
        <div className="field">
          <label>Modelo</label>
          <select value={form.llm_model} onChange={e => set('llm_model', e.target.value)} disabled={!editing}>
            <option value="">-- Seleccionar --</option>
            {modelOptions}
          </select>
        </div>
        <div className="param-grid">
          <div className="field">
            <label>Temperature</label>
            <input type="number" value={form.llm_temperature} onChange={e => set('llm_temperature', e.target.value)} disabled={!editing} min="0" max="2" step="0.1" />
          </div>
          <div className="field">
            <label>Max tokens</label>
            <input type="number" value={form.llm_max_tokens} onChange={e => set('llm_max_tokens', e.target.value)} disabled={!editing} min="256" max="32768" step="256" />
          </div>
          <div className="field">
            <label>Top P</label>
            <input type="number" value={form.llm_top_p} onChange={e => set('llm_top_p', e.target.value)} disabled={!editing} min="0" max="1" step="0.1" />
          </div>
        </div>
      </div>

      <div className="config-section">
        <h3>Identity</h3>
        <div className="field">
          <label>Role</label>
          <textarea value={form.role} onChange={e => set('role', e.target.value)} disabled={!editing} />
        </div>
        <div className="field">
          <label>Goal</label>
          <textarea value={form.goal} onChange={e => set('goal', e.target.value)} disabled={!editing} />
        </div>
        <div className="field">
          <label>Backstory</label>
          <textarea className="tall" value={form.backstory} onChange={e => set('backstory', e.target.value)} disabled={!editing} />
        </div>
      </div>

      <div className="config-section">
        <h3>Task</h3>
        <div className="field">
          <label>Description</label>
          <textarea className="tall" value={form.task_description} onChange={e => set('task_description', e.target.value)} disabled={!editing} />
        </div>
        <div className="field">
          <label>Expected output</label>
          <textarea value={form.task_expected_output} onChange={e => set('task_expected_output', e.target.value)} disabled={!editing} />
        </div>
        <div className="field">
          <label>Max iterations</label>
          <input type="number" value={form.max_iter} onChange={e => set('max_iter', e.target.value)} disabled={!editing} min="1" max="50" />
        </div>
      </div>

      <div className="save-bar">
        {!editing && <button className="btn btn-secondary" onClick={() => setEditing(true)}>Editar</button>}
        {editing && <button className="btn btn-primary" onClick={handleSave}>Guardar</button>}
        {editing && <button className="btn btn-secondary" onClick={() => { setEditing(false); setForm({ ...form }) }}>Cancelar</button>}
        {saved && <span className="saved-toast show">Guardado en BD</span>}
        {error && <span className="error-toast show">{error}</span>}
      </div>
    </div>
  )
}
