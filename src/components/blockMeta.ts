import {
  BookText,
  Calculator,
  LineChart,
  Sigma,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import type { BlockType } from '../types'

export type BlockMeta = {
  icon: LucideIcon
  accentBar: string
  iconBg: string
  iconColor: string
  ringColor: string
  softBg: string
  textColor: string
  buttonBg: string
  buttonHover: string
}

export const BLOCK_META: Record<BlockType, BlockMeta> = {
  text: {
    icon: BookText,
    accentBar: 'bg-slate-300',
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-700',
    ringColor: 'ring-slate-200',
    softBg: 'bg-slate-50',
    textColor: 'text-slate-700',
    buttonBg: 'bg-slate-700',
    buttonHover: 'hover:bg-slate-800',
  },
  formula: {
    icon: Sigma,
    accentBar: 'bg-indigo-500',
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    ringColor: 'ring-indigo-200',
    softBg: 'bg-indigo-50/60',
    textColor: 'text-indigo-700',
    buttonBg: 'bg-indigo-600',
    buttonHover: 'hover:bg-indigo-700',
  },
  graph: {
    icon: LineChart,
    accentBar: 'bg-emerald-500',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    ringColor: 'ring-emerald-200',
    softBg: 'bg-emerald-50/60',
    textColor: 'text-emerald-700',
    buttonBg: 'bg-emerald-600',
    buttonHover: 'hover:bg-emerald-700',
  },
  solver: {
    icon: Calculator,
    accentBar: 'bg-amber-500',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-700',
    ringColor: 'ring-amber-200',
    softBg: 'bg-amber-50/60',
    textColor: 'text-amber-800',
    buttonBg: 'bg-amber-600',
    buttonHover: 'hover:bg-amber-700',
  },
  explanation: {
    icon: Sparkles,
    accentBar: 'bg-violet-500',
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    ringColor: 'ring-violet-200',
    softBg: 'bg-violet-50/60',
    textColor: 'text-violet-700',
    buttonBg: 'bg-violet-600',
    buttonHover: 'hover:bg-violet-700',
  },
}
