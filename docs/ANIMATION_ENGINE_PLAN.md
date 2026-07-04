# Plano: Sistema de AnimationEngine

## Filosofia

Cada classe deve ter apenas uma responsabilidade.

```
CardSprite → "Quero crescer"
AnimationEngine → "Eu faço crescer."
```

O CardSprite nunca deve saber como uma animação acontece. Ele apenas diz o objetivo. A AnimationEngine é responsável por executar.

---

## Arquitetura

```
AnimationEngine
        │
        ▼
  Animation (interface)
        │
   ┌────┴────┐
   │         │
Tween     Sequence
   │
   ▼
Shake (futuro)
```

A AnimationEngine conhece apenas a interface `Animation`. Não importa se é um Tween ou um Sequence. Tudo é uma Animation.

---

## Estrutura de pastas

```
app/renderer/animations/
├── Animation.ts          ← interface comum
├── AnimationEngine.ts    ← pool central
├── Tween.ts              ← interpolação de propriedade
├── Sequence.ts           ← agrupar tweens em sequência
├── Shake.ts              ← tremores (futuro)
├── Easing.ts             ← funções matemáticas
│
├── animators/
│   ├── CardAnimator.ts   ← estados da carta (Fase 1)
│   ├── ScrollAnimator.ts ← pergaminho (futuro)
│   ├── CameraAnimator.ts ← zoom, pan (futuro)
│   └── UIAnimator.ts     ← popups (futuro)
│
└── effects/
    ├── HoverEffect.ts       ← lift + scale + glow (Fase 1)
    ├── BreathingEffect.ts   ← respiração (Fase 2)
    ├── GlowEffect.ts        ← brilho por raridade (Fase 2)
    ├── LightSweepEffect.ts  ← luz passando (Fase 2)
    ├── FloatingParticles.ts ← partículas (futuro)
    ├── ParallaxEffect.ts    ← profundidade (futuro)
    ├── DamageShakeEffect.ts ← dano (futuro)
    └── RarityEffect.ts      ← composição (futuro)
```

---

## Por que esse sistema existe

O código atual tem animação espalhada e reimplementada:

- `CardSprite.tick()` faz lerp manual (linhas 131-151)
- `PendingActionsScroll` usa `requestAnimationFrame` separado
- Cada componente inventa sua própria interpolação
- Não existe reutilização — adicionar breathing, glow ou partículas significaria copiar e colar mais lerp

A AnimationEngine centraliza tudo em um único lugar. Um tween genérico resolve 90% dos casos de animação do jogo.

---

## O que muda (arquivos)

| Arquivo | Mudança |
|---------|---------|
| `app/renderer/animations/Animation.ts` | **CRIAR** — interface |
| `app/renderer/animations/Easing.ts` | **CRIAR** — funções de easing |
| `app/renderer/animations/Tween.ts` | **CRIAR** — tween individual |
| `app/renderer/animations/Sequence.ts` | **CRIAR** — sequência de animações |
| `app/renderer/animations/AnimationEngine.ts` | **CRIAR** — pool central |
| `app/renderer/animations/effects/HoverEffect.ts` | **CRIAR** — efeito de hover |
| `app/renderer/animations/animators/CardAnimator.ts` | **CRIAR** — orquestra animações da carta |
| `app/components/Pixi/PixiRender.ts` | **EDITAR** — adicionar `animations.update(dt)` |
| `app/components/Pixi/Sprites/CardSprite.ts` | **EDITAR** — usar CardAnimator |
| `app/Managers/HandManager.ts` | **EDITAR** — remover `tick()` |
| `app/components/Pixi/Sprites/PendingActionsScroll.ts` | **EDITAR** — usar Tween |
| `app/renderer/animations/effect/EffectAnimation.ts` | **DELETAR** — vazio |

---

## Trade-offs

### Vantagens

- **Reutilização**: qualquer propriedade numérica pode ser animada com 3 linhas
- **Consistência**: todas as animações usam o mesmo easing e a mesma temporização
- **Manutenção**: bug no timing? Corrige em um lugar só
- **Performance**: um loop itera sobre N tweens; N requestsAnimationFrame criam N loops separados
- **Extensibilidade**: futuros efeitos (breathing, particles, glow) se integram trivialmente
- **Controle**: `kill()`, `pause()`, `yoyo`, `repeat` vêm de graça

### Desvantagens

