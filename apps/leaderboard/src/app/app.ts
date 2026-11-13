import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import {
  AocLeaderboard,
  finishers,
  formatDuration,
  rankMembers,
  recentStars,
  unlockedDays,
  unlockTs,
  withoutOwner,
} from './leaderboard';

/** Design size of the screen; everything is laid out at 4K and scaled to fit. */
const STAGE = { width: 3840, height: 2160 };
const REFRESH_MS = 60_000;
/** Board lines in view at once; any more scroll past within the minute on screen. */
const VISIBLE_LINES = 25;
/** The host refreshes the file every 15 minutes; older than this means it stopped. */
const STALE_AFTER_S = 45 * 60;

const time = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Amsterdam',
});
const date = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Amsterdam',
});

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:resize)': 'fit()',
    '[style.--scale]': 'scale()',
  },
})
export class App {
  /** JSON source; defaults to the leaderboard server's cache, override with `?src=`. */
  private readonly src =
    new URLSearchParams(location.search).get('src') ?? 'api/leaderboard.json';

  protected readonly data = signal<AocLeaderboard | undefined>(undefined);
  protected readonly updatedAt = signal<Date | undefined>(undefined);
  protected readonly error = signal(false);
  protected readonly now = signal(Date.now() / 1000);
  protected readonly scale = signal(1);
  protected readonly logoMissing = signal(false);

  protected readonly rows = computed(() => {
    const lb = this.data();
    return lb ? rankMembers(lb) : [];
  });
  /** Only members with points are listed; the rest are counted on one line. */
  protected readonly board = computed(() => {
    const shown = this.rows().filter((r) => r.score > 0);
    const withoutPoints = this.rows().length - shown.length;
    const lines = shown.length + (withoutPoints ? 1 : 0);
    return {
      shown,
      withoutPoints,
      visible: Math.min(lines, VISIBLE_LINES),
      overflow: Math.max(0, lines - VISIBLE_LINES),
    };
  });
  protected readonly unlocked = computed(() => {
    const lb = this.data();
    return lb ? unlockedDays(lb, this.now()) : 0;
  });
  protected readonly days = computed(() =>
    Array.from({ length: this.data()?.num_days ?? 0 }, (_, i) => i + 1),
  );
  protected readonly countdown = computed(() => {
    const lb = this.data();
    if (!lb || this.unlocked() >= lb.num_days) return undefined;
    const day = this.unlocked() + 1;
    return {
      day,
      at: date.format(unlockTs(lb, day) * 1000),
      left: formatDuration(unlockTs(lb, day) - this.now()),
    };
  });
  protected readonly podium = computed(() => {
    const lb = this.data();
    const day = this.unlocked();
    if (!lb || !day) return undefined;
    return {
      day,
      finishers: finishers(lb, day)
        .slice(0, 5)
        .map((f) => ({ ...f, time: formatDuration(f.duration) })),
    };
  });
  protected readonly latest = computed(() => {
    const lb = this.data();
    return (lb ? recentStars(lb, 7) : []).map((s) => ({
      ...s,
      time: time.format(s.ts * 1000),
    }));
  });
  protected readonly totalStars = computed(() =>
    this.rows().reduce((sum, r) => sum + r.stars, 0),
  );
  protected readonly updated = computed(() => {
    const at = this.updatedAt();
    return at ? time.format(at) : '';
  });
  protected readonly stale = computed(() => {
    const at = this.updatedAt();
    return !!at && this.now() - at.getTime() / 1000 > STALE_AFTER_S;
  });

  constructor() {
    this.fit();
    this.load();
    const tick = setInterval(() => this.now.set(Date.now() / 1000), 1000);
    const refresh = setInterval(() => this.load(), REFRESH_MS);
    inject(DestroyRef).onDestroy(() => {
      clearInterval(tick);
      clearInterval(refresh);
    });
  }

  protected fit() {
    this.scale.set(
      Math.min(
        window.innerWidth / STAGE.width,
        window.innerHeight / STAGE.height,
      ),
    );
  }

  private async load() {
    try {
      const res = await fetch(this.src, { cache: 'no-store' });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      this.data.set(withoutOwner(await res.json()));
      // When the file itself was last written, so a dead refresh job shows up as stale.
      const modified = res.headers.get('Last-Modified');
      this.updatedAt.set(modified ? new Date(modified) : new Date());
      this.error.set(false);
    } catch (e) {
      console.error('Failed to load leaderboard', e);
      this.error.set(true);
    }
  }
}
