import { normalizeExpressionText, parseExpression } from './mathEngine'

export function normalizeFormulaContent(content: string) {
  return normalizeExpressionText(content)
}

function toPlainExpressionText(content: string) {
  const parsed = parseExpression(content)

  return parsed.ok ? parsed.value.text : content.trim()
}

export function formulaToGraphContent(content: string) {
  const normalized = normalizeFormulaContent(content)

  if (!normalized) {
    return 'y = '
  }

  if (/^y\s*=/i.test(normalized)) {
    const expression = normalized.replace(/^y\s*=/i, '').trim()

    return `y = ${toPlainExpressionText(expression)}`
  }

  const functionMatch = normalized.match(/^[a-z]\s*\(\s*x\s*\)\s*=\s*(.+)$/i)

  if (functionMatch?.[1]) {
    return `y = ${toPlainExpressionText(functionMatch[1])}`
  }

  return `y = ${toPlainExpressionText(normalized)}`
}
