# Plano 1: AnimationEngine - Passo a Passo Detalhado

## Visão Geral

Criar o sistema de animação de baixo nível. Cada arquivo deve ser criado na ordem listed pois dependem uns dos outros.

---

## Passo 1: Criar `Animation.ts`

**Caminho:** `app/renderer/animations/Animation.ts`

```ts
export interface Animation {
  finished: boolean;
  update(dt: number): void;
  pause(): void;
  resume(): void;
  stop(): void;
}
```

---

## Passo 2: Criar `Easing.ts`

**Caminho:** `app/renderer/animations/Easing.ts`

```ts
export type EasingFunction = (t: number) => number;

export const Easing = {
  linear: ((t: number) => t) as EasingFunction,

  easeInQuad: ((t: number) => t * t) as EasingFunction,

  easeOutQuad: ((t: number) => t * (2 - t)) as EasingFunction,

  easeInOutQuad: ((t: number) =>
    t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t) as EasingFunction,

  easeInCubic: ((t: number) => t * t * t) as EasingFunction,

  easeOutCubic: ((t: number) => {
    const t1 = t - 1;
    return t1 * t1 * t1 + 1;
  }) as EasingFunction,

  easeInOutCubic: ((t: number) =>
    t < 0.5
      ? 4 * t * t * t
      : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1) as EasingFunction,

  easeOutBack: ((t: number) => {
    const c = 1.70158;
    const t1 = t - 1;
    return 1 + (c + 1) * t1 * t1 * t1 + c * t1 * t1;
  }) as EasingFunction,

  easeOutElastic: ((t: number) => {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin(((t - 0.1) * 5 * Math.PI) / 0.3) + 1;
  }) as EasingFunction,
};
```

---

## Passo 3: Criar `Tween.ts`

**Caminho:** `app/renderer/animations/Tween.ts`

```ts
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
```

---

## Passo 4: Criar `Sequence.ts`

**Caminho:** `app/renderer/animations/Sequence.ts`

```ts
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
```

---

## Passo 5: Criar `AnimationEngine.ts`

**Caminho:** `app/renderer/animations/AnimationEngine.ts`

```ts
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
```

---

## Passo 6: Criar `HoverEffect.ts`

**Caminho:** `app/renderer/animations/effects/HoverEffect.ts`

```ts
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

  constructor(config: HoverEffectConfig) {
    this.config = {
      hoverScale: 1.15,
      hoverLift: -20,
      duration: 200,
      ...config,
    };
  }

  private animate(hovered: boolean) {
    this.kill();
    const { target, hoverScale, hoverLift, duration } = this.config;
    const baseY = target.y; // captura posição atual
    const ease = Easing.easeOutCubic;

    const tw1 = animations.tween({ target: target.scale, prop: 'x', to: hovered ? hoverScale! : 1, duration: duration!, easing: ease });
    const tw2 = animations.tween({ target: target.scale, prop: 'y', to: hovered ? hoverScale! : 1, duration: duration!, easing: ease });
    const tw3 = animations.tween({ target: target, prop: 'y', to: hovered ? baseY + hoverLift! : baseY, duration: duration!, easing: ease });
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
```

---

## Passo 7: Criar `CardAnimator.ts`

**Caminho:** `app/renderer/animations/animators/CardAnimator.ts`

```ts
import type { CardSprite } from '../../../components/Pixi/Sprites/CardSprite';
import { animations } from '../AnimationEngine';
import { Easing } from '../Easing';
import { HoverEffect } from '../effects/HoverEffect';

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
    animations.tween({ target: this.sprite.scale, prop: 'x', to: 1, duration: 100, easing: Easing.easeOutCubic });
    animations.tween({ target: this.sprite.scale, prop: 'y', to: 1, duration: 100, easing: Easing.easeOutCubic });
    this.sprite.alpha = 0.9;
    this.sprite.zIndex = 1000;
    animations.tween({ target: this.sprite, prop: 'rotation', to: 0, duration: 100, easing: Easing.easeOutCubic });
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
```

---

## Passo 8: Editar `PixiRender.ts`

**Caminho:** `app/components/Pixi/PixiRender.ts`

### 8.1 Adicionar import (linha 1)

```ts
import { animations } from '../../renderer/animations/AnimationEngine';
```

### 8.2 Editar método `tick` (linhas 137-142)

