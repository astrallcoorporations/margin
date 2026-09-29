/// <reference types="vite/client" />

declare module 'virtual:local-files' {
  const files: { path: string; size: number; modified: number }[]
  export default files
}

declare module 'mammoth/mammoth.browser.js' {
  interface Result {
    value: string
    messages: unknown[]
  }
  const mammoth: {
    convertToHtml(input: { arrayBuffer: ArrayBuffer }): Promise<Result>
    extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<Result>
  }
  export default mammoth
}

declare module 'virtual:corpus' {
  /** Space-separated lower-case words from the study notes */
  const words: string
  export default words
}

declare module 'an-array-of-english-words' {
  const words: string[]
  export default words
}
