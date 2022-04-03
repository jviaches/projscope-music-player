import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { ElectronService } from '../core/services';
import { Song } from '../models/song.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  @ViewChild('player', { static: true }) player: ElementRef;

  currentProgress$ = new BehaviorSubject(0);
  currentTime$ = new Subject();
  songs: Song[] = [];

  audio = new Audio();
  isPlaying = false;
  activeSong: Song;;
  durationTime: string;

  isPlayListOpened = false;
  isShuffleModeOn = false;
  isRepeatModeOn = false;

  constructor(public electronService: ElectronService) { }

  ngOnInit() {
    this.electronService.mediaSources.subscribe(receivedMedia => {

      const existingSongIndex = this.songs.findIndex(media => media.path === receivedMedia);

      if (existingSongIndex === -1) {
        const song = new Song();
        song.path = receivedMedia;
        song.title = this.extractFileNameFromPath(receivedMedia);

        this.songs.push(song);

        this.setInitialActiveSong();
      }
    });

    this.setInitialActiveSong();
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
    this.songs.splice(songIndex, 1);

    // if deleted song is an active one
    if (this.activeSong.path === songPath) {
      this.resetSong(this.songs[0]);

      if (this.songs.length !== 0) {
        this.setSongDuration();
      }
    }
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

  getListOfSongs(): Song[] {
    return [
      {
        title: 'music_1.mp3',
        path: './assets/music/music_1.mp3'
      },
      {
        title: 'music_2.mp3',
        path: './assets/music/music_2.mp3'
      },
      {
        title: 'music_3.mp3',
        path: './assets/music/music_3.mp3'
      },
      {
        title: 'music_4.mp3',
        path: './assets/music/music_4.mp3'
      },
      {
        title: 'music_5.mp3',
        path: './assets/music/music_5.mp3'
      }
    ];
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

  private resetSong(song: Song) {
    this.durationTime = undefined;
    this.audio.pause();

    this.player.nativeElement.src = song?.path;
    this.player.nativeElement.load();
    this.activeSong = song;
    this.isPlaying = false;
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
    return path.split('\\').pop().split('/').pop();
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
