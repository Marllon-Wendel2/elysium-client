import type { EasingFunction } from './Easing';
import { Easing } from './Easing';
import type { Animation } from './Animation';

export interface TweenConfig {
  target: any;
  prop: string;
  to: number;
  from?: number;
  duration: number;
  easing?: EasingFunction;
  delay?: number;
  onComplete?: () => void;
  yoyo?: boolean;
  repeat?: number;
}

export class Tween implements Animation {
  target: any;
  prop: string;
  to: number;
  from: number;
  duration: number;
  easing: EasingFunction;
  delay: number;
  onComplete?: () => void;
  yoyo: boolean;
  repeat: number;

  finished = false;
  private elapsed = 0;
  private delayRemaining = 0;
  private playing = false;
  private reversed = false;
  private repeatCount = 0;

  private resolvedParent: any;
  private resolvedKey: string;

  constructor(config: TweenConfig) {
    this.target = config.target;
    this.prop = config.prop;
    this.to = config.to;
    this.duration = config.duration || 1;
    this.easing = config.easing ?? Easing.linear;
    this.delay = config.delay ?? 0;
    this.onComplete = config.onComplete;
    this.yoyo = config.yoyo ?? false;
    this.repeat = config.repeat ?? 0;

    const resolved = this.resolveProp(this.prop);
    this.resolvedParent = resolved.parent;
    this.resolvedKey = resolved.key;

    this.from = config.from ?? this.readProp();
  }

  private resolveProp(prop: string) {
    const parts = prop.split('.');
    let parent = this.target;
    for (let i = 0; i < parts.length - 1; i++) {
      parent = parent[parts[i]];
    }
    return { parent, key: parts[parts.length - 1] };
  }

  private readProp(): number {
    return this.resolvedParent[this.resolvedKey] as number;
  }

  private writeProp(value: number) {
    this.resolvedParent[this.resolvedKey] = value;
  }

  update(dt: number) {
    if (this.finished || !this.playing) return;

    if (this.delayRemaining > 0) {
      this.delayRemaining -= dt;
      return;
    }

    this.elapsed += dt;
    let rawT = Math.min(this.elapsed / this.duration, 1);

    if (this.reversed) rawT = 1 - rawT;

    const easedT = this.easing(rawT);
    const value = this.from + (this.to - this.from) * easedT;
    this.writeProp(value);

    if (this.elapsed >= this.duration) {
      if (this.yoyo) {
        this.reversed = !this.reversed;
        this.elapsed = 0;
        const temp = this.from;
        this.from = this.to;
        this.to = temp;
      } else if (this.repeat === -1 || this.repeatCount < this.repeat) {
        this.repeatCount++;
        this.elapsed = 0;
      } else {
        this.finished = true;
        this.onComplete?.();
      }
    }
  }

  pause() {
    this.playing = false;
    return this;
  }

  resume() {
    if (!this.finished) this.playing = true;
    return this;
  }

  stop() {
    this.finished = true;
    this.playing = false;
  }

  play() {
    if (this.finished) return this;
    if (this.delay > 0 && this.delayRemaining === 0) {
      this.delayRemaining = this.delay;
    }
    this.playing = true;
    return this;
  }
}