- **Curva de aprendizado**: outro conceito para entender antes de mexer em animação
- **Complexidade para casos simples**: animar `alpha` de 0 para 1 agora usa uma classe ao invés de `sprite.alpha = 1`
- **Debug mais difícil**: tween em stack trace é menos óbvio que um `sprite.x +=` direto
- **Potencial de abuso**: tentar animar tudo com tween quando um simples `Math.sin()` no tick resolveria

### Quando NÃO usar tween

- **Animações contínuas e infinitas** (flutuação, respiração, brilho pulsante) → `Math.sin(time)` no tick
- **Animações que dependem de física** (gravidade, colisão) → tweens não resolvem

### Quando usar tween

- **Mudança de estado**: hover, ataque, dano, invocação, destruir carta
- **Transições**: abrir/fechar pergaminho, popup, fade
- **Animações com início e fim definidos**

---

## Passo a passo da implementação

### Passo 1: Criar `Animation.ts`

**Por quê**: interface comum para todas as animações. A engine só conhece essa interface.

**Caminho**: `app/renderer/animations/Animation.ts`

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

### Passo 2: Criar `Easing.ts`

**Por quê**: funções puras, sem dependências. É a base de tudo.

**Caminho**: `app/renderer/animations/Easing.ts`

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

### Passo 3: Criar `Tween.ts`

**Por quê**: a unidade básica de animação. Um tween = uma propriedade animada de A para B em T tempo com easing E.

**Caminho**: `app/renderer/animations/Tween.ts`

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

### Passo 4: Criar `Sequence.ts`

**Por quê**: agrupa animações para execução em sequência (uma após a outra). Útil para animações compostas.

**Caminho**: `app/renderer/animations/Sequence.ts`

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

### Passo 5: Criar `AnimationEngine.ts`

**Por quê**: pool central que itera sobre todas as animações. O ticker do PixiJS chama um método só.

**Caminho**: `app/renderer/animations/AnimationEngine.ts`

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

### Passo 6: Criar `HoverEffect.ts`

**Por quê**: efeito reutilizável de hover. Pode ser usado em cartas, botões, ícones.

