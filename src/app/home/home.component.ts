import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { ISong } from '../models/song.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  @ViewChild('player', { static: true }) player: ElementRef

  currentProgress$ = new BehaviorSubject(0);
  currentTime$ = new Subject();
  songs: ISong[] = [];

  audio = new Audio();
  isPlaying = false;
  activeSong: ISong;;
  durationTime: string;

  isPlayListOpened = false;

  constructor() { }

  ngOnInit() {
    this.songs = this.getListOfSongs();

    this.player.nativeElement.src = this.songs[0];
    this.player.nativeElement.load();
    this.activeSong = this.songs[0];
    this.isPlaying = false;
  }

  playSong(song: ISong): void {

    if (this.audio.paused && this.player.nativeElement.currentTime > 0 && this.activeSong.id === song.id) {
      this.player.nativeElement.play();
      this.isPlaying = true;
      return;
    }

    this.durationTime = undefined;
    this.audio.pause();

    this.player.nativeElement.src = song.path;
    this.player.nativeElement.load();
    this.player.nativeElement.play();
    this.activeSong = song;
    this.isPlaying = true;
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

  playNextSong(): void {
    const nextSongIndex = this.songs.findIndex((song) => song.id === this.activeSong.id + 1);

    console.log('Next song Id: ' + nextSongIndex);

    if (nextSongIndex === -1) {
      this.playSong(this.songs[0]);
    } else {
      this.playSong(this.songs[nextSongIndex]);
    }
  }

  playPreviousSong(): void {
    const prevSongIndex = this.songs.findIndex((song) => song.id === this.activeSong.id - 1);

    if (prevSongIndex === -1) {
      this.playSong(this.songs[this.songs.length - 1]);
    } else {
      this.playSong(this.songs[prevSongIndex]);
    }
  }

  setSongDuration(): void {
    const durationInMinutes = this.generateMinutes(this.player.nativeElement.duration);
    const durationInSeconds = this.generateSeconds(this.player.nativeElement.duration);

    if (!isNaN(this.player.nativeElement.duration)) {
      this.durationTime = this.generateTimeToDisplay(durationInMinutes, durationInSeconds);
    }
  }

  generateMinutes(currentTime: number): number {
    return Math.floor(currentTime / 60);
  }

  generateSeconds(currentTime: number): number | string {
    const secsFormula = Math.floor(currentTime % 60);
    return secsFormula < 10 ? '0' + String(secsFormula) : secsFormula;
  }

  generateTimeToDisplay(currentMinutes, currentSeconds): string {
    return `${currentMinutes}:${currentSeconds}`;
  }

  generatePercentage(currentTime: number, duration: number): number {
    return Math.round((currentTime / duration) * 100);
  }

  onPause(): void {
    this.isPlaying = false;
    this.audio.pause();
  }

  getListOfSongs(): ISong[] {
    return [
      {
        id: 1,
        title: 'music_1.mp3',
        path: './assets/music/music_1.mp3'
      },
      {
        id: 2,
        title: 'music_2.mp3',
        path: './assets/music/music_2.mp3'
      },
      {
        id: 3,
        title: 'music_3.mp3',
        path: './assets/music/music_3.mp3'
      },
      {
        id: 64,
        title: 'music_4.mp3',
        path: './assets/music/music_4.mp3'
      },
      {
        id: 5,
        title: 'music_5.mp3',
        path: './assets/music/music_5.mp3'
      }



    ];
  }

  togglePlayList() {
    console.log(this.isPlayListOpened);
    this.isPlayListOpened = !this.isPlayListOpened;
  }

  playRandom() {
    console.log('playRandom');
  }

  rePlay() {
    console.log('rePlay');
  }
}
