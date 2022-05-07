/**
 * Implementation of Oppens "Efficient but Less Simple Algorithm"
 */

import { Token } from "./oppen-tokens"

class Scanner {
  S: Stack<number> = new Stack()

  left: number
  right: number 
  leftTotal: number
  rightTotal: number 
  arraySize: number

  stream: Token[]
  size: number[]

  space: number

  scan() {
    let x
    while ((x = this.receive()).kind !== 'eof') {
      if (x.kind === 'block-begin') {
        if (this.S.isEmpty()) {
          this.left = this.right = this.leftTotal = this.rightTotal = 0
        } else {
          this.right = this.right === this.arraySize ? 1 : this.right + 1
        }

        this.stream[this.right] = x
        this.size[this.right] = -this.rightTotal
        this.S.push(this.right)
      } else if (x.kind === 'block-end') {
        if (this.S.isEmpty()) {
          this.print(x, 0)
        } else {
          this.right = this.right === this.arraySize ? 1 : this.right + 1
          this.stream[this.right] = x
          this.size[this.right] = 0

          let sTop: number = this.S.pop()
          this.size[sTop] += this.rightTotal
          if (this.stream[sTop].kind === 'blank' && !this.S.isEmpty()) {
            sTop = this.S.pop()
            this.size[sTop] += this.rightTotal
          }

          if (this.S.isEmpty()) {
            this.advanceLeft(this.stream[this.left], this.size[this.left])
          }
        }
      } else if (x.kind === 'blank') {
        if (this.S.isEmpty()) {
          this.left = this.right = this.rightTotal = 0
        } else {
          this.right = this.right === this.arraySize ? 1 : this.right + 1
          if (this.stream[this.S.top()].kind === 'blank') {
            const sTop = this.S.pop()
            this.size[sTop] += this.rightTotal
          }
        }

        this.stream[this.right] = x
        this.size[this.right] = -this.rightTotal

        this.S.push(this.right)
        this.rightTotal++
      } else if (x.kind === 'string') {
        if (this.S.isEmpty()) {
          this.print(x, x.string.length)
        } else {
          this.right = this.right === this.arraySize ? 1 : this.right + 1
          this.stream[this.right] = x
          this.size[this.right] = x.string.length
          this.rightTotal += x.string.length
          while ((this.rightTotal - this.leftTotal) > this.space) {
            this.size[this.popBottom()] = Number.MAX_SAFE_INTEGER
            this.advanceLeft(this.stream[this.left], this.size[this.left])
          }
        }
      }
    }
  }

  receive(): Token {
    return null
  }

  print(x: Token, l: number) {

  }

  advanceLeft(x: Token, l: number) {
    if (l >= 0) {
      this.print(x, l)

      if (x.kind === 'blank') {
        this.leftTotal++
      } else if (x.kind === 'string') {
        this.leftTotal += l
      }

      if (this.left != this.right) {
        this.left = this.left === this.arraySize ? 1 : this.left + 1
        this.advanceLeft(this.stream[this.left], this.size[this.left])
      }
    }
  }

  popBottom(): number {
    throw new Error('impl')
  }
}

class Stack<T> {
  _array: T[] = []

  isEmpty() {
    return this._array.length === 0
  } 

  push(item: T) {
    this._array.push(item)
  }

  pop(): T {
    return this._array.pop()
  }

  top(): T {
    return this._array.at(-1)
  }
}