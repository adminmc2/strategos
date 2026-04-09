import { Handle, Position } from '@xyflow/react'
import { MagnifyingGlassIcon, ChatCircleIcon, CheckCircleIcon, FloppyDiskIcon, BrainIcon, GearIcon, RobotIcon } from '@phosphor-icons/react'

const ICON_MAP = {
  MagnifyingGlass: MagnifyingGlassIcon,
  ChatCircle: ChatCircleIcon,
  CheckCircle: CheckCircleIcon,
  FloppyDisk: FloppyDiskIcon,
  Brain: BrainIcon,
  Gear: GearIcon,
  Robot: RobotIcon,
}

export default function AgentNode({ data, selected }) {
  const { agent, modelos, color, iconName } = data
  const modelId = agent.llm_model || ''
  const modelInfo = modelos?.find(m => m.id === modelId)
  const shortName = modelInfo?.name || modelId.split('/').pop() || '?'
  const IconComponent = ICON_MAP[iconName] || RobotIcon

  return (
    <div className={`agent-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Left} />
      <div className="node-header" style={{ background: color || '#3b82f6' }}>
        <IconComponent size={16} weight="bold" color="#fff" />
        <span>{agent.agent_key.toUpperCase()}</span>
      </div>
      <div className="node-body">
        <div className="role-preview">{agent.role?.substring(0, 60) || 'Sin role definido'}...</div>
        <div className="model">{shortName} &middot; t:{agent.llm_temperature ?? '?'}</div>
        <div className="badges">
          {modelInfo?.vision && <span className="badge vision">vision</span>}
          {modelInfo?.function_calling && <span className="badge tools">tools</span>}
          {modelInfo?.reasoning && <span className="badge reasoning">reasoning</span>}
        </div>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