**Antes:**
```ts
private tick = (ticker: PIXI.Ticker) => {
  const dt = ticker.deltaTime;
  this.handManager.tick(dt);
  this.inputHandler.updateHighlight();
  this.pendingScroll.tick(dt);
};
```

**Depois:**
```ts
private tick = (ticker: PIXI.Ticker) => {
  const dt = ticker.deltaTime;
  animations.update(dt);
  this.handManager.tick(dt);
  this.inputHandler.updateHighlight();
  this.pendingScroll.tick(dt);
};
```

---

## Passo 9: Editar `CardSprite.ts`

**Caminho:** `app/components/Pixi/Sprites/CardSprite.ts`

### 9.1 Adicionar import (linha 3)

```ts
import { CardAnimator } from '../../../renderer/animations/animators/CardAnimator';
```

### 9.2 Adicionar propriedade (após linha 36)

```ts
private animator: CardAnimator | null = null;
```

### 9.3 Editar método `setDragging` (linhas 78-88)

**Antes:**
```ts
setDragging(value: boolean) {
  this._dragging = value;
  if (value) {
    this.isHovered = false;
    this.clearGlow();
    this.targetScaleX = 1;
    this.targetScaleY = 1;
    this._animating = true;
    getSharedTooltip().hide();
  }
}
```

**Depois:**
```ts
setDragging(value: boolean) {
  this._dragging = value;
  if (value) {
    this.isHovered = false;
    this.clearGlow();
    this.animator?.dragStart();
    getSharedTooltip().hide();
  }
}
```

### 9.4 Editar método `onHoverIn` (linhas 90-101)

**Antes:**
```ts
private onHoverIn = () => {
  if (this._dragging) return;
  this.isHovered = true;
  this.baseY = this.y;
  this.baseRotation = this.rotation;
  this.drawGlow();
  this.computeTarget();

  const tooltip = getSharedTooltip();
  const globalPos = this.getGlobalPosition();
  tooltip.show(this.card, globalPos.x + this.cardWidth / 2, globalPos.y);
};
```

**Depois:**
```ts
private onHoverIn = () => {
  if (this._dragging) return;
  this.isHovered = true;
  this.baseY = this.y;
  this.baseRotation = this.rotation;
  this.drawGlow();
  this.animator?.hoverEnter();

  const tooltip = getSharedTooltip();
  const globalPos = this.getGlobalPosition();
  tooltip.show(this.card, globalPos.x + this.cardWidth / 2, globalPos.y);
};
```

### 9.5 Editar método `onHoverOut` (linhas 103-110)

**Antes:**
```ts
private onHoverOut = () => {
  if (this._dragging) return;
  this.isHovered = false;
  this.clearGlow();
  this.computeTarget();

  getSharedTooltip().hide();
};
```

**Depois:**
```ts
private onHoverOut = () => {
  if (this._dragging) return;
  this.isHovered = false;
  this.clearGlow();
  this.animator?.hoverLeave();

  getSharedTooltip().hide();
};
```

### 9.6 Remover método `computeTarget` (linhas 139-145)

**DELETAR ESTE MÉTODO INTEIRO:**
```ts
private computeTarget() {
  this.targetScaleX = this.isHovered ? HOVER_SCALE : 1;
  this.targetScaleY = this.isHovered ? HOVER_SCALE : 1;
  this.targetY = this.isHovered ? this.baseY + HOVER_LIFT : this.baseY;
  this.targetRotation = this.isHovered ? 0 : this.baseRotation;
  this._animating = true;
}
```

### 9.7 Remover método `tick` (linhas 147-167)

**DELETAR ESTE MÉTODO INTEIRO:**
```ts
tick(dt: number) {
  if (!this._animating) return;

  const speed = 0.15 * dt;
  this.scale.x += (this.targetScaleX - this.scale.x) * speed;
  this.scale.y += (this.targetScaleY - this.scale.y) * speed;
  this.y += (this.targetY - this.y) * speed;
  this.rotation += (this.targetRotation - this.rotation) * speed;

  const scaleDone = Math.abs(this.scale.x - this.targetScaleX) < 0.005;
  const yDone = Math.abs(this.y - this.targetY) < 0.5;
  const rotationDone = Math.abs(this.rotation - this.targetRotation) < 0.001;

  if (scaleDone && yDone && rotationDone) {
    this.scale.x = this.targetScaleX;
    this.scale.y = this.targetScaleY;
    this.y = this.targetY;
    this.rotation = this.targetRotation;
    this._animating = false;
  }
}
```

