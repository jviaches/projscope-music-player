export interface Song {
  title: string;
  path: string;
  type?: 'local' | 'stream';  // known at add-time; persists to playlist.cfg
  isLive?: boolean;           // set at runtime when duration === Infinity
}
