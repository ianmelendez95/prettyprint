import * as chai from 'chai'
import { joinBlanks, mkBlank, mkBlockBegin, mkBlockEnd, mkString, PPrint, Token } from '../src/oppen/pprint-oppen'
import { Doc, concat, line, nest, nil, text, layout, group, pretty } from '../src/wadler/pprint-wadler'

const assert = chai.assert

describe('pprint-oppen', function () {
  describe("#joinBlanks", function () {
    it('should join some blanks', function () {
      const tokens: Token[] = [
        mkBlockBegin(),
        mkString("hello"),
        mkBlank(2),
        mkBlank(3),
        mkString("there"),
        mkBlank(1),
        mkBlank(1),
        mkBlank(1),
        mkString("world"),
        mkBlockEnd()
      ]
      const tokensJoined: Token[] = [
        mkBlockBegin(),
        mkString("hello"),
        mkBlank(5),
        mkString("there"),
        mkBlank(3),
        mkString("world"),
        mkBlockEnd()
      ]
      assert.deepEqual(joinBlanks(tokens), tokensJoined)
    })
  })
  describe("#PPrint", function () {
    it('should print a simple string', function () {
      const pprint: PPrint = new PPrint(30, [mkString('aaa')])
      pprint.scan()
      assert.equal(pprint.getOutput(), 'aaa')
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
  tokens.push(mkString(value), mkBlank(1))
  tokens.push(...intersperse(children.flatMap(tokenizeTree), mkBlank(1)))
  tokens.push(mkBlockEnd())
  return joinBlanks(tokens)
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
