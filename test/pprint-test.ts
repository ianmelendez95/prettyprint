import * as chai from 'chai'
import { Doc, concat, line, nest, nil, text, layout, group, pretty } from '../src/wadler/pprint-wadler'

const assert = chai.assert

describe('pprint', function () {
  describe('#showTree', function () {
    it('should properly indent test tree', function () {
      assert.equal([
        'aaa[bbbbb[ccc,',
        '          dd],',
        '    eee,',
        '    ffff[gg,',
        '         hhh,',
        '         ii]]'
      ].join('\n'), layout(showTree(testTree())))
    })
  })
  describe('#showTreeAlt', function () {
    it('should properly indent test tree', function () {
      assert.equal([
        'aaa[',
        '  bbbbb[ccc,',
        '        dd],',
        '  eee,',
        '  ffff[gg,',
        '       hhh,',
        '       ii]',
        ']'
      ].join('\n'), layout(showTreeAlt(testTree())))
    })
  })
  describe("#pretty", function () {
    it('should indent tree to width 30', function () {
      assert.equal(pretty(30, showTreeGrouped(testTree())), [
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

/**
 * showTree (Node s ts) = text s <> nest (length s) (showBracket ts)
 */
function showTree({ value, children }: Tree): Doc {
  const s = value
  const ts = children
  return concat(text(s), nest(s.length, showBracket(ts)))
}

/**
 * showBracket [] = nil
 * showBracket ts = text "[" <> nest 1 (showTrees ts) <> text "]"
 */
function showBracket(ts: Tree[]): Doc {
  return ts.length === 0
    ? nil()
    : concat(text("["),
      nest(1, showTrees(ts)),
      text("]"))
}

/**
 * showTrees [t] = showTree t
 * showTrees (t:ts) = showTree t <> text "," <> line <> showTrees ts
 */
function showTrees(ts: Tree[]): Doc {
  if (ts.length === 0) {
    throw new Error('Expecting at least one tree')
  } else if (ts.length === 1) {
    return showTree(ts[0])
  } else {
    return concat(
      showTree(ts[0]),
      text(","),
      line(),
      showTrees(ts.slice(1))
    )
  }
}

/**
 * showTree’ (Node s ts) = text s <> showBracket’ ts
 */
function showTreeAlt({ value, children }: Tree): Doc {
  const s = value
  const ts = children
  return concat(text(s), showBracketAlt(ts))
}

/**
 * showBracket’ [] = nil
 * showBracket’ ts = text "[" <>
 *                   nest 2 (line <> showTrees’ ts) <>
 *                   line <> text "]")
 */
function showBracketAlt(ts: Tree[]): Doc {
  return ts.length === 0
    ? nil()
    : concat(text("["),
             nest(2, concat(line(), showTreesAlt(ts))),
             line(), text("]"))
}

/**
 * showTrees’ [t] = showTree t
 * showTrees’ (t:ts) = showTree t <> text "," <> line <> showTrees ts
 */
function showTreesAlt(ts: Tree[]): Doc {
  if (ts.length === 0) {
    throw new Error('Expecting at least one tree')
  } else if (ts.length === 1) {
    return showTree(ts[0])
  } else {
    return concat(
      showTree(ts[0]),
      text(","),
      line(),
      showTrees(ts.slice(1))
    )
  }
}

/**
 * showTreeGrouped (Node s ts) = text s <> showBracketGrouped ts
 */
function showTreeGrouped({ value, children }: Tree): Doc {
  const s = value
  const ts = children
  return group(concat(text(s), nest(s.length, showBracketGrouped(ts))))
}

/**
 * showBracketGrouped [] = nil
 * showBracketGrouped ts = text "[" <> nest 1 (showTreesGrouped ts) <> text "]"
 */
function showBracketGrouped(ts: Tree[]): Doc {
  return ts.length === 0
    ? nil()
    : concat(text("["),
      nest(1, showTreesGrouped(ts)),
      text("]"))
}

/**
 * showTreesGrouped [t] = showTreeGrouped t
 * showTreesGrouped (t:ts) = showTreeGrouped t <> text "," <> line <> showTreesGrouped ts
 */
function showTreesGrouped(ts: Tree[]): Doc {
  if (ts.length === 0) {
    throw new Error('Expecting at least one tree')
  } else if (ts.length === 1) {
    return showTreeGrouped(ts[0])
  } else {
    return concat(
      showTreeGrouped(ts[0]),
      text(","),
      line(),
      showTreesGrouped(ts.slice(1))
    )
  }
}