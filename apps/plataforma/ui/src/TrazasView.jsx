import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeftIcon, CaretDownIcon, CaretRightIcon, ClockIcon, CpuIcon } from '@phosphor-icons/react'
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
                <span className="col-date">Fecha</span>
                <span className="col-agent">Modelo</span>
                <span className="col-type">Tokens in/out</span>
                <span className="col-field">Duracion</span>
                <span className="col-expand">Estado</span>
              </div>
              {trazas.map((t, i) => {
                const id = t.id || t.trace_id || i
                const isExpanded = expandedId === id
                return (
                  <div key={id} className="table-row-group">
                    <div className="table-row" onClick={() => toggleExpand(t)}>
                      <span className="col-date">{formatDate(t.fecha || t.created_at || t.timestamp)}</span>
                      <span className="col-agent">
                        <CpuIcon size={12} style={{ marginRight: 4 }} />
                        {t.modelo || t.model || '-'}
                      </span>
                      <span className="col-type">
                        {formatTokens(t.tokens_input || t.input_tokens)} / {formatTokens(t.tokens_output || t.output_tokens)}
                      </span>
                      <span className="col-field">
                        <ClockIcon size={12} style={{ marginRight: 4 }} />
                        {formatDuration(t.duracion_s || t.duration)}
                      </span>
                      <span className="col-expand">
                        <span className={`status-badge ${t.status === 'error' ? 'error' : 'active'}`}>
                          {t.status || 'ok'}
                        </span>
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
                            {detail.input && (
                              <div className="detail-section">
                                <div className="detail-section-title">Request (prompt)</div>
                                <pre className="detail-pre">{typeof detail.input === 'string' ? detail.input : JSON.stringify(detail.input, null, 2)}</pre>
                              </div>
                            )}
                            {detail.output && (
                              <div className="detail-section">
                                <div className="detail-section-title">Response</div>
                                <pre className="detail-pre">{typeof detail.output === 'string' ? detail.output : JSON.stringify(detail.output, null, 2)}</pre>
                              </div>
                            )}
                            {(detail.metadata || detail.metricas) && (
                              <div className="detail-section">
                                <div className="detail-section-title">Metadata</div>
                                <pre className="detail-pre">{JSON.stringify(detail.metadata || detail.metricas, null, 2)}</pre>
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
