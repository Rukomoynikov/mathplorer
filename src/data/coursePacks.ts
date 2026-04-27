import { createBlock } from './blockFactory'
import type { Block } from '../types'

export type CoursePackId = 'algebra-foundations' | 'calculus-foundations'

export type CourseNotebookTemplate = {
  createBlocks: () => Block[]
  id: string
  summary: string
  title: string
}

export type CoursePack = {
  description: string
  id: CoursePackId
  notebooks: CourseNotebookTemplate[]
  title: string
}

function cleanContent(content: string) {
  const lines = content.replace(/^\n/, '').replace(/\n\s*$/, '').split('\n')
  const indents = lines
    .filter((line) => line.trim().length > 0)
    .map((line) => line.match(/^ */)?.[0].length ?? 0)
  const smallestIndent = indents.length > 0 ? Math.min(...indents) : 0

  return lines.map((line) => line.slice(smallestIndent)).join('\n')
}

function text(content: string) {
  return createBlock('text', cleanContent(content))
}

function formula(content: string) {
  return createBlock('formula', cleanContent(content))
}

function graph(content: string) {
  return createBlock('graph', cleanContent(content))
}

function solver(content: string) {
  return createBlock('solver', cleanContent(content))
}

function explanation(content: string) {
  return createBlock('explanation', cleanContent(content))
}

