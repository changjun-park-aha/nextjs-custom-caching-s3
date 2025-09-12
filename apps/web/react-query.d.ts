// types/index.d.ts
declare interface ResponseError {
  status: number
}

//index.d.ts
import '@tanstack/react-query'

declare module '@tanstack/react-query' {
  interface Register {
    defaultError: ResponseError
  }
}
