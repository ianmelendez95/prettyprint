export type Token = TString | BlockBegin | BlockEnd | Blank | EOF

export type TString = {
  kind: 'string',
  string: string
}
export type BlockBegin = { 
  kind: 'block-begin'
}
export type BlockEnd = { 
  kind: 'block-end'
}
export type Blank = {
  kind: 'blank',
  space: number
}
export type EOF = { kind: 'eof' }

const BLOCK_BEGIN: BlockBegin = { kind: 'block-begin' }
const BLOCK_END: BlockEnd = { kind: 'block-end' }
const EOF: EOF = { kind: 'eof' }

export function mkString(string: string): TString {
  return { kind: 'string', string }
}

export function mkBlockBegin(): BlockBegin {
  return { kind: 'block-begin' }
}

export function mkBlockEnd(): BlockEnd {
  return BLOCK_END
}

export function mkBlank(space: number): Blank {
  return { kind: 'blank', space }
}

export function mkEOF(): EOF {
  return EOF
}

/**
 * Implementation as described by Derek C. Oppen in his paper 'Prettyprinting', 1980
 */

export class PPrint {
  margin: number

  space: number = 0
  stack: number[] = []

  inputIdx: number = 0
  inputBuffer: Token[]
  outputBuffer: string[] = []

  stream: (Token | number)[] = []
  size: number[] = []

  left: number 
  right: number 
  rightTotal: number

  constructor(margin: number, input: Token[]) {
    this.margin = margin
    this.inputBuffer = input
  }

  scan() {
    let x: Token | number
    let S: number[] = []

    while ((x = this.receive()).kind !== 'eof') {
      if (x.kind === 'block-begin') {
        if (S.length === 0) {
          this.left = this.right = 0
          this.rightTotal = 1
        } else {
          this.right++
        }

        this.stream[this.right] = x
        this.size[this.right] = -this.rightTotal
        S.push(this.right)
      } else if (x.kind === 'block-end') {
        this.right++
        this.stream[this.right] = x
        this.size[this.right] = 0

        x = S.pop()
        this.size[x] += this.rightTotal

        if ((this.stream[x] as Token).kind === 'blank') {
          x = S.pop()
          this.size[x] = this.rightTotal + this.size[x]
        }

        if (S.length === 0) {
          while (this.left <= this.right) {
            this.print(this.stream[this.left] as Token, this.size[this.left])
            this.left++
          }
        }
      } else if (x.kind === 'blank') {
        this.right++

        x = S[-1]
        if ((this.stream[x] as Token).kind === 'blank') {
          this.size[S.pop()] = this.rightTotal + this.size[x]
        }

        this.stream[this.right] = x
        this.size[this.right] = -this.rightTotal
        S.push(this.right)
        this.rightTotal++
      } else if (x.kind === 'string') {
        if (S.length === 0) {
          this.print(x, x.string.length)
        } else {
          this.right++
          this.stream[this.right] = x
          this.size[this.right] = x.string.length
          this.rightTotal += x.string.length
        }
      }
    }
  }

  receive(): Token {
    if (this.inputIdx >= this.inputBuffer.length) {
      return EOF
    } else {
      const result = this.inputBuffer[this.inputIdx]
      this.inputIdx++
      return result
    }
  }

  /**
   * print(x, l):
   * cases
   *   x: string => output(x); space := space - l;
   *   x: [ => push(S, space);
   *   x: ] => pop(S);
   *   x: blank => if l > space
   *        then space := top(S) - 2; indent(margin - space);
   *        else output(x); space := space - 1;
   */
  print(x: Token, l: number) {
    if (x.kind === 'string') {
      this.output(x.string)
      this.space -= l
    } else if (x.kind === 'block-begin') {
      this.stack.push(this.space)
    } else if (x.kind === 'block-end') {
      this.stack.pop()
    } else if (x.kind === 'blank') {
      if (l > this.space) {
        this.space = this.stack[-1] - 2
        this.indent(this.margin - this.space)
      } else {
        this.output(x)
        this.space--
      }
    }
  }

  output(x: string | Blank) {
    if (typeof x === 'string') {
      this.outputBuffer.push(x)
    } else {
      this.outputBuffer.push(' ') // TODO - should it use Blank.space?
    }
  }

  indent(x: number) {
    this.outputBuffer.push('\n' + ' '.repeat(x))
  }

  getOutput(): string {
    return this.outputBuffer.join('')
  }
}