const algebraNotebooks: CourseNotebookTemplate[] = [
  {
    id: 'algebra-linear-equations',
    title: 'Algebra Foundations: Linear Equations',
    summary: 'Balance an equation, isolate x, and connect the solution to a graph.',
    createBlocks: () => [
      text(`
        ## Linear equations and solving for x

        A linear equation asks for the input value that makes two expressions equal.
        The main habit is balance: any move you make on one side must also happen on
        the other side.

        In this lesson, the equation $2x + 5 = 17$ means "double a number, add 5,
        and get 17." We will undo those steps in reverse order.
      `),
      text(`
        ### Worked example

        Solve $2x + 5 = 17$.

        1. Subtract 5 from both sides: $2x = 12$.
        2. Divide both sides by 2: $x = 6$.
        3. Check: $2(6) + 5 = 17$.

        The solution is the value of $x$ where the line $y = 2x + 5$ reaches
        the height $y = 17$.
      `),
      formula('x = (17 - 5) / 2'),
      graph(`
        y = 2*x + 5
        y = 17
        points: (6, 17)
        window: x=-2..8, y=0..22
      `),
      solver('2*x + 5 = 17'),
      explanation(
        'Explain how to solve a linear equation for x by keeping both sides balanced.',
      ),
      text(`
        ### Try it yourself

        Solve $3x - 4 = 11$.

        - First ask: what is being done to $x$?
        - Undo the subtraction before you undo the multiplication.
        - Use the solver block by changing the equation to \`3*x - 4 = 11\`.
      `),
    ],
  },
  {
    id: 'algebra-slope-intercepts',
    title: 'Algebra Foundations: Slope and Intercepts',
    summary: 'Read slope as change in y per 1 step in x, then locate intercepts.',
    createBlocks: () => [
      text(`
        ## Slope and intercepts

        A line is easy to read when it is written as $y = mx + b$.

        - $m$ is the slope, or vertical change per 1 step to the right.
        - $b$ is the y-intercept, where the line crosses the y-axis.

        Slope tells you the line's direction and steepness. Intercepts give you
        reliable landmarks.
      `),
      text(`
        ### Worked example

        For $y = 0.5x + 2$, the slope is $0.5$ and the y-intercept is $2$.
        Starting at $(0, 2)$, a slope of $0.5$ means the line rises 1 unit when
        it runs 2 units to the right.

        A second line, $y = -x + 3$, has a negative slope. It falls as you move
        left to right.
      `),
      formula('y = 0.5*x + 2'),
      graph(`
        y = 0.5*x + 2
        y = -1*x + 3
        points: (0, 2), (2, 3), (4, 4)
        points: (0, 3), (3, 0)
        window: x=-2..8, y=-2..7
      `),
      explanation(
        'Explain slope, rise over run, positive and negative slope, and y-intercepts in y = mx + b.',
      ),
      text(`
        ### Try it yourself

        Write a line with y-intercept $-1$ and slope $2$.

        - Start with $y = mx + b$.
        - Replace $m$ with the slope.
        - Replace $b$ with the y-intercept.
        - Graph your line and check whether it crosses the y-axis at $-1$.
      `),
    ],
  },
  {
    id: 'algebra-systems',
    title: 'Algebra Foundations: Systems of Linear Equations',
    summary: 'Use graphs and substitution to find where two lines agree.',
    createBlocks: () => [
      text(`
        ## Systems of linear equations

        A system asks for one ordered pair that makes two equations true at the
        same time. On a graph, that shared solution is the intersection point.

        This lesson uses:

        $$y = 2x + 1$$

        $$y = -x + 7$$
      `),
      text(`
        ### Worked example

        If both expressions equal $y$, then they must equal each other:

        $$2x + 1 = -x + 7$$

        Solving gives $3x = 6$, so $x = 2$. Substitute into either line:
        $y = 2(2) + 1 = 5$.

        The solution is $(2, 5)$.
      `),
      formula('y = 2*x + 1'),
      graph(`
        y = 2*x + 1
        y = -1*x + 7
        points: (2, 5)
        window: x=-1..6, y=0..10
      `),
      solver('2*x + 1 = -1*x + 7'),
      explanation(
        'Explain how a system of linear equations uses an intersection point to satisfy both equations.',
      ),
      text(`
        ### Try it yourself

        Solve this system:

        $$y = x + 4$$

        $$y = -2x + 1$$

        Graph both lines first. Then set the right sides equal and solve for $x$.
      `),
    ],
  },
  {
    id: 'algebra-quadratics-factoring',
    title: 'Algebra Foundations: Quadratics and Factoring',
    summary: 'Connect factored form, roots, x-intercepts, and the parabola shape.',
    createBlocks: () => [
      text(`
        ## Quadratics and factoring

        A quadratic has an $x^2$ term, so its graph is a parabola. Factoring rewrites
        the quadratic as a product, which can make the x-intercepts easier to see.

        We will study:

        $$f(x) = x^2 - 4x + 3$$
      `),
      text(`
        ### Worked example

        The expression $x^2 - 4x + 3$ factors as:

        $$(x - 1)(x - 3)$$

        If $f(x) = 0$, then $(x - 1)(x - 3) = 0$. A product is zero when at least
        one factor is zero, so the roots are $x = 1$ and $x = 3$.
      `),
      formula('f(x) = (x - 1) * (x - 3)'),
      graph(`
        y = x^2 - 4*x + 3
        y = 0
        points: (1, 0), (3, 0), (2, -1)
        window: x=-1..5, y=-3..8
      `),
      solver('x - 3 = 0'),
      explanation(
        'Explain factoring, roots, zeroes, and why x-intercepts matter for a quadratic parabola.',
      ),
      text(`
        ### Try it yourself

        Factor $x^2 - 5x + 6$.

        - Look for two numbers that multiply to $6$ and add to $-5$.
        - Use the factors to find the two x-intercepts.
        - Graph the quadratic and compare the roots to the x-axis crossings.
      `),
    ],
  },
  {
    id: 'algebra-exponent-growth',
    title: 'Algebra Foundations: Exponent Rules and Growth',
    summary: 'Use exponent rules to understand repeated multiplication and growth.',
    createBlocks: () => [
      text(`
        ## Exponent rules and growth

        Exponents describe repeated multiplication. In $2^5$, the base is $2$ and
        the exponent says to multiply by $2$ five times.

        A key rule is:

        $$a^m \\cdot a^n = a^{m+n}$$

        The base stays the same because you are combining repeated copies of that
        same base.
      `),
      text(`
        ### Worked example

        Simplify $2^3 \\cdot 2^4$.

        The bases match, so add the exponents:

        $$2^3 \\cdot 2^4 = 2^{3+4} = 2^7 = 128$$

        Exponential growth uses this same repeated-multiplication idea. A quantity
        multiplied by $1.5$ each step grows faster as time goes on.
      `),
      formula('2^3 * 2^4'),
      graph(`
        y = 1.5^x
        y = 2^x
        points: (0, 1), (1, 1.5), (2, 2.25), (3, 3.375)
        window: x=-2..6, y=0..20
      `),
      explanation(
        'Explain exponent rules and exponential growth using repeated multiplication.',
      ),
      text(`
        ### Try it yourself

        Simplify $3^2 \\cdot 3^5$.

        Then graph $y = 3^x$ and compare it to $y = 2^x$. Which one grows faster
        after $x = 2$?
      `),
    ],
  },
  {
    id: 'algebra-functions-transformations',
    title: 'Algebra Foundations: Function Notation and Transformations',
    summary: 'Treat f(x) as an input-output rule and see how transformations move it.',
    createBlocks: () => [
      text(`
        ## Function notation and transformations

        Function notation names a rule. If $f(x) = x^2$, then $f(3)$ means "put
        3 into the rule," so $f(3) = 9$.

        Transformations change a graph in predictable ways:

        - $f(x - 2)$ shifts the graph right 2 units.
        - $f(x) + 1$ shifts the graph up 1 unit.
        - $0.5f(x)$ makes the graph vertically shorter.
      `),
      text(`
        ### Worked example

        Start with $f(x) = x^2$. The transformed rule
        $g(x) = (x - 2)^2 + 1$ moves the same parabola right 2 units and up
        1 unit.

        The shape is familiar, but the vertex moves from $(0, 0)$ to $(2, 1)$.
      `),
      formula('f(x) = x^2'),
      graph(`
        f(x) = x^2
        g(x) = (x - 2)^2 + 1
        h(x) = 0.5*(x + 1)^2 - 2
        points: (0, 0), (2, 1), (-1, -2)
        window: x=-5..6, y=-4..10
      `),
      explanation(
        'Explain function notation and graph transformations such as shifts and vertical scaling.',
      ),
      text(`
        ### Try it yourself

        Predict the vertex of $q(x) = (x + 3)^2 - 4$ before graphing it.

        Then graph $f(x) = x^2$ and $q(x)$ together. What moved left or right?
        What moved up or down?
      `),
    ],
  },
]

