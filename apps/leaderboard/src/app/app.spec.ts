import { TestBed } from '@angular/core/testing';
import { App } from './app';

const data = {
  event: '2026',
  owner_id: 99,
  day1_ts: 1_796_101_200,
  num_days: 12,
  members: {
    1: {
      id: 1,
      name: 'Ada',
      stars: 0,
      local_score: 5,
      last_star_ts: 0,
      completion_day_level: {},
    },
    2: {
      id: 2,
      name: 'Linus',
      stars: 0,
      local_score: 0,
      last_star_ts: 0,
      completion_day_level: {},
    },
  },
};

describe('App', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(data))),
    );
  });

  afterEach(() => vi.unstubAllGlobals());

  it('lists members with points and counts the rest', async () => {
    const fixture = TestBed.createComponent(App);
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.event')).toBeTruthy();
    });
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.event')?.textContent).toContain('2026');
    expect(el.querySelectorAll('.board ol > li')).toHaveLength(1);
    expect(el.querySelector('.board .more')?.textContent).toContain(
      '+ 1 without points',
    );
    fixture.destroy();
  });
});
