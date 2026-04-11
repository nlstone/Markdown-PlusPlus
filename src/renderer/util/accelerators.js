import { ipcRenderer } from 'electron'

let cachedAccelerators = null

export const getAccelerators = () => {
  if (cachedAccelerators) {
    return Promise.resolve(cachedAccelerators)
  }
  return new Promise((resolve) => {
    ipcRenderer.once('mt::keybindings-response', (e, keybindings) => {
      cachedAccelerators = keybindings
      resolve(keybindings)
    })
    ipcRenderer.send('mt::request-keybindings')
  })
}

export const clearAcceleratorCache = () => {
  cachedAccelerators = null
}
