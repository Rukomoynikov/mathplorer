import { createBlock } from './blockFactory'
import type { Block } from '../types'
import { serializeCombinatoricsBlockContent } from '../lib/combinatorics'
import { serializeProbabilityBlockContent } from '../lib/probability'
import { serializeSetBlockContent } from '../lib/setTheory'

export const SAMPLE_NOTEBOOK_TITLE = 'Discrete Math Foundations'

export function createSampleNotebook(): Block[] {
  return [
    createBlock(
      'text',
      `## Discrete Math Foundations

Discrete math studies structures that come in separate pieces: objects in a set, choices in a counting problem, and outcomes in a probability experiment.

This mini-lesson moves through three connected questions:

- What belongs to a collection?
- How many outcomes are possible?
- How likely is a particular event?`,
    ),
    createBlock(
      'text',
      `### 1. Sets

A **set** is a collection of distinct objects. If $A = \\{2,4,6\\}$, then $4 \\in A$ means 4 is a member of $A$, while $5 \\notin A$ means 5 is not a member.

Common operations:

- $A \\cup B$ keeps everything in either set.
- $A \\cap B$ keeps only what the sets share.
- $A \\setminus B$ keeps what is in $A$ but not in $B$.
- A complement keeps everything outside the event or set, relative to the universal set.

Venn diagrams are a picture of this logic: left-only, overlap, and right-only regions tell you where each element belongs.`,
    ),
    createBlock(
      'set',
      serializeSetBlockContent({
        version: 1,
        setA: '2, 4, 6, 8, 10',
        setB: '1, 2, 3, 5, 8',
      }),
    ),
    createBlock(
      'explanation',
      'Explain union, intersection, difference, symmetric difference, and Venn diagrams for two finite sets.',
    ),
    createBlock(
      'text',
      `### 2. Combinatorics

Combinatorics is the math of counting without listing every possibility.

The **multiplication principle** says that if one choice can happen in $a$ ways and the next can happen in $b$ ways, then the pair can happen in $a \\cdot b$ ways.

Factorials count full arrangements: $n! = n \\cdot (n-1) \\cdot \\ldots \\cdot 1$.

Permutations count arrangements where order matters. Combinations count choices where order does not matter.`,
    ),
    createBlock(
      'combinatorics',
      serializeCombinatoricsBlockContent({
        version: 1,
        mode: 'factorial',
        n: '5',
        r: '2',
      }),
    ),
    createBlock(
      'combinatorics',
      serializeCombinatoricsBlockContent({
        version: 1,
        mode: 'permutation',
        n: '5',
        r: '2',
      }),
    ),
    createBlock(
      'combinatorics',
      serializeCombinatoricsBlockContent({
        version: 1,
        mode: 'combination',
        n: '5',
        r: '2',
      }),
    ),
    createBlock(
      'explanation',
      'Explain the difference between permutations and combinations using choosing versus arranging.',
    ),
    createBlock(
      'text',
      `### 3. Probability Theory

A **sample space** is the set of every possible outcome. An **event** is a subset of the sample space.

For equally likely outcomes:

$$
P(\\text{event}) = \\frac{\\text{favorable outcomes}}{\\text{total outcomes}}
$$

The complement rule says $P(\\text{not } A) = 1 - P(A)$. For independent events, one event happening does not change the probability of the other, so simple combined probabilities multiply.`,
    ),
    createBlock(
      'probability',
      serializeProbabilityBlockContent({
        version: 1,
        favorableOutcomes: '3',
        totalOutcomes: '8',
      }),
    ),
    createBlock(
      'explanation',
      'Explain sample spaces, events, favorable outcomes, the complement rule, and independent events.',
    ),
  ]
}
