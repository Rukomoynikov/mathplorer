import { useId, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import {
  Braces,
  Calculator,
  Diff,
  EqualApproximately,
  LineChart,
  Replace,
  Sigma,
  Sparkles,
  Tangent,
  Variable,
  Wand,
  type LucideIcon,
} from 'lucide-react'
import BlockEditorShell from './BlockEditorShell'
import type { NotebookViewMode } from '../../types'
import { createDerivativePreview } from '../../lib/calculusTools'
import { parseExpression } from '../../lib/mathEngine'

type FormulaBlockProps = {
  content: string
  mode: NotebookViewMode
  onChange: (content: string) => void
  onDifferentiate: (variable: string) => void
  onEvaluateDerivative: (variable: string, point: string) => void
  onExplain: () => void
  onExpand: () => void
  onGraph: () => void
  onIntegrateDefinite: (
    variable: string,
    lowerBound: string,
    upperBound: string,
  ) => void
  onSimplify: () => void
  onSubstitute: (substitution: string) => void
  onTangentLine: (variable: string, point: string) => void
}

type FormulaActionButtonProps = {
  disabled?: boolean
  icon: LucideIcon
  label: string
  onClick?: () => void
  type?: 'button' | 'submit'
  tone?: 'accent' | 'neutral' | 'success'
}

const ACTION_BUTTON_TONES: Record<
  NonNullable<FormulaActionButtonProps['tone']>,
  string
> = {
  accent:
    'border-indigo-200 bg-indigo-50 text-indigo-700 hover:border-indigo-300 hover:bg-indigo-100',
  neutral:
    'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
  success:
    'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100',
}

function FormulaActionButton({
  disabled = false,
  icon: Icon,
  label,
  onClick,
  type = 'button',
  tone = 'neutral',
}: FormulaActionButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-8 min-w-0 items-center justify-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold leading-5 transition focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 ${ACTION_BUTTON_TONES[tone]}`}
    >
      <Icon size={13} aria-hidden="true" className="shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  )
}

type FormulaInlineInputProps = {
  icon?: LucideIcon
  id: string
  label: string
  onChange: (value: string) => void
  placeholder: string
  value: string
}

function FormulaInlineInput({
  icon: Icon,
  id,
  label,
  onChange,
  placeholder,
  value,
}: FormulaInlineInputProps) {
  return (
    <label htmlFor={id} className="flex min-w-0 flex-col gap-1">
      <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {Icon && <Icon size={12} aria-hidden="true" />}
        {label}
      </span>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-8 min-w-0 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-xs leading-5 text-slate-900 shadow-sm transition focus:border-indigo-300 focus:outline-none focus:ring-4 focus:ring-indigo-100"
      />
    </label>
  )
}

type FormulaSectionProps = {
  children: ReactNode
  icon: LucideIcon
  title: string
}

function FormulaSection({ children, icon: Icon, title }: FormulaSectionProps) {
  return (
    <section className="space-y-2 border-t border-slate-200 pt-3">
      <h4 className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        <Icon size={12} aria-hidden="true" />
        {title}
      </h4>
      {children}
    </section>
  )
}

function toDisplayMath(content: string) {
  const trimmed = content.trim()

  if (!trimmed) {
    return ''
  }

  if (trimmed.startsWith('$$') && trimmed.endsWith('$$')) {
    return trimmed
  }

  if (trimmed.startsWith('\\[') && trimmed.endsWith('\\]')) {
    return `$$\n${trimmed.slice(2, -2).trim()}\n$$`
  }

  return `$$\n${trimmed}\n$$`
}

function variableToDisplayTex(variable: string) {
  if (/^[A-Za-z]$/.test(variable)) {
    return variable
  }

  return `\\mathrm{${variable.replace(/_/g, '\\_')}}`
}

function MathPreview({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false }]]}
    >
      {children}
    </ReactMarkdown>
  )
}

type FormulaPreviewProps = {
  content: string
  mode: NotebookViewMode
}

function FormulaPreview({ content, mode }: FormulaPreviewProps) {
  const displayMath = toDisplayMath(content)
  const validation = useMemo(() => {
    if (!content.trim()) {
      return null
    }

    return parseExpression(content)
  }, [content])
  const hasError = validation?.ok === false

  if (mode === 'preview') {
    return displayMath ? (
      <div className="overflow-x-auto text-center text-slate-950">
        <MathPreview>{displayMath}</MathPreview>
      </div>
    ) : null
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        Formula preview
      </p>
      <div
        aria-live="polite"
        className={`min-h-24 overflow-x-auto rounded-lg border px-3.5 py-4 text-slate-900 ${
          hasError
            ? 'border-amber-200 bg-amber-50/60'
            : 'border-slate-200 bg-slate-50/70'
        }`}
      >
        {hasError ? (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-amber-800">
              This formula needs a quick fix before math tools can use it.
            </p>
            <p className="text-xs leading-5 text-amber-700">
              {validation.error.message}
            </p>
          </div>
        ) : displayMath ? (
          <div className="text-center">
            <MathPreview>{displayMath}</MathPreview>
          </div>
        ) : (
          <p className="text-sm leading-6 text-slate-500">
            Enter a formula to preview it here.
          </p>
        )}
      </div>
    </div>
  )
}

type TransformToolsProps = {
  disabled: boolean
  onExpand: () => void
  onSimplify: () => void
}

function TransformTools({ disabled, onExpand, onSimplify }: TransformToolsProps) {
  return (
    <FormulaSection icon={Wand} title="Transform">
      <div className="grid gap-2 sm:grid-cols-2">
        <FormulaActionButton
          icon={Wand}
          label="Simplify"
          onClick={onSimplify}
          disabled={disabled}
          tone="accent"
        />
        <FormulaActionButton
          icon={Braces}
          label="Expand"
          onClick={onExpand}
          disabled={disabled}
        />
      </div>
    </FormulaSection>
  )
}

type CalculusToolsProps = {
  calculusPoint: string
  calculusPointInputId: string
  calculusVariable: string
  calculusVariableInputId: string
  canRunCalculus: boolean
  derivativePreviewMath: string
  derivativePreviewMessage: string
  integralLowerBound: string
  integralLowerInputId: string
  integralUpperBound: string
  integralUpperInputId: string
  isDerivativePreviewError: boolean
  onDerivativeAtPointSubmit: (event: FormEvent<HTMLFormElement>) => void
  onDifferentiate: (variable: string) => void
  onIntegralSubmit: (event: FormEvent<HTMLFormElement>) => void
  onIntegralLowerChange: (value: string) => void
  onIntegralUpperChange: (value: string) => void
  onPointChange: (value: string) => void
  onTangentLine: (variable: string, point: string) => void
  onVariableChange: (value: string) => void
}

function CalculusTools({
  calculusPoint,
  calculusPointInputId,
  calculusVariable,
  calculusVariableInputId,
  canRunCalculus,
  derivativePreviewMath,
  derivativePreviewMessage,
  integralLowerBound,
  integralLowerInputId,
  integralUpperBound,
  integralUpperInputId,
  isDerivativePreviewError,
  onDerivativeAtPointSubmit,
  onDifferentiate,
  onIntegralSubmit,
  onIntegralLowerChange,
  onIntegralUpperChange,
  onPointChange,
  onTangentLine,
  onVariableChange,
}: CalculusToolsProps) {
  const canUsePoint = canRunCalculus && Boolean(calculusPoint.trim())
  const canIntegrate =
    canRunCalculus &&
    Boolean(integralLowerBound.trim()) &&
    Boolean(integralUpperBound.trim())

  return (
    <FormulaSection icon={Diff} title="Calculus">
      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="min-h-16 overflow-x-auto rounded-md bg-slate-50 px-3 py-2.5">
          {derivativePreviewMath ? (
            <div className="text-center text-sm text-slate-900">
              <MathPreview>{derivativePreviewMath}</MathPreview>
            </div>
          ) : (
            <p
              className={`text-xs leading-5 ${
                isDerivativePreviewError ? 'text-amber-700' : 'text-slate-500'
              }`}
            >
              {derivativePreviewMessage}
            </p>
          )}
        </div>

        <form onSubmit={onDerivativeAtPointSubmit} className="mt-3 space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <FormulaInlineInput
              id={calculusVariableInputId}
              icon={Variable}
              label="Variable"
              value={calculusVariable}
              onChange={onVariableChange}
              placeholder="x"
            />
            <FormulaInlineInput
              id={calculusPointInputId}
              icon={Calculator}
              label="Point"
              value={calculusPoint}
              onChange={onPointChange}
              placeholder="2"
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <FormulaActionButton
              icon={Diff}
              label="Derivative"
              onClick={() => onDifferentiate(calculusVariable)}
              disabled={!canRunCalculus}
              tone="accent"
            />
            <FormulaActionButton
              icon={EqualApproximately}
              label="At point"
              type="submit"
              disabled={!canUsePoint}
            />
            <FormulaActionButton
              icon={Tangent}
              label="Tangent"
              onClick={() => onTangentLine(calculusVariable, calculusPoint)}
              disabled={!canUsePoint}
            />
          </div>
        </form>

        <form
          onSubmit={onIntegralSubmit}
          className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end"
        >
          <FormulaInlineInput
            id={integralLowerInputId}
            label="From"
            value={integralLowerBound}
            onChange={onIntegralLowerChange}
            placeholder="0"
          />
          <FormulaInlineInput
            id={integralUpperInputId}
            label="To"
            value={integralUpperBound}
            onChange={onIntegralUpperChange}
            placeholder="1"
          />
          <FormulaActionButton
            icon={Sigma}
            label="Integral"
            type="submit"
            disabled={!canIntegrate}
          />
        </form>
      </div>
    </FormulaSection>
  )
}

type SubstitutionToolProps = {
  disabled: boolean
  inputId: string
  onChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  substitution: string
}

function SubstitutionTool({
  disabled,
  inputId,
  onChange,
  onSubmit,
  substitution,
}: SubstitutionToolProps) {
  return (
    <FormulaSection icon={Replace} title="Substitute">
      <form
        onSubmit={onSubmit}
        className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
      >
        <FormulaInlineInput
          id={inputId}
          label="Value"
          value={substitution}
          onChange={onChange}
          placeholder="x = 2"
        />
        <FormulaActionButton
          icon={Replace}
          label="Apply"
          type="submit"
          disabled={disabled}
          tone="accent"
        />
      </form>
    </FormulaSection>
  )
}

type OutputActionsProps = {
  disabled: boolean
  onExplain: () => void
  onGraph: () => void
}

function OutputActions({ disabled, onExplain, onGraph }: OutputActionsProps) {
  return (
    <FormulaSection icon={LineChart} title="Output">
      <div className="grid gap-2 sm:grid-cols-2">
        <FormulaActionButton
          icon={LineChart}
          label="Graph"
          onClick={onGraph}
          disabled={disabled}
          tone="success"
        />
        <FormulaActionButton
          icon={Sparkles}
          label="Explain"
          onClick={onExplain}
          disabled={disabled}
        />
      </div>
    </FormulaSection>
  )
}

export default function FormulaBlock({
  content,
  mode,
  onChange,
  onDifferentiate,
  onEvaluateDerivative,
  onExplain,
  onExpand,
  onGraph,
  onIntegrateDefinite,
  onSimplify,
  onSubstitute,
  onTangentLine,
}: FormulaBlockProps) {
  const substitutionInputId = useId()
  const calculusVariableInputId = useId()
  const calculusPointInputId = useId()
  const integralLowerInputId = useId()
  const integralUpperInputId = useId()
  const [substitution, setSubstitution] = useState('x = 2')
  const [calculusVariable, setCalculusVariable] = useState('x')
  const [calculusPoint, setCalculusPoint] = useState('2')
  const [integralLowerBound, setIntegralLowerBound] = useState('0')
  const [integralUpperBound, setIntegralUpperBound] = useState('1')
  const hasFormulaContent = Boolean(content.trim())
  const canRunCalculus = hasFormulaContent && Boolean(calculusVariable.trim())
  const derivativePreview = useMemo(() => {
    if (!canRunCalculus) {
      return null
    }

    return createDerivativePreview(content, calculusVariable)
  }, [calculusVariable, canRunCalculus, content])
  const derivativePreviewMath =
    derivativePreview?.ok === true
      ? `$$\n\\frac{d}{d${variableToDisplayTex(
          derivativePreview.value.variable,
        )}}\\left(${derivativePreview.value.sourceTex}\\right) = ${
          derivativePreview.value.derivativeTex
        }\n$$`
      : ''
  const derivativePreviewMessage = derivativePreview?.ok === false
    ? derivativePreview.error.message
    : 'Add a formula to preview its derivative.'

  function handleSubstituteSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!hasFormulaContent || !substitution.trim()) {
      return
    }

    onSubstitute(substitution)
  }

  function handleDerivativeAtPointSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canRunCalculus || !calculusPoint.trim()) {
      return
    }

    onEvaluateDerivative(calculusVariable, calculusPoint)
  }

  function handleDefiniteIntegralSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (
      !canRunCalculus ||
      !integralLowerBound.trim() ||
      !integralUpperBound.trim()
    ) {
      return
    }

    onIntegrateDefinite(
      calculusVariable,
      integralLowerBound,
      integralUpperBound,
    )
  }

  return (
    <BlockEditorShell
      label="Formula"
      helperText="Capture a formula you want to study, transform, or graph."
      mode={mode}
      output={
        <div>
          <FormulaPreview content={content} mode={mode} />
          {mode === 'edit' && (
            <div className="mt-4 space-y-3">
              <TransformTools
                disabled={!hasFormulaContent}
                onExpand={onExpand}
                onSimplify={onSimplify}
              />
              <CalculusTools
                calculusPoint={calculusPoint}
                calculusPointInputId={calculusPointInputId}
                calculusVariable={calculusVariable}
                calculusVariableInputId={calculusVariableInputId}
                canRunCalculus={canRunCalculus}
                derivativePreviewMath={derivativePreviewMath}
                derivativePreviewMessage={derivativePreviewMessage}
                integralLowerBound={integralLowerBound}
                integralLowerInputId={integralLowerInputId}
                integralUpperBound={integralUpperBound}
                integralUpperInputId={integralUpperInputId}
                isDerivativePreviewError={derivativePreview?.ok === false}
                onDerivativeAtPointSubmit={handleDerivativeAtPointSubmit}
                onDifferentiate={onDifferentiate}
                onIntegralSubmit={handleDefiniteIntegralSubmit}
                onIntegralLowerChange={setIntegralLowerBound}
                onIntegralUpperChange={setIntegralUpperBound}
                onPointChange={setCalculusPoint}
                onTangentLine={onTangentLine}
                onVariableChange={setCalculusVariable}
              />
              <SubstitutionTool
                disabled={!hasFormulaContent || !substitution.trim()}
                inputId={substitutionInputId}
                onChange={setSubstitution}
                onSubmit={handleSubstituteSubmit}
                substitution={substitution}
              />
              <OutputActions
                disabled={!hasFormulaContent}
                onExplain={onExplain}
                onGraph={onGraph}
              />
            </div>
          )}
        </div>
      }
    >
      <textarea
        value={content}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        placeholder="f(x) = x^2 - 4x + 3"
        className="min-h-28 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-sm leading-6 text-slate-900 shadow-sm transition focus:border-indigo-300 focus:outline-none focus:ring-4 focus:ring-indigo-100"
      />
    </BlockEditorShell>
  )
}
