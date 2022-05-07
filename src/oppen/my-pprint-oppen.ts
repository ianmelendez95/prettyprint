import { Token, Blank, mkEOF } from "./pprint-oppen"

export class PPrint {
  S: number[] = []

  stream: Token[] = []
  size: number[] = []

  printer: Printer
  tokenizer: Tokenizer

  left: number 
  right: number
  rightTotal: number

  constructor(margin: number, input: Token[]) {
    this.printer = new Printer(margin)
    this.tokenizer = new Tokenizer(input)
  }

  scan() {
    let x: Token | number
    while ((x = this.receive()).kind !== 'eof') {
      if (x.kind === 'block-begin') {
        if (this.S.length === 0) {
          this.left = this.right = this.rightTotal = 0
        } else {
          this.right++
        }

        this.stream[this.right] = x
        this.size[this.right] = -this.rightTotal
        this.S.push(this.right)
      } else if (x.kind === 'block-end') {
        this.right++
        this.stream[this.right] = x
        this.size[this.right] = 0

        // update the previous blank if there is any
        const topIdx = this.S[-1]
        if (this.stream[top(this.S)].kind === 'blank') {
          const topIdx = this.S.pop()
          this.size[topIdx] += this.rightTotal
        }

        if (this.S.length === 0) {
          while (this.left <= this.right) {
            this.printer.print(this.stream[this.left], this.size[this.left])
          }
        }
      } else if (x.kind === 'blank') {
        this.right++
        this.stream[this.right] = x
        this.size[this.right] = -this.rightTotal
        
        // update the previous blank if there is any
        const topIdx = this.S[-1]
        if (this.stream[top(this.S)].kind === 'blank') {
          const topIdx = this.S.pop()
          this.size[topIdx] += this.rightTotal
        }

        this.S.push(this.right)
        this.rightTotal++
      } else if (x.kind === 'string') {
        if (this.S.length === 0) {
          this.printer.print(x, x.string.length)
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
    return this.tokenizer.next()
  }

  getOutput(): string {
    return this.printer.getOutput()
  }
}

class Printer {
  output: string[] = []
  margin: number

  space: number

  S: number[]

  constructor(margin: number) {
    this.space = margin
    this.margin = margin
  }

  print(x: Token, l: number) {
    if (x.kind === 'string') {
      this.output.push(x.string)
      this.space -= l
    } else if (x.kind === 'block-begin') {
      this.S.push(this.space)
    } else if (x.kind === 'block-end') {
      this.S.pop()
    } else if (x.kind === 'blank') {
      if (l > this.space) {
        this.space = this.S[-1] - 2
        this.indent(this.margin - this.space)
      } else {
        this.output.push(' ')
        this.space--
      }
    }
  }

  indent(x: number) {
    this.output.push('\n' + ' '.repeat(x))
  }

  getOutput(): string {
    return this.output.join('')
  }
}

class Tokenizer {
  input: Token[]
  inputIdx: number = 0

  constructor(input: Token[]) {
    this.input = input
  }

  next(): Token {
    if (this.inputIdx >= this.input.length) {
      return mkEOF()
    } else {
      const result = this.input[this.inputIdx]
      this.inputIdx++
      return result
    }
  }
}

function top<T>(stack: T[]): T {
  return stack[-1]
}