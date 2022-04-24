/**
 * Implementation as described in Philip Wadler's 'A Prettier Printer'.
 */

export type Doc = Nil | Line | Text | Union

export type Nil = { kind: 'nil' }

export type Text = {
  kind: 'text',
  text: string,
  next: Doc
}

export type Line = {
  kind: 'line', 
  depth: number, // integer
  next: Doc
}

export type Union = {
  kind: 'union',
  doc1: Doc,
  doc2: Doc
}

const NIL: Nil = { kind: 'nil' }

function mkText(text: string, next: Doc): Doc {
  return { kind: 'text', text, next }
}

function mkLine(depth: number, next: Doc): Doc {
  return { kind: 'line', depth, next }
}

function union(doc1: Doc, doc2: Doc): Doc {
  return { kind: 'union', doc1, doc2 }
}

/**
 * group Nil = Nil
 * group (i ‘Line‘ x) = (" " ‘Text‘ flatten x) ‘Union‘ (i ‘Line‘ x)
 * group (s ‘Text‘ x) = s ‘Text‘ group x
 * group (x ‘Union‘ y) = group x ‘Union‘ y 
 */
export function group(doc: Doc): Doc {
  if (doc.kind === 'nil') {
    return nil()
  } else if (doc.kind === 'line') {
    return union(mkText(' ', flatten(doc.next)), doc)
  } else if (doc.kind === 'text') {
    return mkText(doc.text, group(doc.next))
  } else if (doc.kind === 'union') {
    return union(group(doc.doc1), doc.doc2)
  } else {
    throw new Error()
  }
}

/**
 * flatten Nil = Nil
 * flatten (i ‘Line‘ x) = " " ‘Text‘ flatten x
 * flatten (s ‘Text‘ x) = s ‘Text‘ flatten x
 * flatten (x ‘Union‘ y) = flatten x  
 */
function flatten(doc: Doc): Doc {
  if (doc.kind === 'nil') {
    return nil()
  } else if (doc.kind === 'line') {
    return mkText(' ', flatten(doc.next))
  } else if (doc.kind === 'text') {
    return mkText(doc.text, flatten(doc.next))
  } else if (doc.kind === 'union') {
    return flatten(doc.doc1)
  } else {
    throw new Error()
  }
}

/**
 * best w k Nil = Nil
 * best w k (i ‘Line‘ x) = i ‘Line‘ best w i x
 * best w k (s ‘Text‘ x) = s ‘Text‘ best w (k + length s) x
 * best w k (x ‘Union‘ y) = better w k (best w k x) (best w k y)
 *   where better w k x y = if fits (w-k) x then x else y
 * 
 * @returns any Doc subtype *except Union!*
 */
function best(maxWidth: number, curWidth: number, doc: Doc): Doc {
  if (doc.kind === 'nil') {
    return doc
  } else if (doc.kind === 'line') {
    return mkLine(doc.depth, best(maxWidth, doc.depth, doc.next))
  } else if (doc.kind === 'text') {
    return mkText(doc.text, best(maxWidth, curWidth + doc.text.length, doc.next))
  } else if (doc.kind === 'union') {
    return better(maxWidth, 
                  curWidth, 
                  best(maxWidth, curWidth, doc.doc1),
                  best(maxWidth, curWidth, doc.doc2))
  } else {
    throw new Error()
  }
}

function better(maxWidth: number, curWidth: number, doc1: Doc, doc2: Doc): Doc {
  return fits(maxWidth - curWidth, doc1) ? doc1 : doc2
}

/**
 * Checks the first line of the document for whether it fits the desired width.
 */
function fits(width: number, doc: Doc): boolean {
  if (width < 0) {
    return false
  } else if (doc.kind === 'nil' || doc.kind === 'line') {
    return true
  } else if (doc.kind === 'text') {
    return fits(width - doc.text.length, doc.next)
  } else if (doc.kind === 'union') {
    throw new Error("Expecting Doc without union (i.e. a result of 'best' function)")
  } else {
    throw new Error("not impl")
  }
}

export function pretty(width: number, doc: Doc): string {
  return layout(best(width, 0, doc))
}

export function concat(left: Doc, right: Doc, ...rest: Doc[]): Doc {
  if (rest.length === 0) {
    return concatTwo(left, right)
  } else {
    return concat(concatTwo(left, right), rest[0], ...rest.slice(1))
  }
}

function concatTwo(left: Doc, right: Doc): Doc {
  if (left.kind === 'nil') {
    return right
  } else if (left.kind === 'text') {
    return { kind: 'text', text: left.text, next: concatTwo(left.next, right) }
  } else if (left.kind === 'line') {
    return { kind: 'line', depth: left.depth, next: concatTwo(left.next, right) }
  } else if (left.kind === 'union') {
    return union(concatTwo(left.doc1, right), concatTwo(left.doc2, right))
  } else {
    throw new Error()
  }
}

export function nil(): Doc {
  return NIL
}

export function text(text: string): Doc {
  return { kind: 'text', text, next: nil() }
}

export function line(): Doc {
  return { kind: 'line', depth: 0, next: nil() }
}

export function nest(depth: number, doc: Doc): Doc {
  if (doc.kind === 'nil') {
    return nil()
  } else if (doc.kind === 'text') {
    return mkText(doc.text, nest(depth, doc.next))
  } else if (doc.kind === 'line') {
    return mkLine(depth + doc.depth, nest(depth, doc.next))
  } else if (doc.kind === 'union') {
    return union(nest(depth, doc.doc1), nest(depth, doc.doc2))
  } else {
    throw new Error("not impl")
  }
}

export function layout(doc: Doc): string {
  if (doc.kind === 'nil') {
    return ''
  } else if (doc.kind === 'line') {
    return '\n' + ' '.repeat(doc.depth) + layout(doc.next)
  } else if (doc.kind === 'text') {
    return doc.text + layout(doc.next)
  } else if (doc.kind === 'union') {
    throw new Error("#layout called with Union in Doc, use #pretty instead")
  } else {
    throw new Error()
  }
}
