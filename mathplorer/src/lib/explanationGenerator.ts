export type ExplanationResult = {
  examples?: string[]
  paragraphs: string[]
  title: string
  topic: string
}

const FALLBACK_TOPICS =
  'slope, linear equations, quadratics, parabolas, factoring, derivatives, or graphs'

function hasAnyKeyword(prompt: string, keywords: string[]) {
  return keywords.some((keyword) => prompt.includes(keyword))
}

function hasLinearEquationPattern(prompt: string) {
  return /x/.test(prompt) && /=/.test(prompt)
}

// Keep this pure and deterministic so an LLM-backed service can later swap in here.
export function generateLocalExplanation(prompt: string): ExplanationResult {
  const normalizedPrompt = prompt.toLowerCase()

  if (
    hasAnyKeyword(normalizedPrompt, [
      'derivative',
      'd/dx',
      'rate of change',
      'tangent',
    ])
  ) {
    return {
      title: 'Derivative as Instant Rate of Change',
      topic: 'derivative',
      paragraphs: [
        'A derivative tells you how quickly a quantity is changing at one exact input value. On a graph, it is the slope of the tangent line at that point.',
        'For a function like y = x^2, the slope is not constant. The derivative gives a new rule that tells you the slope at each x-value.',
        'A useful way to think about it is: average rate of change uses two points, while a derivative zooms in until those two points become almost the same point.',
      ],
      examples: [
        'If f(x) = x^2, then f\'(x) = 2x.',
        'At x = 3, the slope of the tangent line is 2(3) = 6.',
      ],
    }
  }

  if (
    hasAnyKeyword(normalizedPrompt, [
      'factoring',
      'factor',
      'roots',
      'zeroes',
      'zeros',
    ])
  ) {
    return {
      title: 'Factoring Finds Multiplication Structure',
      topic: 'factoring',
      paragraphs: [
        'Factoring rewrites an expression as a product of smaller pieces. It is like undoing distribution.',
        'For quadratics, factoring is useful because each factor can reveal a root. If a product equals zero, then at least one factor must equal zero.',
        'This is why a factored form such as (x - 1)(x - 3) makes the x-intercepts easy to see: the graph crosses the x-axis at x = 1 and x = 3.',
      ],
      examples: [
        'x^2 - 4x + 3 factors into (x - 1)(x - 3).',
        'Set each factor equal to zero: x - 1 = 0 or x - 3 = 0.',
      ],
    }
  }

  if (
    hasAnyKeyword(normalizedPrompt, [
      'parabola',
      'vertex',
      'axis of symmetry',
      'opens',
    ])
  ) {
    return {
      title: 'How a Parabola Changes Shape',
      topic: 'parabola',
      paragraphs: [
        'A parabola is the U-shaped graph of a quadratic function. Its vertex is the turning point, and its axis of symmetry runs through the vertex.',
        'In y = ax^2, the value of a controls both direction and width. A positive a opens upward, while a negative a opens downward.',
        'The farther a is from zero, the narrower the parabola becomes. When a is closer to zero, the parabola becomes wider because y-values grow more slowly.',
      ],
      examples: [
        'y = 3x^2 is narrower than y = x^2.',
        'y = -x^2 opens downward because the coefficient is negative.',
      ],
    }
  }

  if (hasAnyKeyword(normalizedPrompt, ['quadratic', 'x^2', 'ax^2'])) {
    return {
      title: 'Quadratics Model Curved Change',
      topic: 'quadratic',
      paragraphs: [
        'A quadratic function has an x^2 term, which makes its graph curve instead of forming a straight line.',
        'The standard form y = ax^2 + bx + c shows three important controls: a affects shape and direction, b shifts the balance of the curve, and c is the y-intercept.',
        'Quadratics often connect formulas, graphs, and factoring. The same function can show a vertex, x-intercepts, and a y-intercept depending on how it is written.',
      ],
      examples: [
        'y = x^2 - 4x + 3 is a quadratic.',
        'Its factored form is y = (x - 1)(x - 3), so its roots are 1 and 3.',
      ],
    }
  }

  if (
    hasAnyKeyword(normalizedPrompt, ['linear equation', 'solve for x']) ||
    hasLinearEquationPattern(normalizedPrompt)
  ) {
    return {
      title: 'Solving a Linear Equation',
      topic: 'linear equation',
      paragraphs: [
        'A linear equation asks for the value of x that makes both sides equal. The goal is to isolate x while keeping the equation balanced.',
        'Whatever you do to one side, you must do to the other side. This keeps the equality true while you simplify.',
        'Usually, you first remove the constant term near x, then divide by the coefficient of x.',
      ],
      examples: [
        '2x + 5 = 17',
        'Subtract 5 from both sides: 2x = 12.',
        'Divide by 2: x = 6.',
      ],
    }
  }

  if (hasAnyKeyword(normalizedPrompt, ['slope', 'rise', 'run', 'm='])) {
    return {
      title: 'Slope Measures Steepness',
      topic: 'slope',
      paragraphs: [
        'Slope describes how much y changes when x increases by 1. It is the steepness and direction of a line.',
        'A positive slope rises as you move left to right. A negative slope falls as you move left to right. A slope of zero is horizontal.',
        'The phrase rise over run means vertical change divided by horizontal change.',
      ],
      examples: [
        'If a line goes up 6 units while moving right 3 units, its slope is 6 / 3 = 2.',
        'In y = mx + b, m is the slope.',
      ],
    }
  }

  if (
    hasAnyKeyword(normalizedPrompt, [
      'graph',
      'plot',
      'intercept',
      'function',
    ])
  ) {
    return {
      title: 'Reading a Graph',
      topic: 'graph',
      paragraphs: [
        'A graph turns a function into a picture. Each point on the graph matches an input x with an output y.',
        'Intercepts are useful landmarks. The y-intercept shows where the graph crosses the y-axis, and x-intercepts show where the output is zero.',
        'When studying a graph, look for shape, direction, intercepts, turning points, and where the function increases or decreases.',
      ],
      examples: [
        'For y = x^2 - 4x + 3, the y-intercept is 3.',
        'The x-intercepts are the x-values where y = 0.',
      ],
    }
  }

  return {
    title: 'Try a More Specific Math Question',
    topic: 'general',
    paragraphs: [
      `This local MVP explanation generator works best when your prompt mentions ${FALLBACK_TOPICS}.`,
      'Try asking what a concept means, how a formula changes a graph, or why a solving step works.',
    ],
    examples: [
      'What does slope mean?',
      'Why does changing a in y = ax^2 change the parabola?',
      'How do I solve 2x + 5 = 17?',
    ],
  }
}
