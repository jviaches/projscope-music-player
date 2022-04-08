import { Injectable, NgZone } from '@angular/core';

// If you import a module but never use any of the imported values other than as TypeScript types,
// the resulting javascript file will look as if you never imported the module at all.
import { ipcRenderer, webFrame } from 'electron';
import * as childProcess from 'child_process';
import * as fs from 'fs';
import { BehaviorSubject, Observable } from 'rxjs';
import { Song } from '../../../models/song.model';

@Injectable({
  providedIn: 'root'
})
export class ElectronService {
  ipcRenderer: typeof ipcRenderer;
  webFrame: typeof webFrame;
  childProcess: typeof childProcess;
  fs: typeof fs;

  mediaSources = new BehaviorSubject(null);
  saveStatusChange = new BehaviorSubject(false);

  playListFileName = 'playlist.cfg';

  constructor(private ngZone: NgZone) {
    // Conditional imports
    if (this.isElectron) {
      this.ipcRenderer = window.require('electron').ipcRenderer;
      this.webFrame = window.require('electron').webFrame;

      this.childProcess = window.require('child_process');
      this.fs = window.require('fs');

      this.loadMediaList();

      // Notes :
      // * A NodeJS's dependency imported with 'window.require' MUST BE present in `dependencies` of both `app/package.json`
      // and `package.json (root folder)` in order to make it work here in Electron's Renderer process (src folder)
      // because it will loaded at runtime by Electron.
      // * A NodeJS's dependency imported with TS module import (ex: import { Dropbox } from 'dropbox') CAN only be present
      // in `dependencies` of `package.json (root folder)` because it is loaded during build phase and does not need to be
      // in the final bundle. Reminder : only if not used in Electron's Main process (app folder)

      // If you want to use a NodeJS 3rd party deps in Renderer process,
      // ipcRenderer.invoke can serve many common use cases.
      // https://www.electronjs.org/docs/latest/api/ipc-renderer#ipcrendererinvokechannel-args

      this.ipcRenderer.on('add-media', (event, arg) => {
        this.ngZone.run(() => {
          arg.forEach(element => {
            this.mediaSources.next(element);
            this.saveStatusChange.next(true);
          });
        });
      });
    }
  }

  get isElectron(): boolean {
    return !!(window && window.process && window.process.type);
  }

  closeProgram() {
    if (this.isElectron) {
      this.ipcRenderer.send('close-app', true);
    }
  }

  minimizeProgram() {
    if (this.isElectron) {
      this.ipcRenderer.send('minimize-app', true);
    }
  }

  windowsResize(heigh: number) {
    if (this.isElectron) {
      this.ipcRenderer.send('resize-app', heigh);
    }
  }

  openFileDialog(): void {
    this.ipcRenderer.send('open-file-dialog');
  }

  saveMediaList(content: any) {
    this.fs.writeFile(this.playListFileName, JSON.stringify(content), (err) => {
      if (err) {
        alert('An error ocurred updating settings file' + err.message);
        console.log(err);
        return;
      } else {
        console.log('File saved succesfully!');
      }
    });
  }

  loadMediaList() {
    this.fs.readFile(this.playListFileName, 'utf-8', (err, data) => {
      try {
        this.triggerMediaSourceChanges(JSON.parse(data));
      } catch (error) {
        console.log('Unable to load.. ' + error);
      }
    });
  }

  private triggerMediaSourceChanges(data: Song[] | string[]) {
    data.forEach(mediaItem => {
      this.mediaSources.next(mediaItem);
    });
  }
}
