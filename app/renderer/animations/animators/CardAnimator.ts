import type { CardSprite } from '../../../components/Pixi/Sprites/CardSprite';
import { animations } from '../AnimationEngine';
import { Easing } from '../Easing';
import { HoverEffect } from '../effects/HouverEffect'

export class CardAnimator {
  private sprite: CardSprite;
  private hoverEffect: HoverEffect;

  constructor(sprite: CardSprite, baseY: number) {
    this.sprite = sprite;
    this.hoverEffect = new HoverEffect({
      target: sprite,
      baseY,
    });
  }

  hoverEnter() {
    try {
      this.hoverEffect.enter();
    } catch (e) {
      console.warn('Hover animation failed:', e);
    }
  }

  hoverLeave() {
    try {
      this.hoverEffect.leave();
    } catch (e) {
      console.warn('Hover animation failed:', e);
    }
  }

  dragStart() {
    this.hoverEffect.kill();
    animations.tween({ target: this.sprite.scale, prop: 'x', to: 1, duration: 6, easing: Easing.easeOutCubic });
    animations.tween({ target: this.sprite.scale, prop: 'y', to: 1, duration: 6, easing: Easing.easeOutCubic });
    this.sprite.alpha = 0.9;
    this.sprite.zIndex = 1000;
    animations.tween({ target: this.sprite, prop: 'rotation', to: 0, duration: 6, easing: Easing.easeOutCubic });
  }

  dragEnd() {
    this.sprite.alpha = 1;
    this.sprite.zIndex = 0;
  }

  destroy() {
    this.hoverEffect.kill();
    animations.killByTarget(this.sprite);
  }
}