**Caminho**: `app/renderer/animations/effects/HoverEffect.ts`

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
    const { target, baseY, hoverScale, hoverLift, duration } = this.config;
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
    // HoverEffect é reativo (enter/leave), não tick-based
    this.finished = false;
  }

  pause() { this.kill(); }
  resume() {}
  stop() { this.kill(); }
}
```

---

### Passo 7: Criar `CardAnimator.ts`

**Por quê**: orquestra as animações da carta. Conhece os estados: hover, drag, ataque, dano.

**Caminho**: `app/renderer/animations/animators/CardAnimator.ts`

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
    this.hoverEffect.enter();
  }

  hoverLeave() {
    this.hoverEffect.leave();
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

### Passo 8: Integrar no `PixiRender.ts`

**Por quê**: o ticker do PixiJS é o game loop. A engine precisa de update para processar animações.

**Arquivo**: `app/components/Pixi/PixiRender.ts`

**Adicionar import** (após linha 1):
```ts
import { animations } from '../../renderer/animations/AnimationEngine';
```

**Editar método `tick`** (linhas 137-142):
```ts
private tick = (ticker: PIXI.Ticker) => {
  const dt = ticker.deltaTime;
  animations.update(dt);         // ← ADICIONAR ESTA LINHA
  this.handManager.tick(dt);
  this.inputHandler.updateHighlight();
  this.pendingScroll.tick(dt);
};
```

---

### Passo 9: Refatorar `CardSprite.ts`

**Por quê**: usar CardAnimator para gerenciar animações da carta.

**Arquivo**: `app/components/Pixi/Sprites/CardSprite.ts`

**Adicionar imports** (após linha 1):
```ts
import { CardAnimator } from '../../../renderer/animations/animators/CardAnimator';
```

**Adicionar propriedade** (após linha 32):
```ts
private animator: CardAnimator | null = null;
```

**No construtor**, após `this.build(width, height)` (linha 66):
```ts
// Criar animator após o build (quando baseY já está definido)
// baseY será definido pelo HandManager via setBaseY()
```

**Editar método `setBaseY`** (linhas 153-155):
```ts
setBaseY(y: number) {
  this.baseY = y;
  if (!this.animator) {
    this.animator = new CardAnimator(this, y);
  }
}
```

**Substituir `onHoverIn`** (linhas 80-87):
```ts
private onHoverIn = () => {
  if (this._dragging) return;
  this.isHovered = true;
  this.baseY = this.y;
  this.baseRotation = this.rotation;
  this.drawGlow();
  this.animator?.hoverEnter();
};
```

**Substituir `onHoverOut`** (linhas 89-94):
```ts
private onHoverOut = () => {
  if (this._dragging) return;
  this.isHovered = false;
  this.clearGlow();
  this.animator?.hoverLeave();
};
```

**Substituir `setDragging`** (linhas 69-78):
```ts
setDragging(value: boolean) {
  this._dragging = value;
  if (value) {
    this.isHovered = false;
    this.clearGlow();
    this.animator?.dragStart();
  }
}
```

**Substituir `startDrag`** (linhas 161-167):
```ts
startDrag() {
  this.setDragging(true);
}
```

**Substituir `endDrag`** (linhas 169-173):
```ts
endDrag() {
  this.animator?.dragEnd();
  this._dragging = false;
}
```

**Remover método `computeTarget()`** (linhas 123-129) — não é mais necessário.

**Remover método `tick()`** (linhas 131-151) — não é mais necessário.

**Remover propriedades** (linhas 33-37):
```ts
// REMOVER:
private _animating = false;
private targetScaleX = 1;
private targetScaleY = 1;
private targetY = 0;
private targetRotation = 0;
```

---

### Passo 10: Editar `HandManager.ts`

**Por quê**: `CardSprite` não tem mais `tick()`, então chamar `sprite.tick(dt)` causaria erro.

**Arquivo**: `app/Managers/HandManager.ts`

**Remover método `tick()`** (linhas 78-82):
```ts
// REMOVER O MÉTODO INTEIRO:
tick(dt: number) {
  for (const sprite of this.cardSprites) {
    sprite.tick(dt);
  }
}
```

---

### Passo 11: Refatorar `PendingActionsScroll.ts`

**Por quê**: substituir `requestAnimationFrame` por tweens reutilizáveis.

**Arquivo**: `app/components/Pixi/Sprites/PendingActionsScroll.ts`

**Adicionar imports** (após linha 1):
```ts
import { animations } from '../../../renderer/animations/AnimationEngine';
import { Easing } from '../../../renderer/animations/Easing';
```

**Substituir método `showUnroll()`** (linhas 554-582):
```ts
async showUnroll() {
  if (this.isAnimating || this.isContentVisible) return;
  this.isAnimating = true;

  this.container.visible = true;
  this.container.alpha = 1;
  this.maskGraphics.scale.y = 0;
  this.maskGraphics.y = 0;

  await new Promise<void>((resolve) => {
    animations.tween({
      target: this.maskGraphics.scale,
      prop: 'y',
      to: 1,
      duration: 400,
      easing: Easing.easeOutCubic,
      onComplete: () => {
        this.isAnimating = false;
        this.isContentVisible = true;
        resolve();
      },
    });
  });
}
```

**Substituir método `hideRoll()`** (linhas 585-610):
```ts
async hideRoll() {
  if (this.isAnimating || !this.isContentVisible) return;
  this.isAnimating = true;

  await new Promise<void>((resolve) => {
    animations.tween({
      target: this.maskGraphics.scale,
      prop: 'y',
      to: 0,
      duration: 300,
      easing: Easing.easeInQuad,
      onComplete: () => {
        this.container.visible = false;
        this.isAnimating = false;
        this.isContentVisible = false;
        resolve();
      },
    });
  });
}
```

**Substituir método `tick()`** (linhas 548-552):
```ts
tick(_dt: number) {
  // Floating animation agora é gerenciada pelo AnimationEngine
  // via tween com repeat: -1 no init()
}
```

**Adicionar tween de flutuação no método `init()`** (após linha 287):
```ts
// Adicionar após this.container.addChild(this.header)
animations.tween({
  target: this.container,
  prop: 'y',
  from: this.baseY + 3,
  to: this.baseY - 3,
  duration: 667,
  easing: Easing.easeInOutQuad,
  yoyo: true,
  repeat: -1,
});
```

**Remover propriedades**:
```ts
// REMOVER:
private floatTime = 0;
```

---

### Passo 12: Deletar arquivo vazio

**Por quê**: `EffectAnimation.ts` está vazio e não é usado.

```bash
rm app/renderer/animations/effect/EffectAnimation.ts
```

---

## Testes manuais

Após implementar, testar cada cenário:

1. **Hover**: mouse sobre carta → scale + lift suave, mouse sai → volta
2. **Drag**: arrastar carta → glow some, scale volta 1.0
3. **Múltiplos hovers**: hover rápido em cartas seguidas → sem conflito
4. **Pergaminho**: fase DECLARATION com ações → desenrola suave
5. **Pergaminho hide**: sem ações → enrola suave
6. **Floating**: pergaminho flutua suave quando visível
7. **Performance**: abrir DevTools → Performance → gravar 5 segundos → verificar que não há frame drops

---

## Ordem de implementação

| # | Arquivo | Dependências | Esforço |
|---|---------|--------------|---------|
| 1 | `Animation.ts` | Nenhuma | 2 min |
| 2 | `Easing.ts` | Nenhuma | 10 min |
| 3 | `Tween.ts` | Animation, Easing | 30 min |
| 4 | `Sequence.ts` | Animation | 15 min |
| 5 | `AnimationEngine.ts` | Animation, Tween, Sequence | 20 min |
| 6 | `HoverEffect.ts` | Animation, AnimationEngine, Easing | 15 min |
| 7 | `CardAnimator.ts` | HoverEffect, AnimationEngine, Easing | 15 min |
| 8 | `PixiRender.ts` | AnimationEngine | 2 min |
| 9 | `CardSprite.ts` | CardAnimator | 20 min |
| 10 | `HandManager.ts` | Nenhuma | 2 min |
| 11 | `PendingActionsScroll.ts` | AnimationEngine, Easing | 15 min |
| 12 | Deletar `EffectAnimation.ts` | Nenhuma | 1 min |

**Total: ~2.5 horas**

---

## Uso futuro: novos efeitos

Com a AnimationEngine pronta, adicionar efeitos é trivial:

### Breathing (respiração da artwork)
```ts
animations.tween({
  target: artSprite.scale,
  prop: 'x',
  from: 1.0,
  to: 1.01,
  duration: 1500,
  easing: Easing.easeInOutQuad,
  yoyo: true,
  repeat: -1,
});
```

### Light sweep (luz passando)
```ts
animations.tween({
  target: lightSprite,
  prop: 'x',
  from: -50,
  to: width + 50,
  duration: 3000,
  easing: Easing.linear,
  repeat: -1,
});
```

### Glow por raridade
```ts
const glowConfigs = {
  common: { alpha: 0.1, duration: 2000 },
  rare: { alpha: 0.3, duration: 1500 },
  epic: { alpha: 0.5, duration: 1000 },
  legendary: { alpha: 0.7, duration: 800 },
};

