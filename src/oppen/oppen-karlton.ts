export type Token = TString | Break | Begin | End | EOF

export type Breaks = 'consistent' | 'inconsistent'

export type TString = { kind: 'string', string: string }
export type Break = { kind: 'break', blankSpace: number, offset: number }
export type Begin = { kind: 'begin', offset: number, breakType: Breaks }
export type End = { kind: 'end' }
export type EOF = { kind: 'eof' }

const BLOCK_END: End = { kind: 'end' }
const EOF: EOF = { kind: 'eof' }

export function mkString(string: string): TString {
  return { kind: 'string', string }
}

export function mkBreak(blankSpace: number = 1, offset: number = 0): Break {
  return { kind: 'break',  blankSpace, offset }
}

export function mkBegin(offset: number = 2, breakType: Breaks = 'inconsistent'): Begin {
  return { kind: 'begin', offset, breakType }
}

export function mkEnd(): End {
  return BLOCK_END
}

export function mkEOF(): EOF {
  return EOF
}

const MAX_BLANKS = Number.MAX_SAFE_INTEGER
const LINE_BREAK: Break = mkBreak(MAX_BLANKS)

export class PrettyPrinter {
  outputBuffer: string[]

  margin: number
  space: number 

  left: number 
  right: number

  token: Token[] = []
  size: number[] = []

  leftTotal: number
  rightTotal: number

  sizeInfinity: number = Number.MAX_SAFE_INTEGER
  scanStack: number[]

  // top: number 
  // bottom: number
  printStack: PrintStack = new PrintStack()

  // PrettyPrintInit
  constructor(lineWidth: number = 75) {
    let n: number 

    this.space = this.margin = lineWidth
    n = 3 * this.margin
  }

  prettyPrint(t: Token) {
    if (t.kind === 'eof') {
      if (this.scanStack.length !== 0) {
        this.checkStack(0)
        this.advanceLeft(this.token[this.left], this.size[this.left])
      }

      this.indent(0)
    } else if (t.kind === 'begin') {
      if (this.scanStack.length === 0) {
        this.leftTotal = this.rightTotal = 1
        this.left = this.right = 0
      } else {
        this.advanceRight()
      }

      this.token[this.right] = t
      this.size[this.right] = -this.rightTotal
      this.scanPush(this.right)
    } else if (t.kind === 'end') {
      if (this.scanStack.length === 0) {
        this.print(t, 0)
      } else {
        this.advanceRight()
        this.token[this.right] = t
        this.size[this.right] = -1
        this.scanPush(this.right)
      }
    } else if (t.kind === 'break') {
      if (this.scanStack.length === 0) {
        this.leftTotal = this.rightTotal = 1
        this.left = this.right = 0
      } else {
        this.advanceRight()
      }

      this.checkStack(0)
      this.scanPush(this.right)
      this.token[this.right] = t
      this.size[this.right] = -this.rightTotal
      this.rightTotal = this.rightTotal + t.blankSpace
    } else if (t.kind === 'string') {
      if (this.scanStack.length === 0) {
        this.print(t, t.string.length)
      } else {
        this.advanceRight()
        this.token[this.right] = t
        this.size[this.right] = t.string.length
        this.rightTotal = this.rightTotal + t.string.length
        this.checkStream()
      }
    }
  }

  checkStream() {
    if (this.rightTotal - this.leftTotal > this.space) {
      if (this.scanStack.length > 0) {
        if (this.left = this.scanBottom()) {
          this.size[this.scanPopBottom()] = this.sizeInfinity
        }
      }

      this.advanceLeft(this.token[this.left], this.size[this.left])
      if (this.left !== this.right) {
        this.checkStream()
      }
    }
  }

  scanPush(x: number) {
    this.scanStack.push(x)
  }

  scanPop() {
    const res = this.scanStack.pop()
    if (typeof res === 'undefined') {
      throw new Error('Cannot pop, scan stack is empty')
    }
    return res
  }

  scanBottom(): number {
    if (this.scanStack.length === 0) {
      throw new Error('Cannot show bottom, scan stack is empty')
    } else {
      return this.scanStack[0]
    }
  }

  scanTop(): number {
    if (this.scanStack.length === 0) {
      throw new Error('Cannot show top, scan stack is empty')
    } else {
      return this.scanStack.at(-1)
    }
  }

  scanPopBottom(): number {
    const bottom = this.scanStack.shift()
    if (typeof bottom === 'undefined') {
      throw new Error('Cannot pop bottom, scan stack is empty')
    }
    return bottom
  }

  advanceRight() {
    this.right++
  }

  advanceLeft(x: Token, l: number) {
    if (l < 0) {
      return
    }

    this.print(x, l)

    if (x.kind === 'break') {
      this.leftTotal += x.blankSpace
    } else if (x.kind === 'string') {
      this.leftTotal += l
    }

    if (this.left !== this.right) {
      this.left++
      this.advanceLeft(this.token[this.left], this.size[this.left])
    }
  }

  checkStack(k: number) {
    if (this.scanStack.length === 0) {
      return
    }

    const x: number = this.scanTop()
    const t: Token = this.token[x]
    if (t.kind === 'begin') {
      if (k > 0) {
        this.size[this.scanPop()] += this.rightTotal
        this.checkStack(k - 1)
      }
    } else if (t.kind === 'end') {
      this.size[this.scanPop()] = 1
      this.checkStack(k + 1)
    } else {
      this.size[this.scanPop()] += this.rightTotal
      if (k > 0) {
        this.checkStack(k)
      }
    }
  }

  printNewLine(amount: number) {
    this.outputBuffer.push('\n' + ' '.repeat(amount))
  }

  indent(amount: number) {
    this.outputBuffer.push(' '.repeat(amount))
  }

  print(x: Token, l: number) {
    if (x.kind === 'begin') {
      if (l > this.space) {
        this.printStack.push({
          offset: this.space - x.offset,
          break: x.breakType === 'consistent' ? 'consistent' : 'inconsistent'
        })
      } else {
        this.printStack.push({ offset: 0, break: 'fits' })
      }
    } else if (x.kind === 'end') {
      this.printStack.pop()
    } else if (x.kind === 'break') {
      const printTop = this.printStack.top()
      if (printTop.break === 'fits') {
          this.space -= x.blankSpace
      } else if (printTop.break === 'consistent') {
          this.space = this.printStack.top().offset - x.offset
          this.printNewLine(this.margin - this.space)
      } else if (printTop.break === 'inconsistent') {
        if (l > this.space) {
          this.space = printTop.offset - x.offset
          this.printNewLine(this.margin - this.space)
        } else {
          this.space -= x.blankSpace
        }
      } 
    } else if (x.kind === 'string') {
      if (l > this.space) {
        throw new Error('LineTooLong')
      }

      this.space -= l
      this.outputBuffer.push(x.string)
    } else {
      throw new Error('Unhandled token type: ' + x.kind)
    }
  }

  getOutput(): string {
    return this.outputBuffer.join('')
  }
}

type PrintStackBreak = 'fits' | 'inconsistent' | 'consistent'

type PrintStackEntry = {
  offset: number,
  break: PrintStackBreak
}

class PrintStack {
  index: number
  items: PrintStackEntry[]

  constructor(index = 0) {
    this.index = index 
    this.items = []
  }

  push(entry: PrintStackEntry) {
    this.items.push(entry)
  }

  pop(): PrintStackEntry {
    return this.items.pop()
  }

  top(): PrintStackEntry {
    return this.items.at(-1)
  }
}

