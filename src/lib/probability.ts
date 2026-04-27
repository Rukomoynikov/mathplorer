export type ProbabilityBlockContent = {
  version: 1
  favorableOutcomes: string
  totalOutcomes: string
}

export type ProbabilityAnalysis =
  | {
      decimal: string
      denominator: number
      favorableOutcomes: number
      numerator: number
      ok: true
      percent: string
      percentValue: number
      totalOutcomes: number
    }
  | {
      message: string
      ok: false
    }

export const DEFAULT_PROBABILITY_BLOCK_CONTENT: ProbabilityBlockContent = {
  version: 1,
  favorableOutcomes: '3',
  totalOutcomes: '8',
}

function isProbabilityBlockContent(
  value: unknown,
): value is ProbabilityBlockContent {
  if (!value || typeof value !== 'object') {
    return false
  }

  const content = value as Record<string, unknown>

  return (
    content.version === 1 &&
    typeof content.favorableOutcomes === 'string' &&
    typeof content.totalOutcomes === 'string'
  )
}

function parseWholeNumber(value: string, label: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return {
      message: `${label} is required.`,
      ok: false as const,
    }
  }

  if (!/^\d+$/.test(trimmed)) {
    return {
      message: `${label} must be a whole number.`,
      ok: false as const,
    }
  }

  const parsed = Number(trimmed)

  if (!Number.isSafeInteger(parsed)) {
    return {
      message: `${label} is too large for this MVP.`,
      ok: false as const,
    }
  }

  return {
    ok: true as const,
    value: parsed,
  }
}

function gcd(left: number, right: number): number {
  let a = Math.abs(left)
  let b = Math.abs(right)

  while (b !== 0) {
    const next = a % b
    a = b
    b = next
  }

  return a
}

function formatDecimal(value: number) {
  return Number(value.toFixed(4)).toString()
}

function formatPercent(value: number) {
  return `${Number((value * 100).toFixed(2)).toString()}%`
}

export function serializeProbabilityBlockContent(
  content: ProbabilityBlockContent,
) {
  return JSON.stringify(content, null, 2)
}

export function parseProbabilityBlockContent(
  content: string,
): ProbabilityBlockContent {
  try {
    const parsed = JSON.parse(content) as unknown

    if (isProbabilityBlockContent(parsed)) {
      return parsed
    }
  } catch {
    // Invalid JSON falls through to the default structured draft.
  }

  return DEFAULT_PROBABILITY_BLOCK_CONTENT
}

export function analyzeProbability(
  content: ProbabilityBlockContent,
): ProbabilityAnalysis {
  const favorableResult = parseWholeNumber(
    content.favorableOutcomes,
    'Favorable outcomes',
  )

  if (!favorableResult.ok) {
    return favorableResult
  }

  const totalResult = parseWholeNumber(content.totalOutcomes, 'Total outcomes')

  if (!totalResult.ok) {
    return totalResult
  }

  const favorableOutcomes = favorableResult.value
  const totalOutcomes = totalResult.value

  if (totalOutcomes === 0) {
    return {
      message: 'Total outcomes must be greater than zero.',
      ok: false,
    }
  }

  if (favorableOutcomes > totalOutcomes) {
    return {
      message: 'Favorable outcomes cannot be greater than total outcomes.',
      ok: false,
    }
  }

  const divisor = gcd(favorableOutcomes, totalOutcomes)
  const numerator = favorableOutcomes / divisor
  const denominator = totalOutcomes / divisor
  const value = favorableOutcomes / totalOutcomes

  return {
    decimal: formatDecimal(value),
    denominator,
    favorableOutcomes,
    numerator,
    ok: true,
    percent: formatPercent(value),
    percentValue: value * 100,
    totalOutcomes,
  }
}
