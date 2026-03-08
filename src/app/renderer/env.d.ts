import { CoveApi } from '../preload/index'

declare global {
  interface Window {
    coveApi: CoveApi
  }
}
