import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeftIcon, CaretDownIcon, CaretRightIcon, ClockIcon } from '@phosphor-icons/react'
import { fetchTrazas, fetchTrazaDetalle } from './api'

export default function TrazasView() {
  const { crewName } = useParams()
  const navigate = useNavigate()
  const [trazas, setTrazas] = useState([])
  const [loading, setLoading] = useState(true)
  const [limit, setLimit] = useState(20)
  const [configError, setConfigError] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const load = async (lim) => {
    setLoading(true)
    try {
      const data = await fetchTrazas(lim)
      if (data.error) {
        setTrazas([])
        setConfigError(data.error)
      } else {
        setTrazas(data.trazas || [])
        setConfigError(null)
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { load(limit) }, [limit])

  const toggleExpand = async (traza) => {
    const id = traza.id || traza.trace_id
    if (expandedId === id) {
      setExpandedId(null)
      setDetail(null)
      return
    }
    setExpandedId(id)
    setLoadingDetail(true)
    try {
      const d = await fetchTrazaDetalle(id)
      setDetail(d)
    } catch (e) {
      setDetail({ error: e.message })
    }
    setLoadingDetail(false)
  }

  const loadMore = () => {
    setLimit(prev => prev + 20)
  }

  const formatDate = (d) => {
    if (!d) return '-'
    const date = new Date(d)
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  const formatDuration = (s) => {
    if (!s && s !== 0) return '-'
    return s < 1 ? `${Math.round(s * 1000)}ms` : `${s.toFixed(1)}s`
  }

  const shortModel = (m) => {
    if (!m) return '-'
    const map = {
      'deepseek-chat': 'DeepSeek V3',
      'deepseek-reasoner': 'DeepSeek R1',
      'meta-llama/llama-4-scout-17b-16e-instruct': 'Llama 4 Scout',
      'llama-3.3-70b-versatile': 'Llama 3.3 70B',
      'llama-3.1-8b-instant': 'Llama 3.1 8B',
      'mimo-v2-flash': 'MiMo Flash',
      'mimo-v2-pro': 'MiMo Pro',
    }
    return map[m] || m.split('/').pop()
  }

  const formatTokens = (n) => {
    if (!n && n !== 0) return '-'
    return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
  }

  return (
    <div className="view-page">
      <header>
        <div className="header-left">
          <button className="btn-back" onClick={() => navigate(`/crew/${crewName}`)}>
            <ArrowLeftIcon size={18} weight="bold" />
          </button>
          <h1>{crewName.toUpperCase()} &mdash; Trazas LLM</h1>
        </div>
        <div className="header-right">
          <span className="status">{trazas.length} trazas</span>
        </div>
      </header>

      <div className="view-content">
        {loading && trazas.length === 0 ? (
          <div className="loading">Cargando trazas...</div>
        ) : configError ? (
          <div className="empty-state">
            <div style={{ marginBottom: 8, fontWeight: 600 }}>{configError}</div>
            <div style={{ fontSize: 12 }}>Configura LANGFUSE_PUBLIC_KEY y LANGFUSE_SECRET_KEY en .env</div>
          </div>
        ) : trazas.length === 0 ? (
          <div className="empty-state">No hay trazas registradas</div>
        ) : (
          <>
            <div className="data-table">
              <div className="table-header">
                <span>Fecha</span>
                <span>Modelo</span>
                <span>Input</span>
                <span>Output</span>
                <span>Duracion</span>
                <span></span>
              </div>
              {trazas.map((t, i) => {
                const id = t.id || t.trace_id || i
                const isExpanded = expandedId === id
                return (
                  <div key={id} className="table-row-group">
                    <div className="table-row" onClick={() => toggleExpand(t)}>
                      <span>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{formatDate(t.fecha || t.created_at || t.timestamp)}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', opacity: 0.6, marginTop: 2 }}>
                          {formatTokens(t.tokens_input || t.input_tokens)} / {formatTokens(t.tokens_output || t.output_tokens)} tok
                        </div>
                      </span>
                      <span>
                        <div style={{ fontWeight: 600, fontSize: 12 }}>{shortModel(t.modelo || t.model)}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                          {(t.observations_count || 1)} obs
                        </div>
                      </span>
                      <span className="col-truncate">{t.input || '-'}</span>
                      <span className="col-truncate">{t.output || '-'}</span>
                      <span style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <ClockIcon size={12} style={{ opacity: 0.5 }} />
                        {formatDuration(t.duracion_s || t.duration)}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                        {isExpanded ? <CaretDownIcon size={14} /> : <CaretRightIcon size={14} />}
                      </span>
                    </div>
                    {isExpanded && (
                      <div className="table-detail traza-detail">
                        {loadingDetail ? (
                          <div className="loading">Cargando detalle...</div>
                        ) : detail?.error ? (
                          <div className="empty-state">Error: {detail.error}</div>
                        ) : detail ? (
                          <>
                            {/* Trace-level summary */}
                            <div className="detail-section">
                              <div className="detail-section-title">Trace</div>
                              <div className="obs-meta-grid">
                                <div className="obs-meta-item">
                                  <span className="obs-meta-label">Latencia total</span>
                                  <span className="obs-meta-value">{formatDuration(detail.latency)}</span>
                                </div>
                                {detail.total_cost != null && (
                                  <div className="obs-meta-item">
                                    <span className="obs-meta-label">Costo</span>
                                    <span className="obs-meta-value">${detail.total_cost?.toFixed(6) || '0'}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Observations — per-LLM-call data */}
                            {detail.observations?.length > 0 && (
                              <div className="detail-section">
                                <div className="detail-section-title">Observations ({detail.observations.length})</div>
                                {detail.observations.map((obs, oi) => (
                                  <div key={obs.id || oi} className="obs-card">
                                    <div className="obs-header">
                                      <span className="obs-name">{obs.name || 'LLM Call'}</span>
                                      <span className="obs-model">{shortModel(obs.model)}</span>
                                    </div>
                                    <div className="obs-meta-grid">
                                      {obs.usage?.input != null && (
                                        <div className="obs-meta-item">
                                          <span className="obs-meta-label">Tokens in</span>
                                          <span className="obs-meta-value">{formatTokens(obs.usage.input)}</span>
                                        </div>
                                      )}
                                      {obs.usage?.output != null && (
                                        <div className="obs-meta-item">
                                          <span className="obs-meta-label">Tokens out</span>
                                          <span className="obs-meta-value">{formatTokens(obs.usage.output)}</span>
                                        </div>
                                      )}
                                      {obs.latency != null && (
                                        <div className="obs-meta-item">
                                          <span className="obs-meta-label">Latencia</span>
                                          <span className="obs-meta-value">{formatDuration(obs.latency)}</span>
                                        </div>
                                      )}
                                      {obs.total_cost != null && (
                                        <div className="obs-meta-item">
                                          <span className="obs-meta-label">Costo</span>
                                          <span className="obs-meta-value">${obs.total_cost?.toFixed(6) || '0'}</span>
                                        </div>
                                      )}
                                    </div>
                                    {obs.input && (
                                      <div className="obs-io">
                                        <div className="obs-io-label">Input</div>
                                        <pre className="detail-pre">{typeof obs.input === 'string' ? obs.input : JSON.stringify(obs.input, null, 2)}</pre>
                                      </div>
                                    )}
                                    {obs.output && (
                                      <div className="obs-io">
                                        <div className="obs-io-label">Output</div>
                                        <pre className="detail-pre">{typeof obs.output === 'string' ? obs.output : JSON.stringify(obs.output, null, 2)}</pre>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="empty-state">Sin detalle disponible</div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <div style={{ textAlign: 'center', padding: '16px' }}>
              <button className="btn btn-secondary" onClick={loadMore}>
                Cargar mas ({limit + 20})
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
