import { useCallback, useEffect } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MarkerType,
  useNodesState,
  useEdgesState,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import AgentNode from './AgentNode'

const nodeTypes = { agent: AgentNode }

// Strategos palette: blue, green, gold, orange, navy, blue-light
const NODE_COLORS = ['#2175A5', '#78B042', '#D4A800', '#EEA028', '#1E3A5F', '#4A90C4']
// Semantic icon mapping by agent_key keyword
function getIconName(agentKey) {
  const key = agentKey.toLowerCase()
  if (key.includes('analiz')) return 'MagnifyingGlass'
  if (key.includes('coach') || key.includes('chat')) return 'ChatCircle'
  if (key.includes('verific')) return 'CheckCircle'
  if (key.includes('escrit') || key.includes('writer')) return 'FloppyDisk'
  if (key.includes('resum')) return 'Brain'
  if (key.includes('genera')) return 'Gear'
  return 'Robot'
}

function buildGraph(agents, modelos) {
  const nodes = agents.map((agent, i) => ({
    id: agent.agent_key,
    type: 'agent',
    position: { x: 100 + i * 320, y: 140 },
    data: {
      agent,
      modelos,
      color: NODE_COLORS[i % NODE_COLORS.length],
      iconName: getIconName(agent.agent_key),
    },
  }))

  const edges = []
  for (let i = 0; i < agents.length - 1; i++) {
    edges.push({
      id: `${agents[i].agent_key}-${agents[i + 1].agent_key}`,
      source: agents[i].agent_key,
      target: agents[i + 1].agent_key,
      type: 'smoothstep',
      animated: false,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#6B7B8D',
        width: 16,
        height: 16,
      },
      style: { stroke: '#6B7B8D', strokeWidth: 1.5 },
    })
  }

  return { nodes, edges }
}

export default function PipelineCanvas({ agents, modelos, selectedAgent, onSelectAgent }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = buildGraph(agents, modelos)
    setNodes(newNodes)
    setEdges(newEdges)
  }, [agents, modelos, setNodes, setEdges])

  const onNodeClick = useCallback((_, node) => {
    const agent = agents.find(a => a.agent_key === node.id)
    if (agent) onSelectAgent(agent)
  }, [agents, onSelectAgent])

  return (
    <div className="canvas-area">
      <ReactFlow
        nodes={nodes.map(n => ({
          ...n,
          selected: selectedAgent?.agent_key === n.id,
          data: { ...n.data, modelos },
        }))}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.4 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant="dots" color="#E8E5DE" gap={24} size={1.5} />
        <Controls position="bottom-left" />
      </ReactFlow>
    </div>
  )
}