const calculusNotebooks: CourseNotebookTemplate[] = [
  {
    id: 'calculus-limits-graphs',
    title: 'Calculus Foundations: Limits from Graphs',
    summary: 'Estimate what a function approaches near an input, even around a hole.',
    createBlocks: () => [
      text(`
        ## Limits and intuition from graphs

        A limit asks what value a function approaches as the input gets close to a
        chosen number. The function does not always need to be defined at that
        exact input.

        We will use:

        $$f(x) = \\frac{x^2 - 1}{x - 1}$$

        This expression has trouble at $x = 1$, but nearby values still follow a
        clear pattern.
      `),
      text(`
        ### Worked example

        Factor the numerator:

        $$x^2 - 1 = (x - 1)(x + 1)$$

        For $x \\ne 1$, the expression behaves like $x + 1$. As $x$ gets closer
        to $1$ from either side, the outputs get closer to $2$.

        So the limit is $2$, even though the original formula is undefined at
        $x = 1$.
      `),
      formula('f(x) = (x^2 - 1) / (x - 1)'),
      graph(`
        y = (x^2 - 1)/(x - 1)
        y = 2
        points: (0.5, 1.5), (0.9, 1.9), (1.1, 2.1), (1.5, 2.5)
        window: x=0..2, y=0..4
      `),
      explanation(
        'Explain limits from graphs and why a function can approach a value near a hole.',
      ),
      text(`
        ### Try it yourself

        Estimate $\\lim_{x \\to 2} \\frac{x^2 - 4}{x - 2}$.

        - Factor the numerator.
        - Look at values just below and just above $2$.
        - Graph the expression and ask what height the curve approaches.
      `),
    ],
  },
  {
    id: 'calculus-average-instantaneous-rate',
    title: 'Calculus Foundations: Average vs Instantaneous Rate',
    summary: 'Compare secant-line slopes with a tangent-line slope on a curve.',
    createBlocks: () => [
      text(`
        ## Average vs instantaneous rate of change

        Average rate of change uses two points. On a graph, it is the slope of a
        secant line through those points.

        Instantaneous rate of change asks for the slope at one point. On a graph,
        it is the slope of a tangent line that just touches the curve locally.
      `),
      text(`
        ### Worked example

        Let $f(x) = x^2$. From $x = 1$ to $x = 3$:

        $$\\frac{f(3)-f(1)}{3-1} = \\frac{9-1}{2} = 4$$

        That average rate is the slope of the secant line. Near $x = 2$, the
        tangent slope is also close to $4$, but it describes one instant instead
        of an interval.
      `),
      formula('f(x) = x^2'),
      graph(`
        y = x^2
        y = 4*x - 3
        y = 4*x - 4
        points: (1, 1), (2, 4), (3, 9)
        window: x=0..4, y=0..12
      `),
      explanation(
        'Explain average rate of change, secant lines, instantaneous rate of change, and tangent lines.',
      ),
      text(`
        ### Try it yourself

        For $f(x) = x^2$, find the average rate of change from $x = 2$ to
        $x = 4$.

        Then graph the secant line through those two points. How does its slope
        compare with the curve near the middle of the interval?
      `),
    ],
  },
  {
    id: 'calculus-derivatives-tangents',
    title: 'Calculus Foundations: Derivatives as Tangent Slopes',
    summary: 'See the derivative as a slope rule that changes from point to point.',
    createBlocks: () => [
      text(`
        ## Derivatives as slopes of tangent lines

        A derivative gives the slope of a curve at one input value. Instead of one
        fixed slope, a curved graph has a slope that changes as $x$ changes.

        We will study:

        $$f(x) = x^3 - 3x$$
      `),
      text(`
        ### Worked example

        For $f(x) = x^3 - 3x$, the derivative is:

        $$f'(x) = 3x^2 - 3$$

        At $x = -1$, the slope is $0$. At $x = 0$, the slope is $-3$. At $x = 2$,
        the slope is $9$. The tangent lines make those changing slopes visible.
      `),
      formula('f(x) = x^3 - 3*x'),
      graph(`
        y = x^3 - 3*x
        y = 2
        y = -3*x
        y = 9*x - 16
        points: (-1, 2), (0, 0), (2, 2)
        window: x=-3..3, y=-8..8
      `),
      explanation(
        'Explain derivatives as slopes of tangent lines for a curve with changing slope.',
      ),
      text(`
        ### Try it yourself

        Use the formula tools in edit mode:

        - Differentiate $f(x) = x^3 - 3x$.
        - Evaluate the derivative at $x = 1$.
        - Create the tangent line at $x = 1$ and compare it to the curve.
      `),
    ],
  },
  {
    id: 'calculus-derivative-rules',
    title: 'Calculus Foundations: Common Derivative Rules',
    summary: 'Practice the constant, power, and sum rules on a polynomial.',
    createBlocks: () => [
      text(`
        ## Common derivative rules

        Derivative rules let you find slope formulas without rebuilding the limit
        process every time.

        For beginner polynomial work, these are the big three:

        - Constant rule: the derivative of a constant is $0$.
        - Power rule: the derivative of $x^n$ is $nx^{n-1}$.
        - Sum rule: differentiate each term, then add the results.
      `),
      text(`
        ### Worked example

        For $f(x) = 3x^4 - 5x^2 + 7x$:

        $$f'(x) = 12x^3 - 10x + 7$$

        Each term gets handled separately. The derivative is another function:
        it tells you the slope of the original graph at each $x$ value.
      `),
      formula('f(x) = 3*x^4 - 5*x^2 + 7*x'),
      graph(`
        y = 3*x^4 - 5*x^2 + 7*x
        y = 12*x^3 - 10*x + 7
        window: x=-2..2, y=-15..20
      `),
      explanation(
        'Explain common derivative rules, including the power rule, constant rule, and sum rule.',
      ),
      text(`
        ### Try it yourself

        Differentiate $p(x) = 4x^3 + 2x - 9$.

        In edit mode, put the function in a formula block and use the Derivative
        tool to check your work.
      `),
    ],
  },
  {
    id: 'calculus-optimization',
    title: 'Calculus Foundations: Optimization Intuition',
    summary: 'Use a graph and a derivative equation to find a maximum value.',
    createBlocks: () => [
      text(`
        ## Optimization intuition

        Optimization problems ask for the best value: greatest area, lowest cost,
        fastest route, or maximum profit.

        A useful first step is to build a function for the quantity you care about,
        then look for where that function stops increasing and starts decreasing.
      `),
      text(`
        ### Worked example

        Suppose a rectangle uses one side of a wall and $10$ meters of fencing for
        the other three sides. If $x$ is the width, then the length is $10 - 2x$.

        The area function is:

        $$A(x) = x(10 - 2x)$$

        This parabola has a maximum at its vertex. Its derivative is
        $A'(x) = 10 - 4x$, and $10 - 4x = 0$ gives $x = 2.5$.
      `),
      formula('A(x) = x*(10 - 2*x)'),
      graph(`
        y = x*(10 - 2*x)
        y = 12.5
        points: (2.5, 12.5)
        window: x=0..5, y=0..15
      `),
      solver('10 - 4*x = 0'),
      explanation(
        'Explain optimization intuition using a maximum, a parabola vertex, and a derivative equal to zero.',
      ),
      text(`
        ### Try it yourself

        Change the fencing amount from $10$ to $12$.

        - Write the new area function.
        - Graph it.
        - Solve the derivative equation to find the width that gives maximum area.
      `),
    ],
  },
  {
    id: 'calculus-integrals-accumulated-area',
    title: 'Calculus Foundations: Integrals as Accumulated Area',
    summary: 'Read an integral as total accumulation from a rate graph.',
    createBlocks: () => [
      text(`
        ## Integrals as accumulated area

        An integral adds up many tiny pieces. When a graph shows a rate, the area
        under the rate graph gives accumulated change.

        If velocity is $v(t) = t + 1$, then total distance from $t = 0$ to
        $t = 4$ is the area under that line over the interval.
      `),
      text(`
        ### Worked example

        The accumulated area from $0$ to $4$ under $v(t) = t + 1$ is:

        $$\\int_0^4 (t + 1)\\,dt$$

        The accumulation function is $A(x) = 0.5x^2 + x$. At $x = 4$:

        $$A(4) = 0.5(4)^2 + 4 = 12$$

        So the total accumulated amount is $12$ square units.
      `),
      formula('0.5*4^2 + 4'),
      graph(`
        y = x + 1
        y = 0.5*x^2 + x
        points: (0, 1), (4, 5), (4, 12)
        window: x=0..5, y=0..18
      `),
      explanation(
        'Explain integrals as accumulated area under a rate graph and an accumulation function.',
      ),
      text(`
        ### Try it yourself

        Estimate the area under $y = 2x$ from $x = 0$ to $x = 3$.

        Then graph both $y = 2x$ and its accumulation function $A(x) = x^2$.
        What does $A(3)$ tell you?
      `),
    ],
  },
]

export const COURSE_PACKS: CoursePack[] = [
  {
    id: 'algebra-foundations',
    title: 'Algebra Foundations',
    description:
      'Six beginner lessons on equations, lines, systems, quadratics, exponents, and functions.',
    notebooks: algebraNotebooks,
  },
  {
    id: 'calculus-foundations',
    title: 'Calculus Foundations',
    description:
      'Six beginner lessons on limits, rates, derivatives, optimization, and accumulation.',
    notebooks: calculusNotebooks,
  },
]

export function getCourseNotebookTemplate(templateId: string) {
  return COURSE_PACKS.flatMap((coursePack) => coursePack.notebooks).find(
    (notebook) => notebook.id === templateId,
  )
}
