import { Injectable, NgZone } from '@angular/core';

import { ipcRenderer, webFrame } from 'electron';
import * as childProcess from 'child_process';
import * as fs from 'fs';
import { Subject } from 'rxjs';
import { Song } from '../../../models/song.model';
import * as path from 'path';

export interface PlayerState {
  volume: number;
  isShuffleModeOn: boolean;
  isRepeatModeOn: boolean;
}

export interface RssEpisode {
  title: string;
  url: string;
}

export interface RssFeedResult {
  feedTitle: string;
  episodes: RssEpisode[];
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ElectronService {
  ipcRenderer: typeof ipcRenderer;
  webFrame: typeof webFrame;
  childProcess: typeof childProcess;
  fs: typeof fs;

  // Subject (not BehaviorSubject) — no null replay to new subscribers
  mediaSources = new Subject<Song | string>();
  saveStatusChange = new Subject<boolean>();
  playerState = new Subject<PlayerState>();
  rssFeedResult = new Subject<RssFeedResult>();

  playListFileName = 'playlist.cfg';
  playerStateFileName = 'player-state.cfg';

  constructor(private ngZone: NgZone) {
    if (this.isElectron) {
      this.ipcRenderer = window.require('electron').ipcRenderer;
      this.webFrame = window.require('electron').webFrame;
      this.childProcess = window.require('child_process');
      this.fs = window.require('fs');

      this.loadMediaList();
      this.loadPlayerState();

      this.ipcRenderer.on('add-media', (event, arg: string[]) => {
        this.ngZone.run(() => {
          arg.forEach(filePath => {
            this.mediaSources.next(filePath);
            this.saveStatusChange.next(true);
          });
        });
      });

      this.ipcRenderer.on('rss-feed-result', (_event, result: RssFeedResult) => {
        this.ngZone.run(() => this.rssFeedResult.next(result));
      });
    }
  }

  get isElectron(): boolean {
    return !!(window && window.process && window.process.type);
  }

  closeProgram() {
    if (this.isElectron) { this.ipcRenderer.send('close-app', true); }
  }

  minimizeProgram() {
    if (this.isElectron) { this.ipcRenderer.send('minimize-app', true); }
  }

  windowsResize(height: number) {
    if (this.isElectron) { this.ipcRenderer.send('resize-app', height); }
  }

  openFileDialog(): void {
    this.ipcRenderer.send('open-file-dialog');
  }

  openFolderDialog(): void {
    this.ipcRenderer.send('open-folder-dialog');
  }

  fetchRssFeed(feedUrl: string): void {
    if (this.isElectron) { this.ipcRenderer.send('fetch-rss-feed', feedUrl); }
  }

  saveMediaList(content: Song[]) {
    if (!this.isElectron) { return; }
    const filePath = this.getPlaylistFilePath();
    const dir = path.dirname(filePath);

    this.fs.mkdir(dir, { recursive: true }, (mkdirErr) => {
      if (mkdirErr && mkdirErr.code !== 'EEXIST') {
        console.error('Could not create playlist directory:', mkdirErr);
        return;
      }
      this.fs.writeFile(filePath, JSON.stringify(content), (writeErr) => {
        if (writeErr) { console.error('Could not save playlist:', writeErr); }
      });
    });
  }

  savePlayerState(state: PlayerState) {
    if (!this.isElectron) { return; }
    const filePath = this.getStateFilePath();
    this.fs.writeFile(filePath, JSON.stringify(state), (err) => {
      if (err) { console.error('Could not save player state:', err); }
    });
  }

  loadMediaList() {
    if (!this.isElectron) { return; }
    const filePath = this.getPlaylistFilePath();

    this.fs.readFile(filePath, 'utf-8', (err, data) => {
      if (err) {
        if (err.code !== 'ENOENT') { console.error('Could not load playlist:', err); }
        return;
      }
      try {
        const songs: Song[] = JSON.parse(data);
        this.ngZone.run(() => songs.forEach(song => this.mediaSources.next(song)));
      } catch (parseErr) {
        console.error('Playlist file is corrupt, starting fresh:', parseErr);
      }
    });
  }

  loadPlayerState() {
    if (!this.isElectron) { return; }
    const filePath = this.getStateFilePath();

    this.fs.readFile(filePath, 'utf-8', (err, data) => {
      if (err) {
        if (err.code !== 'ENOENT') { console.error('Could not load player state:', err); }
        return;
      }
      try {
        const state: PlayerState = JSON.parse(data);
        this.ngZone.run(() => this.playerState.next(state));
      } catch {
        // corrupt state file — ignore, defaults will be used
      }
    });
  }

  private getPlaylistFilePath(): string {
    try {
      const { app } = window.require('@electron/remote');
      return path.join(app.getPath('userData'), this.playListFileName);
    } catch {
      return this.playListFileName;
    }
  }

  private getStateFilePath(): string {
    try {
      const { app } = window.require('@electron/remote');
      return path.join(app.getPath('userData'), this.playerStateFileName);
    } catch {
      return this.playerStateFileName;
    }
  }
}
