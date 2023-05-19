import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { ElectronService } from '../core/services';
import { Song } from '../models/song.model';
import { log } from 'console';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  @ViewChild('player', { static: true }) player: ElementRef;
  @ViewChild('progressArea', { static: true }) progressArea: ElementRef;

  currentProgress$ = new BehaviorSubject(0);
  currentTime$ = new Subject();
  songs: Song[] = [];

  audio = new Audio();
  isPlaying = false;
  activeSong: Song;

  durationTime: string;

  isPlayListOpened = false;
  isShuffleModeOn = false;
  isRepeatModeOn = false;

  constructor(public electronService: ElectronService) {
  }

  ngOnInit() {
    this.electronService.mediaSources.subscribe(receivedMedia => {

      // needed for first time program run (receivedMedia = null)
      if (!receivedMedia) {
        return;
      }

      let existingSongIndex = -1;

      // receivedMedia can be Song (Load flow) or file relative path string (add file to playlist flow)
      if (receivedMedia?.path) {
        existingSongIndex = this.songs.findIndex(media => media.path === receivedMedia?.path);
      } else {
        existingSongIndex = this.songs.findIndex(media => media.path === receivedMedia);
      }

      if (existingSongIndex === -1) {
        // load playlist flow
        if (receivedMedia?.path) {
          this.songs.push(receivedMedia);
        } else { // add file to playlist flow
          const song = new Song();
          song.path = receivedMedia;
          song.title = this.extractFileNameFromPath(receivedMedia);

          this.songs.push(song);
        }

        this.setInitialActiveSong();
      }
    });

    this.electronService.saveStatusChange.subscribe(statusChange => {
      if (statusChange) {
        this.electronService.saveMediaList(this.songs);
      }
    });

    this.setInitialActiveSong();
  }

  displaySongTitle(songName: string) {
    const titleLength = 45;

    if (!songName) {
      return '';
    }

    return songName.length > titleLength ?
      songName.substring(0, titleLength) + '...' :
      songName;
  }

  seekToTime(event) {
    const offsetWidth = this.progressArea.nativeElement.clientWidth;
    const percents = this.generatePercentage(event.offsetX, offsetWidth);

    if (!isNaN(percents)) {
      const currentSeconds = Math.floor(this.player.nativeElement.currentTime % 60);
      this.player.nativeElement.currentTime = currentSeconds * percents / 100;

      this.player.nativeElement.currentTime = percents * this.player.nativeElement.duration / 100;
    }
  }

  playSong(song: Song): void {

    if (this.audio.paused && this.player.nativeElement.currentTime > 0 && this.activeSong.path === song.path) {
      this.player.nativeElement.play();
      this.isPlaying = true;
      return;
    }

    this.resetSong(song);

    this.player.nativeElement.play();
    this.isPlaying = true;
  }

  playSongFromPlaylist(songPath: string): void {

    const songIndex = this.songs.findIndex((song) => song.path === songPath);

    if (songIndex !== -1) {
      this.playSong(this.songs[songIndex]);
    }
  }

  deleteSongFromPlaylist(songPath: string): void {
    const songIndex = this.songs.findIndex((song) => song.path === songPath);

    if (songIndex === -1) {
      return;
    }

    this.songs.splice(songIndex, 1);

    // if deleted song is an active one
    if (this.activeSong.path === songPath) {
      this.resetSong(this.songs[0]);

      if (this.songs.length !== 0) {
        this.setSongDuration();
      }
    }

    this.electronService.saveMediaList(this.songs);
  }

  onTimeUpdate() {
    if (!this.durationTime) {
      this.setSongDuration();
    }

    const currentMinutes = this.generateMinutes(this.player.nativeElement.currentTime);
    const currentSeconds = this.generateSeconds(this.player.nativeElement.currentTime);
    this.currentTime$.next(this.generateTimeToDisplay(currentMinutes, currentSeconds));

    const percents = this.generatePercentage(this.player.nativeElement.currentTime, this.player.nativeElement.duration);

    if (!isNaN(percents)) {
      this.currentProgress$.next(percents);
    }
  }

  onEnded() {
    if (this.isShuffleModeOn) {
      this.playRandomSong();
    } else {
      this.playNextSong();
    }
  }

  playNextSong(): void {
    if (this.songs.length < 2) {
      return;
    }

    const songIndex = this.songs.findIndex((song) => song.path === this.activeSong?.path);
    if (songIndex === -1) {
      return;
    }
    const nextSongIndex = songIndex + 1;

    if (this.isShuffleModeOn) {
      this.playRandomSong();
      return;
    }

    if (nextSongIndex === this.songs.length && this.isRepeatModeOn) {
      this.playSong(this.songs[0]);
    } else {
      if (nextSongIndex < this.songs.length) {
        this.playSong(this.songs[songIndex + 1]);
      }
    }
  }

  playPreviousSong(): void {
    if (this.songs.length < 2) {
      return;
    }

    const songIndex = this.songs.findIndex((song) => song.path === this.activeSong?.path);
    if (songIndex === -1) {
      return;
    }

    const prevSongIndex = songIndex - 1;

    if (prevSongIndex >= 0) {
      this.playSong(this.songs[prevSongIndex]);
    }
  }

  onPause(): void {
    this.isPlaying = false;
    this.audio.pause();
  }

  togglePlayList() {
    this.isPlayListOpened = !this.isPlayListOpened;

    if (this.isPlayListOpened) {
      this.electronService.windowsResize(600);
    } else {
      this.electronService.windowsResize(170);
    }
  }

  toggleShuffleMode() {
    this.isShuffleModeOn = !this.isShuffleModeOn;
  }

  playRandomSong() {
    let randomSong = Math.floor(Math.random() * this.songs.length);

    while (this.activeSong.path === this.songs[randomSong].path) {
      randomSong = Math.floor(Math.random() * this.songs.length);
    }

    this.playSong(this.songs[randomSong]);
  }

  addMediaFiles() {
    this.electronService.openFileDialog();
  }

  setRepeatMode() {
    this.isRepeatModeOn = !this.isRepeatModeOn;
  }

  closeProgram() {
    this.electronService.closeProgram();
  }

  minimizeProgram() {
    this.electronService.minimizeProgram();
  }

  isPrevControlDisabled() {
    return this.songs && this.songs[0] === this.activeSong;
  }

  isNextControlDisabled() {
    return this.songs && this.songs[this.songs.length - 1] === this.activeSong && !this.isShuffleModeOn;
  }

  isPlayControlDisabled() {
    return !(this.songs && this.songs.length > 0);
  }

  isRepeatControlDisabled() {
    return !(this.songs && this.songs.length > 0);
  }

  isShuffleControlDisabled() {
    return !(this.songs && this.songs.length > 1);
  }

  private resetSong(song: Song) {
    this.durationTime = undefined;
    this.audio.pause();

    this.player.nativeElement.src = song?.path;
    this.player.nativeElement.load();
    this.activeSong = song;
    this.isPlaying = false;
    this.currentProgress$.next(0);
  }

  private setSongDuration(): void {
    const durationInMinutes = this.generateMinutes(this.player.nativeElement.duration);
    const durationInSeconds = this.generateSeconds(this.player.nativeElement.duration);

    if (!isNaN(this.player.nativeElement.duration)) {
      this.durationTime = this.generateTimeToDisplay(durationInMinutes, durationInSeconds);
    }
  }

  private generateMinutes(currentTime: number): number {
    return Math.floor(currentTime / 60);
  }

  private generateSeconds(currentTime: number): number | string {
    const secsFormula = Math.floor(currentTime % 60);
    return secsFormula < 10 ? '0' + String(secsFormula) : secsFormula;
  }

  private generateTimeToDisplay(currentMinutes, currentSeconds): string {
    return `${currentMinutes}:${currentSeconds}`;
  }

  private generatePercentage(currentTime: number, duration: number): number {
    return Math.round((currentTime / duration) * 100);
  }

  private extractFileNameFromPath(path: string) {
    if (path && path.length > 0) {
      return path.split('\\').pop().split('/').pop();
    }

    return '';
  }

  private setInitialActiveSong() {
    if (this.songs.length > 0 && !this.activeSong) {
      this.player.nativeElement.src = this.songs[0];
      this.player.nativeElement.load();
      this.activeSong = this.songs[0];
      this.isPlaying = false;
    }
  }
}
