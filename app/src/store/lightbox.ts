import { create } from 'zustand'
import type { Moment } from '../types'

/**
 * Global trigger for the photo lightbox (docs/16 §3). Any surface that
 * renders a PhotoThumbnail can open it without prop-drilling a callback —
 * a single <Lightbox /> is mounted once in App.tsx and reads this store.
 */
interface LightboxState {
  moment: Moment | null
  open: (moment: Moment) => void
  close: () => void
}

export const useLightboxStore = create<LightboxState>((set) => ({
  moment: null,
  open: (moment) => set({ moment }),
  close: () => set({ moment: null }),
}))
