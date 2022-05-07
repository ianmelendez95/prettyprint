import { Blank, mkBlank, mkBlockBegin, mkBlockEnd, mkEOF, mkString, Token } from './oppen-tokens'

/**
 * Implementation as described by Derek C. Oppen in his paper 'Prettyprinting', 1980
 */

export class PPrint {
  printer: Printer
  scanner: Scanner

  constructor(margin: number, input: Token[]) {
    this.printer = new Printer(margin)
    this.scanner = new Scanner(new Tokenizer(input), this.printer)
  }

  scan() {
    this.scanner.scan()
  }

  getOutput(): string {
    return this.printer.getOutput()
  }
}

export class Scanner {
  left: number 
  right: number 
  rightTotal: number

  S: number[] = []
  
  stream: Token[] = []
  size: number[] = []

  tokenizer: Tokenizer
  printer: Printer

  constructor(tokenizer: Tokenizer,
              printer: Printer) {
    this.tokenizer = tokenizer
    this.printer = printer
  }

  scan() {
    let x: Token | number
    while ((x = this.tokenizer.next()).kind !== 'eof') {
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

        x = this.S.pop()
        this.size[x] += this.rightTotal

        if (this.stream[x].kind === 'blank') {
          x = this.S.pop()
          this.size[x] = this.rightTotal + this.size[x]
        }

        if (this.S.length === 0) {
          while (this.left <= this.right) {
            this.printer.print(this.stream[this.left], this.size[this.left])
            this.left++
          }
        }
      } else if (x.kind === 'blank') {
        this.right++
        this.stream[this.right] = x
        this.size[this.right] = -this.rightTotal

        x = this.S.at(-1)
        if (this.stream[x].kind === 'blank') {
          this.size[this.S.pop()] = this.rightTotal + this.size[x]
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
}

export class Tokenizer {
  inputBuffer: Token[]

  inputIdx: number = 0

  constructor(input: Token[]) {
    this.inputBuffer = input
  }

  next(): Token {
    if (this.inputIdx >= this.inputBuffer.length) {
      return mkEOF()
    } else {
      const result = this.inputBuffer[this.inputIdx]
      this.inputIdx++
      return result
    }
  }
}

export class Printer {
  space: number = 0
  S: number[] = []

  outputBuffer: string[] = []

  margin: number

  constructor(margin: number) {
    this.space = margin
    this.margin = margin
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
      this.S.push(this.space)
    } else if (x.kind === 'block-end') {
      this.S.pop()
    } else if (x.kind === 'blank') {
      if (l > this.space) {
        this.space = this.S[-1] - 2
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
