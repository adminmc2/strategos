import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Dashboard from './Dashboard'
import Editor from './Editor'
import ReglasView from './ReglasView'
import CorreccionesView from './CorreccionesView'
import TrazasView from './TrazasView'
import { fetchModelos, fetchVersion } from './api'

export default function App() {
  const [modelos, setModelos] = useState([])
  const [version, setVersion] = useState('?')

  useEffect(() => {
    Promise.all([fetchModelos(), fetchVersion()])
      .then(([ms, v]) => { setModelos(ms); setVersion(v.version) })
      .catch(console.error)
  }, [])

  return (
    <Routes>
      <Route path="/" element={<Dashboard version={version} />} />
      <Route path="/crew/:crewName" element={<Editor modelos={modelos} version={version} />} />
      <Route path="/crew/:crewName/correcciones" element={<CorreccionesView />} />
      <Route path="/crew/:crewName/reglas" element={<ReglasView />} />
      <Route path="/crew/:crewName/trazas" element={<TrazasView />} />
    </Routes>
  )
}
