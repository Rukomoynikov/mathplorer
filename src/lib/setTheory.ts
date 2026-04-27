export type SetBlockContent = {
  version: 1
  setA: string
  setB: string
}

export type ParsedFiniteSet = {
  items: string[]
  label: string
  warnings: string[]
}

export type SetOperationAnalysis = {
  aOnly: string[]
  bOnly: string[]
  differenceAB: string[]
  differenceBA: string[]
  intersection: string[]
  setA: ParsedFiniteSet
  setB: ParsedFiniteSet
  symmetricDifference: string[]
  union: string[]
  warnings: string[]
}

export const DEFAULT_SET_BLOCK_CONTENT: SetBlockContent = {
  version: 1,
  setA: '1, 2, 3, 4',
  setB: '3, 4, 5',
}

function normalizeSetEntry(entry: string) {
  return entry.trim().replace(/\s+/g, ' ')
}

function stripOptionalBraces(input: string) {
  const trimmed = input.trim()

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return trimmed.slice(1, -1)
  }

  return input
}

function uniqueIntersection(left: string[], right: string[]) {
  const rightItems = new Set(right)

  return left.filter((item) => rightItems.has(item))
}

function uniqueDifference(left: string[], right: string[]) {
  const rightItems = new Set(right)

  return left.filter((item) => !rightItems.has(item))
}

function isSetBlockContent(value: unknown): value is SetBlockContent {
  if (!value || typeof value !== 'object') {
    return false
  }

  const content = value as Record<string, unknown>

  return (
    content.version === 1 &&
    typeof content.setA === 'string' &&
    typeof content.setB === 'string'
  )
}

export function serializeSetBlockContent(content: SetBlockContent) {
  return JSON.stringify(content, null, 2)
}

export function parseSetBlockContent(content: string): SetBlockContent {
  try {
    const parsed = JSON.parse(content) as unknown

    if (isSetBlockContent(parsed)) {
      return parsed
    }
  } catch {
    if (content.trim()) {
      return {
        ...DEFAULT_SET_BLOCK_CONTENT,
        setA: content,
        setB: '',
      }
    }
  }

  return DEFAULT_SET_BLOCK_CONTENT
}

export function parseFiniteSet(input: string, label: string): ParsedFiniteSet {
  const pieces = stripOptionalBraces(input).split(/[,\n;]/)
  const seen = new Set<string>()
  const duplicateItems = new Set<string>()
  const items: string[] = []
  let blankEntryCount = 0

  for (const piece of pieces) {
    const item = normalizeSetEntry(piece)

    if (!item) {
      blankEntryCount += 1
      continue
    }

    if (seen.has(item)) {
      duplicateItems.add(item)
      continue
    }

    seen.add(item)
    items.push(item)
  }

  const warnings: string[] = []

  if (blankEntryCount > 0 && input.trim()) {
    warnings.push(
      `${label}: ignored ${blankEntryCount} blank ${
        blankEntryCount === 1 ? 'entry' : 'entries'
      }.`,
    )
  }

  if (duplicateItems.size > 0) {
    warnings.push(
      `${label}: ignored duplicate ${
        duplicateItems.size === 1 ? 'entry' : 'entries'
      } ${Array.from(duplicateItems).join(', ')}.`,
    )
  }

  return {
    items,
    label,
    warnings,
  }
}

export function analyzeSetOperations(
  setAInput: string,
  setBInput: string,
): SetOperationAnalysis {
  const setA = parseFiniteSet(setAInput, 'Set A')
  const setB = parseFiniteSet(setBInput, 'Set B')
  const aOnly = uniqueDifference(setA.items, setB.items)
  const bOnly = uniqueDifference(setB.items, setA.items)
  const intersection = uniqueIntersection(setA.items, setB.items)
  const union = [...setA.items, ...bOnly]
  const symmetricDifference = [...aOnly, ...bOnly]

  return {
    aOnly,
    bOnly,
    differenceAB: aOnly,
    differenceBA: bOnly,
    intersection,
    setA,
    setB,
    symmetricDifference,
    union,
    warnings: [...setA.warnings, ...setB.warnings],
  }
}

export function formatFiniteSet(items: string[]) {
  return items.length > 0 ? `{ ${items.join(', ')} }` : '∅'
}
