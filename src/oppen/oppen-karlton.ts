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

class PrettyPrinter {
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

  top: number 
  bottom: number
  printStack: PrintStack = new PrintStack(63)

  // PrettyPrintInit
  constructor(lineWidth: number = 75) {
    let n: number 

    this.space = this.margin = lineWidth
    n = 3 * this.margin
    this.top = this.bottom = 0
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

  prettyPrintInit() {}

  checkStack(x: number) {}

  checkStream() {}

  advanceLeft(t: Token, l: number) {}

  advanceRight() {}

  indent(x: number) {}

  scanPush(x: number) {}

  print(t: Token, l: number) {}
}

class PrintStack {
  x: number
  
  constructor(x: number) {
    x = x
  }
}