import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ElectronService } from '../core/services';
import { Song } from '../models/song.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {

  @ViewChild('player', { static: true }) player: ElementRef;
  @ViewChild('progressArea', { static: true }) progressArea: ElementRef;

  currentProgress$ = new BehaviorSubject(0);
  currentTime$ = new Subject();
  songs: Song[] = [];

  isPlaying = false;
  activeSong: Song;
  isMuted = false;
  volume = 0.7;
  showVolumeSlider = false;

  durationTime: string;

  isShuffleModeOn = false;
  isRepeatModeOn = false;

  vinylGrooves = [0, 1, 2, 3, 4, 5];
  dragFromIndex: number | null = null;

  private destroy$ = new Subject<void>();

  constructor(public electronService: ElectronService) {}

  ngOnInit() {
    this.electronService.windowsResize(660);

    this.electronService.mediaSources.pipe(takeUntil(this.destroy$)).subscribe(receivedMedia => {
      if (!receivedMedia) return;

      let existingSongIndex = -1;
      if (receivedMedia?.path) {
        existingSongIndex = this.songs.findIndex(media => media.path === receivedMedia?.path);
      } else {
        existingSongIndex = this.songs.findIndex(media => media.path === receivedMedia);
      }

      if (existingSongIndex === -1) {
        if (receivedMedia?.path) {
          this.songs.push(receivedMedia);
        } else {
          this.songs.push({
            path: receivedMedia as string,
            title: this.extractFileNameFromPath(receivedMedia as string),
          });
        }
        this.setInitialActiveSong();
      }
    });

    this.electronService.saveStatusChange.pipe(takeUntil(this.destroy$)).subscribe(statusChange => {
      if (statusChange) {
        this.electronService.saveMediaList(this.songs);
      }
    });

    this.setInitialActiveSong();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Cover art helpers ───────────────────────────────────────

  getCoverGradient(): string {
    const hue = this.hashHue(this.activeSong?.title || '');
    const hue2 = (hue + 50) % 360;
    return `linear-gradient(135deg, oklch(0.72 0.16 ${hue}) 0%, oklch(0.55 0.18 ${hue2}) 100%)`;
  }

  getCoverMonogram(): string {
    return this.activeSong?.title?.[0]?.toUpperCase() || '♪';
  }

  displaySongTitle(songName: string): string {
    if (!songName) return '';
    return songName.length > 45 ? songName.substring(0, 45) + '...' : songName;
  }

  // ─── Playback ────────────────────────────────────────────────

  togglePlayPause(): void {
    if (this.isPlaying) {
      this.player.nativeElement.pause();
    } else {
      this.playSong(this.activeSong);
    }
  }

  playSong(song: Song): void {
    if (!song) return;

    if (!this.isPlaying && this.player.nativeElement.currentTime > 0 && this.activeSong?.path === song.path) {
      this.player.nativeElement.play();
      this.isPlaying = true;
      return;
    }

    this.resetSong(song);
    this.player.nativeElement.play();
    this.isPlaying = true;
  }

  playSongFromPlaylist(songPath: string): void {
    const song = this.songs.find(s => s.path === songPath);
    if (song) this.playSong(song);
  }

  deleteSongFromPlaylist(songPath: string): void {
    const songIndex = this.songs.findIndex(s => s.path === songPath);
    if (songIndex === -1) return;

    const wasActive = this.activeSong?.path === songPath;
    this.songs.splice(songIndex, 1);
    this.electronService.saveMediaList(this.songs);

    if (wasActive) {
      if (this.songs.length > 0) {
        const nextIdx = Math.min(songIndex, this.songs.length - 1);
        this.resetSong(this.songs[nextIdx]);
        this.setSongDuration();
      } else {
        this.activeSong = null;
        this.durationTime = undefined;
        this.currentProgress$.next(0);
      }
    }
  }

  onTimeUpdate() {
    if (!this.durationTime) this.setSongDuration();

    const mins = this.generateMinutes(this.player.nativeElement.currentTime);
    const secs = this.generateSeconds(this.player.nativeElement.currentTime);
    this.currentTime$.next(this.generateTimeToDisplay(mins, secs));

    const pct = this.generatePercentage(this.player.nativeElement.currentTime, this.player.nativeElement.duration);
    if (!isNaN(pct)) this.currentProgress$.next(pct);
  }

  onPause(): void {
    this.isPlaying = false;
  }

  onEnded() {
    if (this.isShuffleModeOn) {
      this.playRandomSong();
    } else {
      this.playNextSong();
    }
  }

  playNextSong(): void {
    if (this.songs.length < 2) return;
    const idx = this.songs.findIndex(s => s.path === this.activeSong?.path);
    if (idx === -1) return;

    if (this.isShuffleModeOn) { this.playRandomSong(); return; }

    const nextIdx = idx + 1;
    if (nextIdx === this.songs.length && this.isRepeatModeOn) {
      this.playSong(this.songs[0]);
    } else if (nextIdx < this.songs.length) {
      this.playSong(this.songs[nextIdx]);
    }
  }

  playPreviousSong(): void {
    if (this.songs.length < 2) return;
    const idx = this.songs.findIndex(s => s.path === this.activeSong?.path);
    if (idx === -1) return;
    if (idx - 1 >= 0) this.playSong(this.songs[idx - 1]);
  }

  seekToTime(event: MouseEvent) {
    const offsetWidth = this.progressArea.nativeElement.clientWidth;
    const pct = this.generatePercentage(event.offsetX, offsetWidth);
    if (!isNaN(pct)) {
      this.player.nativeElement.currentTime = pct * this.player.nativeElement.duration / 100;
    }
  }

  // ─── Controls ────────────────────────────────────────────────

  toggleShuffleMode() { this.isShuffleModeOn = !this.isShuffleModeOn; }

  setRepeatMode() { this.isRepeatModeOn = !this.isRepeatModeOn; }

  toggleMute() {
    this.isMuted = !this.isMuted;
    this.player.nativeElement.muted = this.isMuted;
  }

  setVolume(event: Event) {
    this.volume = +(event.target as HTMLInputElement).value;
    this.player.nativeElement.volume = this.volume;
    if (this.volume > 0 && this.isMuted) {
      this.isMuted = false;
      this.player.nativeElement.muted = false;
    }
  }

  // ─── Drag reorder ────────────────────────────────────────────

  onDragStart(event: DragEvent, index: number) {
    this.dragFromIndex = index;
    event.dataTransfer.effectAllowed = 'move';
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }

  onDrop(event: DragEvent, toIndex: number) {
    event.preventDefault();
    if (this.dragFromIndex == null || this.dragFromIndex === toIndex) {
      this.dragFromIndex = null;
      return;
    }
    this.reorderTrack(this.dragFromIndex, toIndex);
    this.dragFromIndex = null;
    this.electronService.saveMediaList(this.songs);
  }

  reorderTrack(from: number, to: number) {
    const copy = this.songs.slice();
    const [moved] = copy.splice(from, 1);
    copy.splice(to, 0, moved);
    this.songs = copy;
  }

  // ─── Disabled state helpers ──────────────────────────────────

  isPrevControlDisabled(): boolean {
    return this.songs.length === 0 || this.songs[0] === this.activeSong;
  }

  isNextControlDisabled(): boolean {
    return this.songs.length === 0 ||
      (this.songs[this.songs.length - 1] === this.activeSong && !this.isShuffleModeOn && !this.isRepeatModeOn);
  }

  // ─── Electron ────────────────────────────────────────────────

  addMediaFiles() { this.electronService.openFileDialog(); }
  addMediaFolder() { this.electronService.openFolderDialog(); }
  closeProgram() { this.electronService.closeProgram(); }
  minimizeProgram() { this.electronService.minimizeProgram(); }

  // ─── Private ─────────────────────────────────────────────────

  private hashHue(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
    return h;
  }

  private resetSong(song: Song) {
    if (!song) return;
    this.durationTime = undefined;
    this.player.nativeElement.src = song.path;
    this.player.nativeElement.load();
    this.activeSong = song;
    this.isPlaying = false;
    this.currentProgress$.next(0);
  }

  private setSongDuration(): void {
    const dur = this.player.nativeElement.duration;
    if (!isNaN(dur)) {
      this.durationTime = this.generateTimeToDisplay(
        this.generateMinutes(dur),
        this.generateSeconds(dur)
      );
    }
  }

  private generateMinutes(t: number): number { return Math.floor(t / 60); }

  private generateSeconds(t: number): number | string {
    const s = Math.floor(t % 60);
    return s < 10 ? '0' + s : s;
  }

  private generateTimeToDisplay(m: number, s: number | string): string {
    return `${m}:${s}`;
  }

  private generatePercentage(current: number, total: number): number {
    return Math.round((current / total) * 100);
  }

  private extractFileNameFromPath(path: string): string {
    return path?.length ? path.split('\\').pop().split('/').pop() : '';
  }

  private playRandomSong() {
    if (this.songs.length <= 1) return;
    let idx = Math.floor(Math.random() * this.songs.length);
    while (this.songs[idx]?.path === this.activeSong?.path) {
      idx = Math.floor(Math.random() * this.songs.length);
    }
    this.playSong(this.songs[idx]);
  }

  private setInitialActiveSong() {
    if (this.songs.length > 0 && !this.activeSong) {
      this.resetSong(this.songs[0]);
    }
  }
}
