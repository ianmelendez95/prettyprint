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
  kind: 'blank'
}
export type EOF = { kind: 'eof' }

const BLOCK_BEGIN: BlockBegin = { kind: 'block-begin' }
const BLOCK_END: BlockEnd = { kind: 'block-end' }
const BLANK: Blank = { kind: 'blank' }
const EOF: EOF = { kind: 'eof' }

export function mkString(string: string): TString {
  return { kind: 'string', string }
}

export function mkBlockBegin(): BlockBegin {
  return BLOCK_BEGIN
}

export function mkBlockEnd(): BlockEnd {
  return BLOCK_END
}

export function mkBlank(): Blank {
  return BLANK
}

export function mkEOF(): EOF {
  return EOF
}