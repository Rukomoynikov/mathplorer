export function normalizeFormulaContent(content: string) {
  const trimmed = content.trim()

  if (trimmed.startsWith('$$') && trimmed.endsWith('$$')) {
    return trimmed.slice(2, -2).trim()
  }

  if (trimmed.startsWith('\\[') && trimmed.endsWith('\\]')) {
    return trimmed.slice(2, -2).trim()
  }

  return trimmed
}

export function formulaToGraphContent(content: string) {
  const normalized = normalizeFormulaContent(content)

  if (!normalized) {
    return 'y = '
  }

  if (/^y\s*=/.test(normalized)) {
    return normalized
  }

  const functionMatch = normalized.match(/^[a-z]\s*\(\s*x\s*\)\s*=\s*(.+)$/i)

  if (functionMatch?.[1]) {
    return `y = ${functionMatch[1].trim()}`
  }

  return `y = ${normalized}`
}
