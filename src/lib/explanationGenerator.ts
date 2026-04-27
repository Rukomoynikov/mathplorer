export type ExplanationResult = {
  examples?: string[]
  paragraphs: string[]
  title: string
  topic: string
}

const FALLBACK_TOPICS =
  'sets, combinatorics, probability, slope, linear equations, systems, quadratics, exponents, transformations, limits, derivatives, integrals, or graphs'

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
      'probability',
      'sample space',
      'sample spaces',
      'event',
      'events',
      'favorable',
      'complement rule',
      'independent event',
      'independent events',
    ])
  ) {
    return {
      title: 'Probability Counts Favorable Outcomes',
      topic: 'probability',
      paragraphs: [
        'A sample space is the set of all possible outcomes. An event is a subset of that sample space, such as rolling an even number on a die.',
        'When outcomes are equally likely, probability is favorable outcomes divided by total outcomes. The answer can be written as a fraction, decimal, or percent.',
        'The complement rule says that the probability of not getting an event is 1 minus the probability of getting it. Independent events do not change each other, so simple combined probabilities multiply.',
      ],
      examples: [
        'Rolling a 5 or 6 on a fair die has probability 2 / 6 = 1 / 3.',
        'If P(A) = 3 / 8, then P(not A) = 5 / 8.',
      ],
    }
  }

  if (
    hasAnyKeyword(normalizedPrompt, [
      'set',
      'sets',
      'membership',
      'union',
      'intersection',
      'venn',
      'symmetric difference',
      'difference',
    ])
  ) {
    return {
      title: 'Sets Organize Membership',
      topic: 'sets',
      paragraphs: [
        'A set is a collection of distinct objects. Membership asks whether an object belongs to that collection.',
        'Union combines everything from two sets, while intersection keeps only the shared overlap. Difference keeps what is in one set after removing what also appears in the other.',
        'A Venn diagram turns those operations into regions: left-only, overlap, right-only, and outside the sets when a universal set is part of the problem.',
      ],
      examples: [
        'If A = {1, 2, 3} and B = {3, 4}, then A union B is {1, 2, 3, 4}.',
        'The intersection is {3}, because 3 is the only shared member.',
      ],
    }
  }

  if (
    hasAnyKeyword(normalizedPrompt, [
      'combinatorics',
      'factorial',
      'permutation',
      'permutations',
      'combination',
      'combinations',
      'arranging',
      'choosing',
      'multiplication principle',
    ])
  ) {
    return {
      title: 'Counting Choices Without Listing Them',
      topic: 'combinatorics',
      paragraphs: [
        'Combinatorics gives you tools for counting outcomes efficiently. The multiplication principle is the core idea: independent stages multiply together.',
        'A factorial counts full arrangements of distinct items. For example, 5! counts how many ways five items can be ordered.',
        'Permutations count ordered selections, so arranging AB is different from BA. Combinations count groups, so AB and BA describe the same choice.',
      ],
      examples: [
        'P(5, 2) = 20 counts ordered two-item arrangements from five items.',
        'C(5, 2) = 10 counts two-item groups from five items.',
      ],
    }
  }

  if (
    hasAnyKeyword(normalizedPrompt, [
      'system',
      'systems',
      'intersection point',
      'satisfy both',
      'both equations',
    ])
  ) {
    return {
      title: 'A System Looks for One Shared Solution',
      topic: 'systems',
      paragraphs: [
        'A system of equations asks for values that make every equation true at the same time. For two linear equations, the solution is usually one ordered pair.',
        'On a graph, each line shows all the points that satisfy one equation. The intersection point satisfies both equations, so it is the system solution.',
        'Algebraically, substitution works by setting two expressions for the same quantity equal to each other, solving for one variable, and then substituting back to find the other variable.',
      ],
      examples: [
        'If y = 2x + 1 and y = -x + 7, set 2x + 1 = -x + 7.',
        'Solving gives x = 2, then y = 5, so the solution is (2, 5).',
      ],
    }
  }

  if (
    hasAnyKeyword(normalizedPrompt, [
      'exponent',
      'exponents',
      'exponential',
      'growth',
      'repeated multiplication',
    ])
  ) {
    return {
      title: 'Exponents Track Repeated Multiplication',
      topic: 'exponents',
      paragraphs: [
        'An exponent tells you how many times to use the same base as a factor. This makes exponent rules a compact way to describe repeated multiplication.',
        'When multiplying powers with the same base, add the exponents because you are joining two strings of repeated factors.',
        'Exponential growth happens when a quantity is multiplied by the same factor again and again. The graph curves upward because each new increase builds on a larger previous value.',
      ],
      examples: [
        '2^3 * 2^4 = 2^(3 + 4) = 2^7.',
        'A pattern that multiplies by 1.5 each step grows by 50 percent each step.',
      ],
    }
  }

  if (
    hasAnyKeyword(normalizedPrompt, [
      'function notation',
      'transformation',
      'transformations',
      'vertical scaling',
      'shift',
      'shifts',
    ])
  ) {
    return {
      title: 'Function Notation Names an Input-Output Rule',
      topic: 'functions',
      paragraphs: [
        'Function notation such as f(x) names a rule. The input goes inside the parentheses, and the output is the value produced by the rule.',
        'Transformations change a familiar graph in predictable ways. Adding outside the function moves the graph up or down, while changing the input inside the function moves it left or right.',
        'Vertical scaling multiplies the outputs. A larger scale stretches the graph away from the x-axis, and a smaller positive scale compresses it toward the x-axis.',
      ],
      examples: [
        'If f(x) = x^2, then f(3) = 9.',
        'g(x) = (x - 2)^2 + 1 shifts y = x^2 right 2 and up 1.',
      ],
    }
  }

  if (
    hasAnyKeyword(normalizedPrompt, ['limit', 'limits', 'approach', 'hole'])
  ) {
    return {
      title: 'A Limit Describes What a Function Approaches',
      topic: 'limits',
      paragraphs: [
        'A limit asks what output value a function approaches as the input gets close to a chosen number. It focuses on nearby behavior, not only the exact point.',
        'Graphs are helpful because you can look from the left and from the right. If both sides approach the same height, that shared height is the limit.',
        'A function can have a hole or be undefined at the input and still have a limit there. The limit depends on the trend around the input.',
      ],
      examples: [
        'If values near x = 1 get closer to y = 2 from both sides, the limit is 2.',
        'A hole changes the function value at a point, but not necessarily the nearby trend.',
      ],
    }
  }

  if (
    hasAnyKeyword(normalizedPrompt, [
      'average rate',
      'instantaneous rate',
      'secant',
      'secant line',
    ])
  ) {
    return {
      title: 'Rates of Change Compare Outputs to Inputs',
      topic: 'rates of change',
      paragraphs: [
        'Average rate of change measures how much the output changes over an interval. On a graph, it is the slope of the secant line through two points.',
        'Instantaneous rate of change measures how fast the function is changing at one input. On a graph, it is the slope of the tangent line at that point.',
        'Calculus connects the two ideas by shrinking the interval until the average rate settles toward an instantaneous rate.',
      ],
      examples: [
        'For f(x) = x^2 from x = 1 to x = 3, the average rate is (9 - 1) / (3 - 1) = 4.',
        'A tangent line uses one point and the local direction of the curve.',
      ],
    }
  }

  if (
    hasAnyKeyword(normalizedPrompt, [
      'power rule',
      'constant rule',
      'sum rule',
      'derivative rules',
    ])
  ) {
    return {
      title: 'Derivative Rules Build a Slope Formula',
      topic: 'derivative rules',
      paragraphs: [
        'Derivative rules let you find a slope formula efficiently. For polynomial terms, the power rule is usually the main tool.',
        'The power rule says that x^n becomes n*x^(n - 1). A constant term becomes 0 because a flat line has slope 0.',
        'The sum rule lets you differentiate each term separately, then add the results. This keeps larger polynomial derivatives organized.',
      ],
      examples: [
        'The derivative of 3x^4 is 12x^3.',
        'The derivative of 3x^4 - 5x^2 + 7x is 12x^3 - 10x + 7.',
      ],
    }
  }

  if (
    hasAnyKeyword(normalizedPrompt, [
      'optimization',
      'maximum',
      'minimum',
      'best value',
      'derivative equal to zero',
    ])
  ) {
    return {
      title: 'Optimization Looks for the Best Output',
      topic: 'optimization',
      paragraphs: [
        'Optimization means choosing an input that gives the best output, such as a maximum area or minimum cost.',
        'A graph gives the visual story: the best value often happens at a high point, low point, or endpoint of the allowed interval.',
        'The derivative helps because a smooth graph often has a horizontal tangent at an interior maximum or minimum. That is why solving derivative = 0 can identify important candidates.',
      ],
      examples: [
        'For A(x) = x(10 - 2x), the maximum is at the vertex.',
        'A\'(x) = 10 - 4x equals 0 when x = 2.5.',
      ],
    }
  }

  if (
    hasAnyKeyword(normalizedPrompt, [
      'integral',
      'integrals',
      'accumulated',
      'accumulation',
      'area under',
    ])
  ) {
    return {
      title: 'Integrals Add Up Accumulated Change',
      topic: 'integrals',
      paragraphs: [
        'An integral adds many tiny pieces together. When a graph shows a rate, the area under the graph represents total accumulated change.',
        'Accumulation functions keep track of how much has been gathered from a starting point up to a variable endpoint.',
        'If the rate stays positive, the accumulated total increases. A steeper or higher rate graph adds area more quickly.',
      ],
      examples: [
        'If velocity is v(t) = t + 1, area under the velocity graph gives distance traveled.',
        'For A(x) = 0.5x^2 + x, A(4) = 12 represents the accumulated amount from 0 to 4.',
      ],
    }
  }

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
