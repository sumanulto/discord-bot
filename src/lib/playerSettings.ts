export type RepeatMode = "off" | "one" | "all"

export interface PlayerSettings {
  shuffleEnabled: boolean
  repeatMode: RepeatMode
  volume?: number
}

export const playerSettings = new Map<string, PlayerSettings>()
