export type CombinatoricsMode = 'combination' | 'factorial' | 'permutation'

export type CombinatoricsBlockContent = {
  version: 1
  mode: CombinatoricsMode
  n: string
  r: string
}

export type CombinatoricsCalculation =
  | {
      formula: string
      interpretation: string
      mode: CombinatoricsMode
      n: number
      ok: true
      r?: number
      result: bigint
      resultLabel: string
    }
  | {
      message: string
      ok: false
    }

export const COMBINATORICS_N_LIMIT = 100

export const DEFAULT_COMBINATORICS_BLOCK_CONTENT: CombinatoricsBlockContent = {
  version: 1,
  mode: 'combination',
  n: '5',
  r: '2',
}

const MODE_LABELS: Record<CombinatoricsMode, string> = {
  combination: 'Combination',
  factorial: 'Factorial',
  permutation: 'Permutation',
}

function isCombinatoricsMode(value: unknown): value is CombinatoricsMode {
  return (
    value === 'combination' ||
    value === 'factorial' ||
    value === 'permutation'
  )
}

function isCombinatoricsBlockContent(
  value: unknown,
): value is CombinatoricsBlockContent {
  if (!value || typeof value !== 'object') {
    return false
  }

  const content = value as Record<string, unknown>

  return (
    content.version === 1 &&
    isCombinatoricsMode(content.mode) &&
    typeof content.n === 'string' &&
    typeof content.r === 'string'
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

function factorialBigInt(n: number) {
  let result = 1n

  for (let factor = 2; factor <= n; factor += 1) {
    result *= BigInt(factor)
  }

  return result
}

function permutationBigInt(n: number, r: number) {
  let result = 1n

  for (let factor = n - r + 1; factor <= n; factor += 1) {
    result *= BigInt(factor)
  }

  return result
}

function combinationBigInt(n: number, r: number) {
  const smallerGroupSize = Math.min(r, n - r)
  let result = 1n

  for (let index = 1; index <= smallerGroupSize; index += 1) {
    result = (result * BigInt(n - smallerGroupSize + index)) / BigInt(index)
  }

  return result
}

export function serializeCombinatoricsBlockContent(
  content: CombinatoricsBlockContent,
) {
  return JSON.stringify(content, null, 2)
}

export function parseCombinatoricsBlockContent(
  content: string,
): CombinatoricsBlockContent {
  try {
    const parsed = JSON.parse(content) as unknown

    if (isCombinatoricsBlockContent(parsed)) {
      return parsed
    }
  } catch {
    // Invalid JSON falls through to the default structured draft.
  }

  return DEFAULT_COMBINATORICS_BLOCK_CONTENT
}

export function calculateCombinatorics(
  content: CombinatoricsBlockContent,
): CombinatoricsCalculation {
  const nResult = parseWholeNumber(content.n, 'n')

  if (!nResult.ok) {
    return nResult
  }

  const n = nResult.value

  if (n > COMBINATORICS_N_LIMIT) {
    return {
      message: `n must be ${COMBINATORICS_N_LIMIT} or less for this MVP.`,
      ok: false,
    }
  }

  if (content.mode === 'factorial') {
    return {
      formula: `${n}!`,
      interpretation: `Arrange all ${n} items in a row.`,
      mode: content.mode,
      n,
      ok: true,
      result: factorialBigInt(n),
      resultLabel: `${n}!`,
    }
  }

  const rResult = parseWholeNumber(content.r, 'r')

  if (!rResult.ok) {
    return rResult
  }

  const r = rResult.value

  if (r > n) {
    return {
      message: 'r must be less than or equal to n.',
      ok: false,
    }
  }

  if (content.mode === 'permutation') {
    return {
      formula: `P(${n}, ${r}) = ${n}! / (${n} - ${r})!`,
      interpretation: `Choose ${r} from ${n}, where order matters.`,
      mode: content.mode,
      n,
      ok: true,
      r,
      result: permutationBigInt(n, r),
      resultLabel: `P(${n}, ${r})`,
    }
  }

  return {
    formula: `C(${n}, ${r}) = ${n}! / (${r}!(${n} - ${r})!)`,
    interpretation: `Choose ${r} from ${n}, where order does not matter.`,
    mode: content.mode,
    n,
    ok: true,
    r,
    result: combinationBigInt(n, r),
    resultLabel: `C(${n}, ${r})`,
  }
}

export function formatBigInt(value: bigint) {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export function getCombinatoricsModeLabel(mode: CombinatoricsMode) {
  return MODE_LABELS[mode]
}
