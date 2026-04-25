import { createBlock } from './blockFactory'
import type { Block } from '../types'

export function createSampleNotebook(): Block[] {
  return [
    createBlock(
      'text',
      '## Exploring a quadratic\n\nWe are studying **f(x) = x^2 - 4x + 3**.\n\nKey questions:\n\n- Where does the graph cross the x-axis?\n- What does the vertex tell us?\n- How can factoring help?',
    ),
    createBlock('formula', 'f(x) = x^2 - 4x + 3'),
    createBlock('graph', 'y = x^2 - 4*x + 3'),
    createBlock('solver', '2x + 5 = 17'),
    createBlock(
      'explanation',
      'Why does changing a in y = ax^2 change the width of the parabola?',
    ),
  ]
}
