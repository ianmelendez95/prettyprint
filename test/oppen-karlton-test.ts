import * as chai from 'chai'
import { PrettyPrinter } from '../src/oppen/oppen-karlton'
import { mkBreak, mkBegin, mkEnd, mkString, Token } from '../src/oppen/oppen-karlton'
import { mkEOF } from '../src/oppen/oppen-tokens'

const assert = chai.assert

describe('pprint-oppen', function () {
  describe("#PrettyPrinter", function () {
    it('should print a simple string', function () {
      const pprint: PrettyPrinter = new PrettyPrinter(30)
      pprint.prettyPrint(mkString('aaa'))
      pprint.prettyPrint(mkEOF())
      assert.equal(pprint.getOutput(), 'aaa')
    })
    it('should print a simple block string', function () {
      const pprint: PrettyPrinter = new PrettyPrinter(30)
      const input = [mkBegin(), mkString('aaa'), mkEnd()]
      pprint.prettyPrintAll(input)
      pprint.prettyPrint(mkEOF())
      assert.equal(pprint.getOutput(), 'aaa')
    })
    it('should print spaced strings', function () {
      const pprint: PrettyPrinter = new PrettyPrinter(30)
      const input = [
        mkBegin(), 
        mkString('hello'),
        mkBreak(),
        mkString('world'),
        mkEnd()
      ]
      pprint.prettyPrintAll(input)
      pprint.prettyPrint(mkEOF())
      assert.equal(pprint.getOutput(), 'hello world')
    })
    it('should indent function example wide line', function () {
      const pprint: PrettyPrinter = new PrettyPrinter(30)
      pprint.prettyPrintAll(tokenizedFunction())
      pprint.prettyPrint(mkEOF())
      assert.equal(pprint.getOutput(), 'f(a, b, c, d) + g(a, b, c, d)')
    })
    it('should indent function example narrow line', function () {
      // should not break the call to g between arguments
      const pprint: PrettyPrinter = new PrettyPrinter(25)
      pprint.prettyPrintAll(tokenizedFunction())
      pprint.prettyPrint(mkEOF())
      assert.equal(pprint.getOutput(), [
        'f(a, b, c, d) +', 
        'g(a, b, c, d)'
      ].join('\n'))
    })
  })
})

// from page 467 in Oppen
// [[f(a, b, c, d)] + [g(a, b, c, d)]]
function tokenizedFunction(): Token[] {
  return [ 
    mkBegin(),
    mkBegin(),
    ...intersperse(("f(a, b, c, d)".split(' ').map(mkString) as Token[]), mkBreak()),
    mkEnd(),
    mkBreak(), mkString("+"), mkBreak(),
    mkBegin(),
    ...intersperse(("g(a, b, c, d)".split(' ').map(mkString) as Token[]), mkBreak()),
    mkEnd(),
    mkEnd()
  ]
}

////////////////////////////////////////////////////////////////////////////////
// Tree Structure

/**
 * data Tree = Node String [Tree]
 */
type Tree = {
  value: string,
  children: Tree[]
}

/**
 * aaa[bbbbb[ccc, 
 *           dd],
 * eee,
 * ffff[gg,
 *      hhh,
 *      ii]]
 */
function testTree(): Tree {
  return {
    value: "aaa",
    children: [{
      value: "bbbbb", children: [{ value: "ccc", children: [] },
      { value: "dd", children: [] }]
    },
    { value: "eee", children: [] },
    {
      value: "ffff", children: [{ value: "gg", children: [] },
      { value: "hhh", children: [] },
      { value: "ii", children: [] }]
    }]
  }
}

function tokenizeTree({ value, children }: Tree): Token[] {
  const tokens: Token[] = []
  tokens.push(mkBegin())
  tokens.push(mkString(value))
  if (children.length > 0) {
    tokens.push(mkString("["))
    tokens.push(...intersperse(children.map(tokenizeTree), [mkString(","), mkBreak()]).flat())
    tokens.push(mkString("]"))
  }
  tokens.push(mkEnd())
  return tokens
}

function intersperse<T>(array: T[], delim: T): T[] {
  const newArray: T[] = []
  let first: boolean = true
  for (let x of array) {
    if (first) {
      first = false
    } else {
      newArray.push(delim)
    }

    newArray.push(x)
  }
  return newArray
}
