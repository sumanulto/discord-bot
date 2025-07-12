export interface PlayerCurrent {
  title: string;
  author?: string;
  duration?: number;
  uri?: string;
  thumbnail?: string;
}

export interface PlayerQueueItem {
  title: string;
  author?: string;
  duration?: number;
  thumbnail?: string;
}

export interface Player {
  guildId: string;
  voiceChannel: string;
  textChannel: string;
  connected: boolean;
  playing: boolean;
  paused: boolean;
  position: number;
  volume: number;
  current?: PlayerCurrent | null;
  queue: PlayerQueueItem[];
}
