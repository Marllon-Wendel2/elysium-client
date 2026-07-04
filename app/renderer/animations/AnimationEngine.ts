import type { Animation } from './Animation';
import { Tween, type TweenConfig } from './Tween';
import { Sequence } from './Sequence';

class AnimationEngine {
  private animations: Animation[] = [];

  update(dt: number) {
    for (let i = this.animations.length - 1; i >= 0; i--) {
      this.animations[i].update(dt);
      if (this.animations[i].finished) {
        this.animations.splice(i, 1);
      }
    }
  }

  add(animation: Animation): Animation {
    this.animations.push(animation);
    return animation;
  }

  tween(config: TweenConfig): Tween {
    const tw = new Tween(config);
    this.animations.push(tw);
    tw.play();
    return tw;
  }

  sequence(items: Animation[], onComplete?: () => void): Sequence {
    const seq = new Sequence(items, onComplete);
    this.animations.push(seq);
    seq.play();
    return seq;
  }

  killByTarget(target: object) {
    this.animations = this.animations.filter((a) => {
      if (a instanceof Tween && a.target === target) {
        a.stop();
        return false;
      }
      return true;
    });
  }

  killAll() {
    for (const a of this.animations) a.stop();
    this.animations = [];
  }

  get count(): number {
    return this.animations.length;
  }
}

export const animations = new AnimationEngine();