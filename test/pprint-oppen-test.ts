import * as chai from 'chai'
import { mkBlank, mkBlockBegin, mkBlockEnd, mkString, PPrint, Token } from '../src/oppen/pprint-oppen'
import { Doc, concat, line, nest, nil, text, layout, group, pretty } from '../src/wadler/pprint-wadler'

const assert = chai.assert

describe('pprint-oppen', function () {
  describe("#PPrint", function () {
    it('should print a simple string', function () {
      const pprint: PPrint = new PPrint(30, [mkString('aaa')])
      pprint.scan()
      assert.equal(pprint.getOutput(), 'aaa')
    })
    it('should print a simple block string', function () {
      const pprint: PPrint = new PPrint(30, [mkBlockBegin(), mkString('aaa'), mkBlockEnd()])
      pprint.scan()
      assert.equal(pprint.getOutput(), 'aaa')
    })
    it('should print spaced strings', function () {
      const pprint: PPrint = new PPrint(
        30, 
        [mkBlockBegin(), 
         mkString('hello'),
         mkBlank(),
         mkString('world'),
         mkBlockEnd()]
      )
      pprint.scan()
      assert.equal(pprint.getOutput(), 'hello world')
    })
    it('should indent tree to width 30', function () {
      const pprint: PPrint = new PPrint(30, tokenizeTree(testTree()))
      pprint.scan()
      assert.equal(pprint.getOutput(), [
        'aaa[bbbbb[ccc, dd],',
        '    eee,',
        '    ffff[gg, hhh, ii]]'
      ].join('\n'))
    })
  })
})

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
  tokens.push(mkBlockBegin())
  tokens.push(mkString(value))
  if (children.length > 0) {
    tokens.push(mkString("["))
    tokens.push(...intersperse(children.map(tokenizeTree), [mkString(","), mkBlank()]).flat())
    tokens.push(mkString("]"))
  }
  tokens.push(mkBlockEnd())
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
