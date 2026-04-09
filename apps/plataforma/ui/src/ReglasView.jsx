import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeftIcon, PlusIcon, PencilSimpleIcon, TrashIcon, FloppyDiskIcon, XIcon } from '@phosphor-icons/react'
import { fetchReglas, createRegla, deleteRegla } from './api'

export default function ReglasView() {
  const { crewName } = useParams()
  const navigate = useNavigate()
  const [reglas, setReglas] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ tipo_error: '', regla: '', ejemplos: '', n_correcciones: 0 })
  const [creating, setCreating] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const data = await fetchReglas(crewName)
      setReglas(data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { load() }, [crewName])

  const startEdit = (regla) => {
    setEditingId(regla.id)
    setForm({
      tipo_error: regla.tipo_error || '',
      regla: regla.regla || '',
      ejemplos: regla.ejemplos || '',
      n_correcciones: regla.n_correcciones || 0,
    })
    setCreating(false)
  }

  const startCreate = () => {
    setEditingId(null)
    setCreating(true)
    setForm({ tipo_error: '', regla: '', ejemplos: '', n_correcciones: 0 })
  }

  const cancel = () => {
    setEditingId(null)
    setCreating(false)
  }

  const handleSave = async () => {
    try {
      const data = { ...form, crew: crewName }
      if (editingId) data.id = editingId
      await createRegla(data)
      setEditingId(null)
      setCreating(false)
      await load()
    } catch (e) {
      alert(`Error: ${e.message}`)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Eliminar esta regla?')) return
    try {
      await deleteRegla(id)
      await load()
    } catch (e) {
      alert(`Error: ${e.message}`)
    }
  }

  const renderForm = () => (
    <div className="regla-form">
      <div className="field">
        <label>Tipo de error</label>
        <input value={form.tipo_error} onChange={e => setForm(f => ({ ...f, tipo_error: e.target.value }))} placeholder="e.g. respuesta_directa, vocabulario_incorrecto" />
      </div>
      <div className="field">
        <label>Regla</label>
        <textarea className="tall" value={form.regla} onChange={e => setForm(f => ({ ...f, regla: e.target.value }))} placeholder="Descripcion de la regla que los agentes deben seguir..." />
      </div>
      <div className="field">
        <label>Ejemplos</label>
        <textarea value={form.ejemplos} onChange={e => setForm(f => ({ ...f, ejemplos: e.target.value }))} placeholder="Ejemplos de aplicacion de la regla..." />
      </div>
      <div className="save-bar">
        <button className="btn btn-primary btn-sm" onClick={handleSave}>
          <FloppyDiskIcon size={14} weight="bold" /> Guardar
        </button>
        <button className="btn btn-secondary btn-sm" onClick={cancel}>
          <XIcon size={14} weight="bold" /> Cancelar
        </button>
      </div>
    </div>
  )

  return (
    <div className="view-page">
      <header>
        <div className="header-left">
          <button className="btn-back" onClick={() => navigate(`/crew/${crewName}`)}>
            <ArrowLeftIcon size={18} weight="bold" />
          </button>
          <h1>{crewName.toUpperCase()} &mdash; Reglas</h1>
        </div>
        <div className="header-right">
          <button className="btn btn-primary btn-sm" onClick={startCreate}>
            <PlusIcon size={14} weight="bold" /> Nueva regla
          </button>
        </div>
      </header>

      <div className="view-content">
        {creating && (
          <div className="view-card">
            <div className="view-card-header">
              <span className="view-card-title">Nueva regla</span>
            </div>
            {renderForm()}
          </div>
        )}

        {loading ? (
          <div className="loading">Cargando reglas...</div>
        ) : reglas.length === 0 && !creating ? (
          <div className="empty-state">No hay reglas definidas para este crew</div>
        ) : (
          reglas.map(r => (
            <div key={r.id} className="view-card">
              <div className="view-card-header">
                <span className="view-card-title">{r.tipo_error || 'Sin tipo'}</span>
                <div className="view-card-actions">
                  <span className={`status-badge ${r.activa ? 'active' : 'inactive'}`}>
                    {r.activa ? 'Activa' : 'Inactiva'}
                  </span>
                  <button className="icon-btn" onClick={() => startEdit(r)} title="Editar">
                    <PencilSimpleIcon size={16} />
                  </button>
                  <button className="icon-btn danger" onClick={() => handleDelete(r.id)} title="Eliminar">
                    <TrashIcon size={16} />
                  </button>
                </div>
              </div>
              {editingId === r.id ? renderForm() : (
                <>
                  <div className="view-card-body">{r.regla}</div>
                  {r.ejemplos && <div className="view-card-meta">Ejemplos: {r.ejemplos}</div>}
                  <div className="view-card-meta">Correcciones: {r.n_correcciones || 0}</div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
