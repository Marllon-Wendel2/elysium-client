import type { Animation } from './Animation';

export class Sequence implements Animation {
  finished = false;
  private items: Animation[] = [];
  private currentIndex = 0;
  private playing = false;
  private onComplete?: () => void;

  constructor(items: Animation[] = [], onComplete?: () => void) {
    this.items = items;
    this.onComplete = onComplete;
  }

  add(item: Animation): this {
    this.items.push(item);
    return this;
  }

  update(dt: number) {
    if (this.finished || !this.playing) return;
    if (this.currentIndex >= this.items.length) {
      this.finished = true;
      this.onComplete?.();
      return;
    }

    const current = this.items[this.currentIndex];
    current.update(dt);

    if (current.finished) {
      this.currentIndex++;
      if (this.currentIndex >= this.items.length) {
        this.finished = true;
        this.onComplete?.();
      }
    }
  }

  pause() {
    this.playing = false;
    const current = this.items[this.currentIndex];
    if (current && 'pause' in current) {
      (current as any).pause();
    }
    return this;
  }

  resume() {
    if (!this.finished) this.playing = true;
    const current = this.items[this.currentIndex];
    if (current && 'resume' in current) {
      (current as any).resume();
    }
    return this;
  }

  stop() {
    this.finished = true;
    this.playing = false;
    const current = this.items[this.currentIndex];
    if (current && 'stop' in current) {
      (current as any).stop();
    }
  }

  play() {
    this.currentIndex = 0;
    this.finished = false;
    this.playing = true;
    for (const item of this.items) {
      if ('stop' in item) (item as any).stop();
    }
    return this;
  }
}