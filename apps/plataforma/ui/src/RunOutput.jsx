import { useMemo } from 'react'
import { RocketLaunchIcon, CheckCircleIcon, XCircleIcon, ClockIcon, CpuIcon, ListBulletsIcon } from '@phosphor-icons/react'

function parseOutput(raw) {
  if (!raw) return null

  const sections = []
  let currentSection = null

  const lines = raw.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()

    // Skip empty box-drawing lines
    if (/^[╭╰│╮╯─┐┘┌└]+$/.test(trimmed)) continue
    if (/^[=]+$/.test(trimmed)) continue
    if (!trimmed) continue

    // Detect section headers
    if (trimmed.includes('Crew Execution Started')) {
      currentSection = { type: 'start', title: 'Pipeline iniciado', lines: [], status: 'running' }
      sections.push(currentSection)
      continue
    }
    if (trimmed.includes('Task Started')) {
      currentSection = { type: 'task', title: 'Task', lines: [], status: 'running' }
      sections.push(currentSection)
      continue
    }
    if (trimmed.includes('Agent Started')) {
      currentSection = { type: 'agent', title: 'Agente', lines: [], status: 'running' }
      sections.push(currentSection)
      continue
    }
    if (trimmed.includes('Agent Final Answer')) {
      currentSection = { type: 'answer', title: 'Resultado del agente', lines: [], status: 'done' }
      sections.push(currentSection)
      continue
    }
    if (trimmed.includes('Task Completion') || trimmed.includes('Task Completed')) {
      if (currentSection) currentSection.status = 'done'
      currentSection = null
      continue
    }
    if (trimmed.includes('Crew Completion') || trimmed.includes('Crew Execution Completed')) {
      currentSection = { type: 'complete', title: 'Pipeline completado', lines: [], status: 'done' }
      sections.push(currentSection)
      continue
    }
    if (trimmed.includes('RESULTADO')) {
      currentSection = { type: 'result', title: 'Resultado final', lines: [], status: 'done' }
      sections.push(currentSection)
      continue
    }
    if (trimmed.includes('Tracing Status') || trimmed.includes('Tracing is disabled')) {
      continue
    }

    // Parse metadata from CREW LUCAPI header block
    if (trimmed.startsWith('CREW ')) {
      if (sections.length > 0 && sections[sections.length - 1].type === 'start') {
        sections[sections.length - 1].lines.push({ key: 'Crew', value: trimmed.replace('CREW ', '') })
      }
      continue
    }
    if (trimmed.startsWith('Pipeline:')) {
      if (sections.length > 0) sections[sections.length - 1].lines.push({ key: 'Pipeline', value: trimmed.replace('Pipeline: ', '') })
      continue
    }
    if (trimmed.startsWith('analizador:') || trimmed.startsWith('coach:')) {
      if (sections.length > 0) sections[sections.length - 1].lines.push({ key: trimmed.split(':')[0], value: trimmed.split(':').slice(1).join(':').trim() })
      continue
    }
    if (trimmed.startsWith('Texto:')) {
      if (sections.length > 0) sections[sections.length - 1].lines.push({ key: 'Texto', value: trimmed.replace('Texto: ', '') })
      continue
    }
    if (trimmed.startsWith('Config:')) {
      continue
    }

    // Parse key:value lines
    if (trimmed.startsWith('Name:') && currentSection) {
      const val = trimmed.replace('Name:', '').trim()
      if (val) currentSection.title = val.substring(0, 80) + (val.length > 80 ? '...' : '')
      continue
    }
    if (trimmed.startsWith('Agent:') && currentSection) {
      currentSection.lines.push({ key: 'Agente', value: trimmed.replace('Agent:', '').trim() })
      continue
    }
    if (trimmed.startsWith('ID:')) {
      if (currentSection) currentSection.lines.push({ key: 'ID', value: '' })
      continue
    }
    if (trimmed.startsWith('Final Output:') && currentSection) {
      currentSection.lines.push({ key: 'Output', value: trimmed.replace('Final Output:', '').trim() })
      continue
    }
    if (trimmed.startsWith('Final Answer:') && currentSection) {
      continue
    }

    // Langfuse / output lines
    if (trimmed.startsWith('[Langfuse]')) {
      if (sections.length === 0) sections.push({ type: 'info', title: 'Info', lines: [], status: 'done' })
      sections[sections.length > 0 ? sections.length - 1 : 0].lines.push({ key: 'Langfuse', value: trimmed.replace('[Langfuse] ', '') })
      continue
    }
    if (trimmed.startsWith('Output guardado')) {
      continue
    }
    if (trimmed.match(/^Duraci[oó]n:/)) {
      if (sections.length > 0) sections[sections.length - 1].lines.push({ key: 'Duracion', value: trimmed.split(':').slice(1).join(':').trim() })
      continue
    }

    // UUID-like lines (run IDs)
    if (/^[0-9a-f]{8}-[0-9a-f]{4}/.test(trimmed) && currentSection) {
      const lastLine = currentSection.lines[currentSection.lines.length - 1]
      if (lastLine && lastLine.key === 'ID') lastLine.value = trimmed
      continue
    }

    // Content lines — add to current section
    if (currentSection) {
      currentSection.lines.push({ key: null, value: trimmed })
    }
  }

  return sections
}

function SectionIcon({ type }) {
  if (type === 'start') return <RocketLaunchIcon size={16} weight="bold" />
  if (type === 'agent' || type === 'task') return <CpuIcon size={16} weight="bold" />
  if (type === 'answer' || type === 'result') return <CheckCircleIcon size={16} weight="bold" />
  if (type === 'complete') return <CheckCircleIcon size={16} weight="bold" />
  return <ListBulletsIcon size={16} weight="bold" />
}

function StatusColor({ status }) {
  if (status === 'done') return 'var(--green)'
  if (status === 'running') return 'var(--gold)'
  return 'var(--text-secondary)'
}

export default function RunOutput({ output }) {
  const sections = useMemo(() => parseOutput(output), [output])

  if (!sections || sections.length === 0) {
    return <div className="run-empty">Esperando output...</div>
  }

  return (
    <div className="run-sections">
      {sections.map((sec, i) => (
        <div key={i} className={`run-section run-section-${sec.type}`}>
          <div className="run-section-header">
            <span className="run-section-icon" style={{ color: StatusColor({ status: sec.status }) }}>
              <SectionIcon type={sec.type} />
            </span>
            <span className="run-section-title">{sec.title}</span>
            <span className="run-section-status" style={{ color: StatusColor({ status: sec.status }) }}>
              {sec.status === 'done' ? 'OK' : sec.status === 'running' ? '...' : ''}
            </span>
          </div>
          {sec.lines.length > 0 && (
            <div className="run-section-body">
              {sec.lines.map((line, j) => (
                line.key ? (
                  <div key={j} className="run-kv">
                    <span className="run-kv-key">{line.key}</span>
                    <span className="run-kv-value">{line.value}</span>
                  </div>
                ) : (
                  <div key={j} className="run-text">{line.value}</div>
                )
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
