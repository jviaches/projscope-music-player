import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { ElectronService, RssEpisode } from '../core/services';
import { Song } from '../models/song.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {

  @ViewChild('player', { static: true }) player: ElementRef<HTMLAudioElement>;
  @ViewChild('progressArea', { static: true }) progressArea: ElementRef<HTMLDivElement>;

  currentProgress$ = new BehaviorSubject(0);
  currentTime$ = new Subject<string>();
  songs: Song[] = [];

  isPlaying = false;
  activeSong: Song;
  isMuted = false;
  volume = 0.7;
  showVolumeSlider = false;

  durationTime: string;

  isShuffleModeOn = false;
  isRepeatModeOn = false;
  isPlaylistVisible = true;

  showUrlOverlay = false;
  urlInput = '';
  urlInputError = '';
  urlIsValidating = false;
  rssFeedTitle = '';
  rssEpisodes: RssEpisode[] = [];
  showRssChooser = false;
  isLiveStream = false;

  vinylGrooves = [0, 1, 2, 3, 4, 5];
  dragFromIndex: number | null = null;

  private destroy$ = new Subject<void>();

  constructor(public electronService: ElectronService) {}

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    if (this.showUrlOverlay) {
      this.closeUrlOverlay();
    } else {
      this.showVolumeSlider = false;
    }
  }

  ngOnInit() {
    this.electronService.windowsResize(660);

    this.electronService.playerState.pipe(takeUntil(this.destroy$)).subscribe(state => {
      this.volume = state.volume ?? 0.7;
      this.isShuffleModeOn = state.isShuffleModeOn ?? false;
      this.isRepeatModeOn = state.isRepeatModeOn ?? false;
      this.player.nativeElement.volume = this.volume;
    });

    this.electronService.mediaSources.pipe(takeUntil(this.destroy$)).subscribe(receivedMedia => {
      if (!receivedMedia) { return; }

      const isSong = typeof receivedMedia !== 'string';
      const existingSongIndex = isSong
        ? this.songs.findIndex(s => s.path === (receivedMedia as Song).path)
        : this.songs.findIndex(s => s.path === receivedMedia);

      if (existingSongIndex === -1) {
        if (isSong) {
          this.songs.push(receivedMedia as Song);
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
      if (statusChange) { this.electronService.saveMediaList(this.songs); }
    });
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
    if (!songName) { return ''; }
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
    if (!song) { return; }

    const el = this.player.nativeElement;
    if (!this.isPlaying && el.currentTime > 0 && !isNaN(el.duration) && this.activeSong?.path === song.path) {
      el.play();
      this.isPlaying = true;
      return;
    }

    this.resetSong(song);
    el.play();
    this.isPlaying = true;
  }

  playSongFromPlaylist(songPath: string): void {
    const song = this.songs.find(s => s.path === songPath);
    if (song) { this.playSong(song); }
  }

  deleteSongFromPlaylist(songPath: string): void {
    const songIndex = this.songs.findIndex(s => s.path === songPath);
    if (songIndex === -1) { return; }

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
    const el = this.player.nativeElement;
    if (!this.durationTime) { this.setSongDuration(); }

    const mins = this.generateMinutes(el.currentTime);
    const secs = this.generateSeconds(el.currentTime);
    this.currentTime$.next(this.generateTimeToDisplay(mins, secs));

    const pct = this.generatePercentage(el.currentTime, el.duration);
    if (!isNaN(pct) && isFinite(pct)) { this.currentProgress$.next(pct); }
  }

  onLoadedMetadata(): void {
    this.setSongDuration();
  }

  onPause(): void {
    this.isPlaying = false;
  }

  onEnded(): void {
    if (this.isShuffleModeOn) {
      this.playRandomSong();
    } else if (this.isRepeatModeOn) {
      this.playSong(this.songs[0]);
    } else {
      this.playNextSong();
    }
  }

  playNextSong(): void {
    if (this.songs.length < 2) { return; }
    const idx = this.songs.findIndex(s => s.path === this.activeSong?.path);
    if (idx === -1) { return; }

    const nextIdx = idx + 1;
    if (nextIdx < this.songs.length) {
      this.playSong(this.songs[nextIdx]);
    }
  }

  playPreviousSong(): void {
    if (this.songs.length < 2) { return; }
    const idx = this.songs.findIndex(s => s.path === this.activeSong?.path);
    if (idx === -1 || idx === 0) { return; }
    this.playSong(this.songs[idx - 1]);
  }

  seekToTime(event: MouseEvent) {
    if (this.isLiveStream) { return; }
    const offsetWidth = this.progressArea.nativeElement.clientWidth;
    const el = this.player.nativeElement;
    if (!isNaN(el.duration) && offsetWidth > 0) {
      const pct = Math.max(0, Math.min(1, event.offsetX / offsetWidth));
      el.currentTime = pct * el.duration;
    }
  }

  // ─── Controls ────────────────────────────────────────────────

  toggleShuffleMode() {
    this.isShuffleModeOn = !this.isShuffleModeOn;
    this.persistPlayerState();
  }

  setRepeatMode() {
    this.isRepeatModeOn = !this.isRepeatModeOn;
    this.persistPlayerState();
  }

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
    this.persistPlayerState();
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

  togglePlaylist() { this.isPlaylistVisible = !this.isPlaylistVisible; }
  addMediaFiles() { this.electronService.openFileDialog(); }
  addMediaFolder() { this.electronService.openFolderDialog(); }
  addStreamUrl() { this.openUrlOverlay(); }
  closeProgram() { this.electronService.closeProgram(); }
  minimizeProgram() { this.electronService.minimizeProgram(); }

  // ─── URL / Stream overlay ────────────────────────────────────

  openUrlOverlay() {
    this.urlInput = '';
    this.urlInputError = '';
    this.urlIsValidating = false;
    this.rssFeedTitle = '';
    this.rssEpisodes = [];
    this.showRssChooser = false;
    this.showUrlOverlay = true;
  }

  closeUrlOverlay() {
    this.showUrlOverlay = false;
    this.showRssChooser = false;
  }

  submitUrl() {
    const url = this.urlInput.trim();
    if (!this.isValidHttpUrl(url)) {
      this.urlInputError = 'Please enter a valid http:// or https:// URL.';
      return;
    }
    this.urlInputError = '';
    if (this.looksLikeRssFeed(url)) {
      this.handleRssFeedUrl(url);
    } else {
      this.handleDirectStreamUrl(url);
    }
  }

  handleDirectStreamUrl(url: string) {
    if (this.songs.some(s => s.path === url)) {
      this.urlInputError = 'This URL is already in your playlist.';
      return;
    }
    const song: Song = { title: this.deriveTitleFromUrl(url), path: url, type: 'stream' };
    this.songs.push(song);
    this.electronService.saveMediaList(this.songs);
    this.setInitialActiveSong();
    this.closeUrlOverlay();
  }

  handleRssFeedUrl(url: string) {
    this.urlIsValidating = true;
    this.electronService.rssFeedResult.pipe(take(1), takeUntil(this.destroy$)).subscribe(result => {
      this.urlIsValidating = false;
      if (result.error) {
        this.urlInputError = `Could not load feed: ${result.error}`;
        return;
      }
      if (result.episodes.length === 0) {
        this.urlInputError = 'No audio episodes found in this feed.';
        return;
      }
      this.rssFeedTitle = result.feedTitle;
      this.rssEpisodes = result.episodes;
      this.showRssChooser = true;
    });
    this.electronService.fetchRssFeed(url);
  }

  addRssEpisode(ep: RssEpisode) {
    if (this.songs.some(s => s.path === ep.url)) { return; }
    const song: Song = { title: ep.title, path: ep.url, type: 'stream' };
    this.songs.push(song);
    this.electronService.saveMediaList(this.songs);
    this.setInitialActiveSong();
  }

  addAllRssEpisodes() {
    let added = false;
    for (const ep of this.rssEpisodes) {
      if (!this.songs.some(s => s.path === ep.url)) {
        this.songs.push({ title: ep.title, path: ep.url, type: 'stream' });
        added = true;
      }
    }
    if (added) {
      this.electronService.saveMediaList(this.songs);
      this.setInitialActiveSong();
    }
    this.closeUrlOverlay();
  }

  isSongInPlaylist(url: string): boolean {
    return this.songs.some(s => s.path === url);
  }

  private isValidHttpUrl(v: string): boolean {
    return /^https?:\/\/.{3,}/.test(v);
  }

  private looksLikeRssFeed(v: string): boolean {
    return /\.(rss|xml|atom)(\?|$)/i.test(v) || /[/?&]feed([/?&=]|$)/i.test(v);
  }

  private deriveTitleFromUrl(url: string): string {
    try {
      const u = new URL(url);
      const segments = u.pathname.split('/').filter(Boolean);
      const last = segments[segments.length - 1] || u.hostname;
      return decodeURIComponent(last.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '));
    } catch {
      return url;
    }
  }

  // ─── Private ─────────────────────────────────────────────────

  private hashHue(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) % 360; }
    return h;
  }

  private resetSong(song: Song) {
    if (!song) { return; }
    this.isLiveStream = false;
    this.durationTime = undefined;
    this.player.nativeElement.src = song.path;
    this.player.nativeElement.load();
    this.activeSong = song;
    this.isPlaying = false;
    this.currentProgress$.next(0);
    this.currentTime$.next('0:00');
  }

  private setSongDuration(): void {
    const dur = this.player.nativeElement.duration;
    if (!isFinite(dur)) {
      this.isLiveStream = true;
      this.durationTime = undefined;
      return;
    }
    if (!isNaN(dur)) {
      this.durationTime = this.generateTimeToDisplay(
        this.generateMinutes(dur),
        this.generateSeconds(dur)
      );
    }
  }

  private generateMinutes(t: number): number { return Math.floor(t / 60); }

  private generateSeconds(t: number): string {
    const s = Math.floor(t % 60);
    return s < 10 ? '0' + s : String(s);
  }

  private generateTimeToDisplay(m: number, s: string): string {
    return `${m}:${s}`;
  }

  private generatePercentage(current: number, total: number): number {
    return Math.round((current / total) * 100);
  }

  private extractFileNameFromPath(filePath: string): string {
    return filePath?.length ? filePath.split('\\').pop().split('/').pop() : '';
  }

  private playRandomSong() {
    if (this.songs.length <= 1) { return; }
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

  private persistPlayerState() {
    this.electronService.savePlayerState({
      volume: this.volume,
      isShuffleModeOn: this.isShuffleModeOn,
      isRepeatModeOn: this.isRepeatModeOn,
    });
  }
}