const cfg = glowConfigs[card.base.rarity];
animations.tween({
  target: glowGraphics,
  prop: 'alpha',
  from: 0,
  to: cfg.alpha,
  duration: cfg.duration,
  yoyo: true,
  repeat: -1,
});
```

---

## Builder API (futuro — adiar)

### O que é

Uma API fluente (encadeamento de métodos) para criar animações de forma mais legível.

### Comum (objeto config)

```ts
animations.tween({
  target: card.scale,
  prop: 'x',
  to: 1.15,
  duration: 200,
  easing: Easing.easeOutCubic,
});
```

### Builder API (fluent)

```ts
animations
  .to(card.scale)
  .property('x')
  .value(1.15)
  .duration(200)
  .ease(Easing.easeOutCubic)
  .play();
```

### Comparação

| Aspecto | Objeto config | Builder API |
|---------|---------------|-------------|
| Legibilidade | Explícito | Mais fluido |
| Descoberta | Precisa saber a interface | IDE mostra métodos |
| Debug | Stack trace curto | Stack trace mais longo |
| Autocomplete | Sim (TypeScript) | Sim (TypeScript) |
| Complexidade | Simples | Mais um arquivo |
| Manutenção | Zero overhead | Mais código para manter |

### Recomendação

**Adiar para depois.** O objeto config é suficiente para o tamanho atual do projeto. Builder API é um refinamento que pode ser adicionado quando houver mais animações complexas implementadas.

### Quando implementar

Quando o projeto tiver 10+ animações diferentes e a legibilidade do objeto config开始 a ser um problema. Até lá, `animations.tween({})` é mais curto e mais fácil de debugar.
