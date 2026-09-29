import { createContext, useContext } from 'react'

export interface UIControls {
  openSearch: () => void
  openAsk: (resourceId?: string) => void
  openShortcuts: () => void
  openRevise: () => void
}

export const UIContext = createContext<UIControls>({
  openSearch: () => {},
  openAsk: () => {},
  openShortcuts: () => {},
  openRevise: () => {},
})

export const useUI = () => useContext(UIContext)
