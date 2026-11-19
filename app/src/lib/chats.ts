/** Saved Vex conversations, kept on this device (localStorage). Pictures are not kept, only what they showed. */
export interface SavedChat {
  id: string
  title: string
  at: number
  items: unknown[]
}
const KEY = 'vex-chats-v1'
const MAX = 40

export function loadChats(): SavedChat[] {
  try {
    const raw = localStorage.getItem(KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}
function write(list: SavedChat[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)))
  } catch {
    try {
      localStorage.setItem(KEY, JSON.stringify(list.slice(0, 8)))
    } catch {
      /* storage full or off: history just is not kept */
    }
  }
}
export function saveChat(chat: SavedChat) {
  write([chat, ...loadChats().filter((c) => c.id !== chat.id)].sort((a, b) => b.at - a.at))
}
export function deleteChat(id: string) {
  write(loadChats().filter((c) => c.id !== id))
}
export const newChatId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
