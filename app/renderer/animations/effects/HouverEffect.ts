import type { Animation } from '../Animation';
import { animations } from '../AnimationEngine';
import { Easing } from '../Easing';

interface HoverEffectConfig {
  target: any;
  baseY: number;
  hoverScale?: number;
  hoverLift?: number;
  duration?: number;
}

export class HoverEffect implements Animation {
  finished = false;
  private kills: (() => void)[] = [];
  private config: HoverEffectConfig;
  private originalBaseY: number;

  constructor(config: HoverEffectConfig) {
    this.config = {
      hoverScale: 1.15,
      hoverLift: -20,
      duration: 12,
      ...config,
    };
    this.originalBaseY = config.baseY;
  }

  private animate(hovered: boolean) {
    this.kill();
    const { target, hoverScale, hoverLift, duration } = this.config;
    const ease = Easing.easeOutCubic;

    const targetY = hovered ? this.originalBaseY + hoverLift! : this.originalBaseY;

    const tw1 = animations.tween({ target: target.scale, prop: 'x', to: hovered ? hoverScale! : 1, duration: duration!, easing: ease });
    const tw2 = animations.tween({ target: target.scale, prop: 'y', to: hovered ? hoverScale! : 1, duration: duration!, easing: ease });
    const tw3 = animations.tween({ target: target, prop: 'y', to: targetY, duration: duration!, easing: ease });
    const tw4 = animations.tween({ target: target, prop: 'rotation', to: 0, duration: duration!, easing: ease });

    this.kills = [() => tw1.stop(), () => tw2.stop(), () => tw3.stop(), () => tw4.stop()];
  }

  enter() { this.animate(true); }
  leave() { this.animate(false); }

  kill() {
    this.kills.forEach((k) => k());
    this.kills = [];
  }

  update(_dt: number) {
    this.finished = false;
  }

  pause() { this.kill(); }
  resume() {}
  stop() { this.kill(); }
}