### 9.8 Editar método `setBaseY` (linhas 169-171)

**Antes:**
```ts
setBaseY(y: number) {
  this.baseY = y;
}
```

**Depois:**
```ts
setBaseY(y: number) {
  this.baseY = y;
  if (!this.animator) {
    this.animator = new CardAnimator(this, y);
  }
}
```

### 9.9 Editar método `startDrag` (linhas 177-183)

**Antes:**
```ts
startDrag() {
  this.setDragging(true);
  this.alpha = 0.9;
  this.zIndex = 1000;
  this.targetRotation = 0;
  this._animating = true;
}
```

**Depois:**
```ts
startDrag() {
  this.setDragging(true);
}
```

### 9.10 Editar método `endDrag` (linhas 185-189)

**Antes:**
```ts
endDrag() {
  this.alpha = 1;
  this.zIndex = 0;
  this._dragging = false;
}
```

**Depois:**
```ts
endDrag() {
  this.animator?.dragEnd();
  this._dragging = false;
}
```

### 9.11 Adicionar método `destroy` (após `endDrag`)

```ts
destroy() {
  this.animator?.destroy();
}
```

### 9.12 Remover propriedades não utilizadas (linhas 42-46)

**DELETAR ESTAS PROPRIEDADES:**
```ts
private _animating = false;
private targetScaleX = 1;
private targetScaleY = 1;
private targetY = 0;
private targetRotation = 0;
```

---

## Passo 10: Editar `HandManager.ts`

**Caminho:** `app/Managers/HandManager.ts`

### 10.1 Remover método `tick` (linhas 78-82)

**DELETAR ESTE MÉTODO INTEIRO:**
```ts
tick(dt: number) {
  for (const sprite of this.cardSprites) {
    sprite.tick(dt);
  }
}
```

### 10.2 Editar método `rebuild` (linhas 42-54)

**Antes:**
```ts
rebuild(hand: CardInstance[], screenWidth: number, screenHeight: number) {
  this.clear();
  this.screenWidth = screenWidth;
  this.screenHeight = screenHeight;

  hand.forEach((card) => {
    const sprite = new CardSprite(card, BASE_CARD_WIDTH, BASE_CARD_HEIGHT);
    this.cardSprites.push(sprite);
    this.container.addChild(sprite);
  });

  this.positionCards();
}
```

**Depois:**
```ts
rebuild(hand: CardInstance[], screenWidth: number, screenHeight: number) {
  for (const sprite of this.cardSprites) {
    sprite.destroy();
  }
  this.clear();
  this.screenWidth = screenWidth;
  this.screenHeight = screenHeight;

  hand.forEach((card) => {
    const sprite = new CardSprite(card, BASE_CARD_WIDTH, BASE_CARD_HEIGHT);
    this.cardSprites.push(sprite);
    this.container.addChild(sprite);
  });

  this.positionCards();
}
```

---

## Passo 11: Deletar arquivo vazio

**Caminho:** `app/renderer/animations/effect/EffectAnimation.ts`

```bash
rm app/renderer/animations/effect/EffectAnimation.ts
```

---

## Resumo das Mudanças

| Arquivo | Ação | O que muda |
|---------|------|------------|
| `Animation.ts` | CRIAR | Interface comum |
| `Easing.ts` | CRIAR | Funções de easing |
| `Tween.ts` | CRIAR | Tween individual |
| `Sequence.ts` | CRIAR | Sequência de animações |
| `AnimationEngine.ts` | CRIAR | Pool central |
| `HoverEffect.ts` | CRIAR | Efeito de hover |
| `CardAnimator.ts` | CRIAR | Orquestra animações da carta |
| `PixiRender.ts` | EDITAR | Adicionar `animations.update(dt)` |
| `CardSprite.ts` | EDITAR | Usar CardAnimator, remover lerp |
| `HandManager.ts` | EDITAR | Remover `tick()` |
| `EffectAnimation.ts` | DELETAR | Vazio |

---

## Testes Manuais

Após implementar tudo:

1. **Hover**: mouse sobre carta → scale + lift suave, mouse sai → volta
2. **Drag**: arrastar carta → glow some, scale volta 1.0
3. **Múltiplos hovers**: hover rápido em cartas seguidas → sem conflito
4. **Rebuild**: hand muda → animações antigas são mortas
5. **Performance**: DevTools → Performance → gravar 5s → verificar frame drops
