# Plano 2: AnimationQueue - Passo a Passo Detalhado

## Visão Geral

Criar o sistema de fila que processa eventos de animação enviados pelo back-end via WebSocket. Cada evento é mapeado para animações que usam a AnimationEngine (Plano 1).

**Pré-requisito:** Plano 1 (AnimationEngine) deve estar implementado.

---

## Passo 1: Criar tipos `AnimationEvent.ts`

**Caminho:** `app/renderer/animations/AnimationEvent.ts`

```ts
export type AnimationEventType =
  | 'SPELL_CAST'
  | 'CARD_SUMMONED'
  | 'CARD_EVOLVED'
  | 'ATTACK'
  | 'DAMAGE'
  | 'CARD_DIED'
  | 'TURN_STARTED'
  | 'EFFECT_APPLIED';

export interface AnimationEvent {
  type: AnimationEventType;
  sourceId?: string;
  targetId?: string;
  value?: number;
  position?: {
    lane: number;
    position: string;
    owner: string;
  };
  metadata?: Record<string, unknown>;
}

export interface TurnAnimationsPayload {
  animations: AnimationEvent[];
}
```

---

## Passo 2: Criar `BattleAnimator.ts`

**Caminho:** `app/renderer/animations/animators/BattleAnimator.ts`

```ts
import * as PIXI from 'pixi.js';
import type { AnimationEvent } from '../AnimationEvent';
import { animations } from '../AnimationEngine';
import { Easing } from '../Easing';
import { Tween } from '../Tween';

interface FindableSprite {
  x: number;
  y: number;
  alpha: number;
  scale: PIXI.Container['scale'];
  parent: PIXI.Container | null;
}

export class BattleAnimator {
  private spriteMap = new Map<string, FindableSprite>();
  private screenW: number;
  private screenH: number;

  constructor(screenW: number, screenH: number) {
    this.screenW = screenW;
    this.screenH = screenH;
  }

  updateScreenSize(w: number, h: number) {
    this.screenW = w;
    this.screenH = h;
  }

  registerSprite(id: string, sprite: FindableSprite) {
    this.spriteMap.set(id, sprite);
  }

  unregisterSprite(id: string) {
    this.spriteMap.delete(id);
  }

  clearAll() {
    this.spriteMap.clear();
  }

  private findSprite(id: string | undefined): FindableSprite | null {
    if (!id) return null;
    return this.spriteMap.get(id) ?? null;
  }

  execute(event: AnimationEvent, onComplete: () => void) {
    switch (event.type) {
      case 'CARD_SUMMONED':
        this.executeSummon(event, onComplete);
        break;
      case 'ATTACK':
        this.executeAttack(event, onComplete);
        break;
      case 'DAMAGE':
        this.executeDamage(event, onComplete);
        break;
      case 'CARD_DIED':
        this.executeDeath(event, onComplete);
        break;
      case 'SPELL_CAST':
        this.executeSpell(event, onComplete);
        break;
      case 'TURN_STARTED':
        this.executeTurnBanner(event, onComplete);
        break;
      case 'CARD_EVOLVED':
        this.executeEvolve(event, onComplete);
        break;
      case 'EFFECT_APPLIED':
        this.executeEffect(event, onComplete);
        break;
      default:
        onComplete();
    }
  }

  private executeSummon(event: AnimationEvent, onComplete: () => void) {
    const sprite = this.findSprite(event.targetId);
    if (!sprite) { onComplete(); return; }

    const originalAlpha = sprite.alpha;
    const originalScaleX = (sprite.scale as any).x ?? 1;
    const originalScaleY = (sprite.scale as any).y ?? 1;

    sprite.alpha = 0;
    (sprite.scale as any).x = 0.5;
    (sprite.scale as any).y = 0.5;

    const seq = animations.sequence([
      new Tween({ target: sprite, prop: 'alpha', to: originalAlpha, duration: 300, easing: Easing.easeOutCubic }),
      new Tween({ target: sprite.scale, prop: 'x', to: originalScaleX, duration: 300, easing: Easing.easeOutBack }),
      new Tween({ target: sprite.scale, prop: 'y', to: originalScaleY, duration: 300, easing: Easing.easeOutBack }),
    ], onComplete);

    animations.add(seq);
  }

  private executeAttack(event: AnimationEvent, onComplete: () => void) {
    const attacker = this.findSprite(event.sourceId);
    const target = this.findSprite(event.targetId);
    if (!attacker) { onComplete(); return; }

    const originalX = attacker.x;
    const direction = target ? (target.x > attacker.x ? 1 : -1) : 1;
    const lungeDistance = 30;

    const seq = animations.sequence([
      new Tween({ target: attacker, prop: 'x', to: originalX + lungeDistance * direction, duration: 150, easing: Easing.easeOutQuad }),
      new Tween({ target: attacker, prop: 'x', to: originalX + lungeDistance * direction, duration: 100 }),
      new Tween({ target: attacker, prop: 'x', to: originalX, duration: 200, easing: Easing.easeInOutQuad }),
    ], onComplete);

    animations.add(seq);
  }

  private executeDamage(event: AnimationEvent, onComplete: () => void) {
    const target = this.findSprite(event.targetId);
    if (!target || !target.parent) { onComplete(); return; }

    const damageText = new PIXI.Text({
      text: `-${event.value ?? 0}`,
      style: {
        fontSize: 18,
        fontWeight: 'bold',
        fill: 0xff4444,
        fontFamily: 'Arial',
        stroke: { color: 0x000000, width: 3 },
      },
    });
    damageText.anchor.set(0.5);
    damageText.x = target.x;
    damageText.y = target.y - 20;

    target.parent.addChild(damageText);

    const seq = animations.sequence([
      new Tween({ target: damageText, prop: 'y', to: target.y - 60, duration: 800, easing: Easing.easeOutQuad }),
      new Tween({ target: damageText, prop: 'alpha', to: 0, duration: 800, easing: Easing.easeInQuad }),
    ], () => {
      damageText.destroy();
      onComplete();
    });

    animations.add(seq);
  }

  private executeDeath(event: AnimationEvent, onComplete: () => void) {
    const sprite = this.findSprite(event.targetId);
    if (!sprite) { onComplete(); return; }

    const originalY = sprite.y;

    const seq = animations.sequence([
      new Tween({ target: sprite, prop: 'alpha', to: 0, duration: 400, easing: Easing.easeInQuad }),
      new Tween({ target: sprite, prop: 'y', to: originalY + 20, duration: 400, easing: Easing.easeInQuad }),
    ], () => {
      this.unregisterSprite(event.targetId ?? '');
      onComplete();
    });

    animations.add(seq);
  }

  private executeSpell(event: AnimationEvent, onComplete: () => void) {
    const source = this.findSprite(event.sourceId);
    if (!source || !source.parent) { onComplete(); return; }

    const flash = new PIXI.Graphics();
    flash.circle(0, 0, 40);
    flash.fill({ color: 0x60a5fa, alpha: 0.6 });
    flash.x = source.x;
    flash.y = source.y;

    source.parent.addChild(flash);

    const seq = animations.sequence([
      new Tween({ target: flash, prop: 'alpha', to: 0, duration: 500, easing: Easing.easeOutQuad }),
    ], () => {
      flash.destroy();
      onComplete();
    });

    animations.add(seq);
  }

  private executeTurnBanner(event: AnimationEvent, onComplete: () => void) {
    const banner = new PIXI.Container();

    const bg = new PIXI.Graphics();
    bg.rect(0, 0, 300, 60);
    bg.fill({ color: 0x1a1a2e, alpha: 0.9 });
    bg.x = -150;
    bg.y = -30;
    banner.addChild(bg);

    const text = new PIXI.Text({
      text: `Turno ${event.value ?? '?'}`,
      style: {
        fontSize: 24,
        fontWeight: 'bold',
        fill: 0xfbbf24,
        fontFamily: 'Arial',
      },
    });
    text.anchor.set(0.5);
    banner.addChild(text);

    banner.x = this.screenW / 2;
    banner.y = -60;

    banner.parent?.addChild(banner);

    const seq = animations.sequence([
      new Tween({ target: banner, prop: 'y', to: this.screenH / 2, duration: 400, easing: Easing.easeOutBack }),
      new Tween({ target: banner, prop: 'y', to: this.screenH / 2, duration: 1000 }),
      new Tween({ target: banner, prop: 'y', to: -60, duration: 400, easing: Easing.easeInBack }),
    ], () => {
      banner.destroy({ children: true });
      onComplete();
    });

    animations.add(seq);
  }

  private executeEvolve(event: AnimationEvent, onComplete: () => void) {
    const sprite = this.findSprite(event.targetId);
    if (!sprite) { onComplete(); return; }

    const originalScaleX = (sprite.scale as any).x ?? 1;
    const originalScaleY = (sprite.scale as any).y ?? 1;

    const seq = animations.sequence([
      new Tween({ target: sprite.scale, prop: 'x', to: originalScaleX * 1.3, duration: 200, easing: Easing.easeOutQuad }),
      new Tween({ target: sprite.scale, prop: 'y', to: originalScaleY * 1.3, duration: 200, easing: Easing.easeOutQuad }),
      new Tween({ target: sprite.scale, prop: 'x', to: originalScaleX, duration: 300, easing: Easing.easeOutBack }),
      new Tween({ target: sprite.scale, prop: 'y', to: originalScaleY, duration: 300, easing: Easing.easeOutBack }),
    ], onComplete);

    animations.add(seq);
  }

  private executeEffect(event: AnimationEvent, onComplete: () => void) {
    const target = this.findSprite(event.targetId);
    if (!target || !target.parent) { onComplete(); return; }

    const glow = new PIXI.Graphics();
    glow.roundRect(-30, -30, 60, 60, 10);
    glow.fill({ color: 0xfbbf24, alpha: 0.5 });
    glow.x = target.x;
    glow.y = target.y;

    target.parent.addChild(glow);

    const seq = animations.sequence([
      new Tween({ target: glow, prop: 'alpha', to: 0, duration: 600, easing: Easing.easeOutQuad }),
    ], () => {
      glow.destroy();
      onComplete();
    });

    animations.add(seq);
  }
}
```

---

## Passo 3: Criar `AnimationQueue.ts`

**Caminho:** `app/renderer/animations/AnimationQueue.ts`

```ts
import type { AnimationEvent, AnimationEventType } from './AnimationEvent';
import type { BattleAnimator } from './animators/BattleAnimator';

const DELAYS: Record<AnimationEventType, number> = {
  SPELL_CAST: 800,
  CARD_SUMMONED: 600,
  CARD_EVOLVED: 1000,
  ATTACK: 500,
  DAMAGE: 300,
  CARD_DIED: 700,
  TURN_STARTED: 1000,
  EFFECT_APPLIED: 600,
};

export class AnimationQueue {
  private animations: AnimationEvent[] = [];
  private currentIndex = 0;
  private isPlaying = false;
  private battleAnimator: BattleAnimator;
  private fallbackTimeout: ReturnType<typeof setTimeout> | null = null;
  private maxTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(battleAnimator: BattleAnimator) {
    this.battleAnimator = battleAnimator;
  }

  load(events: AnimationEvent[]) {
    this.clear();
    this.animations = events;
    this.currentIndex = 0;
    this.isPlaying = true;
    this.playNext();
  }

  private playNext() {
    if (!this.isPlaying) return;

    if (this.currentIndex >= this.animations.length) {
      this.isPlaying = false;
      return;
    }

    const event = this.animations[this.currentIndex];
    const delay = DELAYS[event.type] ?? 500;

    this.battleAnimator.execute(event, () => {
      this.currentIndex++;

      this.maxTimeout = setTimeout(() => {
        this.playNext();
      }, delay);
    });

    const safetyTimeout = delay + 2000;
    this.fallbackTimeout = setTimeout(() => {
      if (this.isPlaying) {
        console.warn(`Animation timeout for ${event.type}, skipping...`);
        this.currentIndex++;
        this.playNext();
      }
    }, safetyTimeout);
  }

  pause() {
    this.isPlaying = false;
  }

  resume() {
    if (!this.isPlaying && this.currentIndex < this.animations.length) {
      this.isPlaying = true;
      this.playNext();
    }
  }

  skip() {
    if (this.currentIndex < this.animations.length) {
      this.currentIndex++;
      this.playNext();
    }
  }

  clear() {
    this.animations = [];
    this.currentIndex = 0;
    this.isPlaying = false;

    if (this.fallbackTimeout) {
      clearTimeout(this.fallbackTimeout);
      this.fallbackTimeout = null;
    }
    if (this.maxTimeout) {
      clearTimeout(this.maxTimeout);
      this.maxTimeout = null;
    }
  }

  get playing(): boolean {
    return this.isPlaying;
  }

  get progress(): number {
    return this.animations.length > 0
      ? this.currentIndex / this.animations.length
      : 0;
  }

  get total(): number {
    return this.animations.length;
  }

  get current(): number {
    return this.currentIndex;
  }
}

export const animationQueue = new AnimationQueue(
  new BattleAnimator(window.innerWidth, window.innerHeight)
);
```

---

## Passo 4: Editar `useGameSocket.ts`

**Caminho:** `app/hooks/useGameSocket.ts`

### 4.1 Adicionar imports (após linha 6)

```ts
import { animationQueue } from '../renderer/animations/AnimationQueue';
import type { TurnAnimationsPayload } from '../renderer/animations/AnimationEvent';
```

### 4.2 Adicionar timeout fallback (após linha 14)

```ts
let animationTimeout: ReturnType<typeof setTimeout> | null = null;
```

### 4.3 Adicionar listener para TURN_ANIMATIONS (após linha 109, depois do GAME_SYNC)

```ts
socket.on('TURN_ANIMATIONS', (payload: TurnAnimationsPayload) => {
  console.log('🎬 Recebeu TURN_ANIMATIONS:', payload.animations.length, 'animações');

  if (animationTimeout) {
    clearTimeout(animationTimeout);
    animationTimeout = null;
  }

  animationQueue.load(payload.animations);
});
```

### 4.4 Editar listener GAME_SYNC (linhas 101-109)

**Antes:**
```ts
socket.on('GAME_SYNC', (event: GameSyncEvent) => {
  console.log('🎮 Recebeu GAME_SYNC')
  console.log('   Fase:', event.state.phase)
  
  const store = useGameStore.getState()
  store.syncGameState(event)
  
  setGamePhase(event.state.phase)
})
```

**Depois:**
```ts
socket.on('GAME_SYNC', (event: GameSyncEvent) => {
  console.log('🎮 Recebeu GAME_SYNC')
  console.log('   Fase:', event.state.phase)
  
  const store = useGameStore.getState()
  store.syncGameState(event)
  
  setGamePhase(event.state.phase)

  if (animationTimeout) {
    clearTimeout(animationTimeout);
  }
  animationTimeout = setTimeout(() => {
    if (!animationQueue.playing) {
      console.log('ℹ️ Sem animações para este turno');
    }
  }, 200);
})
```

### 4.5 Limpar timeout no disconnect (após linha 191)

```ts
const disconnect = () => {
  if (animationTimeout) {
    clearTimeout(animationTimeout);
    animationTimeout = null;
  }
  animationQueue.clear();
  
  // ... resto do código existente ...
}
```

---

## Passo 5: Editar `PixiRender.ts`

**Caminho:** `app/components/Pixi/PixiRender.ts`

### 5.1 Adicionar import (após linha 12)

```ts
import { animationQueue } from '../../renderer/animations/AnimationQueue';
import { BattleAnimator } from '../../renderer/animations/animators/BattleAnimator';
```

### 5.2 Adicionar propriedades na classe (após linha 48)

```ts
private battleAnimator: BattleAnimator;
```

### 5.3 Criar battleAnimator no construtor (após linha 95)

```ts
this.battleAnimator = new BattleAnimator(
  this.app.screen.width,
  this.app.screen.height
);
```

### 5.4 Atualizar tamanho no resize (após linha 152)

```ts
this.battleAnimator.updateScreenSize(width, height);
```

### 5.5 Atualizar spriteMap quando board mudar (no subscribeToStore, após linha 233)

```ts
if (boardChanged) {
  this.prevBoardSlots = state.board.slots;

  if (this.boardManager.container.children.length === 0) {
    this.boardManager.rebuild(state.board.slots, w, h);
  } else {
    this.boardManager.update(state.board.slots, w, h);
  }

  this.inputHandler.refreshBindings();

  this.battleAnimator.clearAll();
  for (const { cardSprite, slot } of this.boardManager.getBoardCardSprites()) {
    if (slot.cardInstance) {
      this.battleAnimator.registerSprite(slot.cardInstance.instanceId, cardSprite);
    }
  }
}
```

### 5.6 Atualizar spriteMap quando hand mudar (no subscribeToStore, após linha 249)

```ts
if (handChanged) {
  this.prevHand = state.player.hand;

  if (this.handManager.container.children.length === 0) {
    this.handManager.rebuild(state.player.hand, w, h);
  } else {
    this.handManager.update(state.player.hand, w, h);
  }

  this.inputHandler.refreshBindings();
}
```

### 5.7 Limpar no destroy (após linha 332)

```ts
this.battleAnimator.clearAll();
animationQueue.clear();
```

---

## Passo 6: Editar `gameStore.tsx`

**Caminho:** `app/store/gameStore.tsx`

### 6.1 Adicionar estados de animação (após linha 37)

```ts
isAnimating: boolean;
animationProgress: number;
```

### 6.2 Adicionar ações (após linha 49)

```ts
setAnimating: (isAnimating: boolean) => void;
setAnimationProgress: (progress: number) => void;
```

### 6.3 Adicionar valores iniciais (após linha 86)

```ts
isAnimating: false,
animationProgress: 0,
```

### 6.4 Adicionar implementação das ações (após linha 138)

```ts
setAnimating: (isAnimating: boolean) => set({ isAnimating }),
setAnimationProgress: (animationProgress: number) => set({ animationProgress }),
```

---

## Resumo das Mudanças

| Arquivo | Ação | O que muda |
|---------|------|------------|
| `AnimationEvent.ts` | CRIAR | Tipos de eventos |
| `BattleAnimator.ts` | CRIAR | Orquestra animações de batalha |
| `AnimationQueue.ts` | CRIAR | Fila de processamento |
| `useGameSocket.ts` | EDITAR | Listener TURN_ANIMATIONS + fallback |
| `PixiRender.ts` | EDITAR | Integra BattleAnimator + spriteMap |
| `gameStore.tsx` | EDITAR | Estados de animação |

---

## Testes Manuais

Após implementar tudo:

1. **TURN_STARTED**: banner "Turno 1" aparece e some
2. **CARD_SUMMONED**: carta aparece no slot com fade in
3. **ATTACK**: atacante avança e volta
4. **DAMAGE**: número flutuante aparece e sobe
5. **CARD_DIED**: carta some com fade out
6. **SPELL_CAST**: flash visual aparece
7. **CARD_EVOLVED**: escala cresce e volta
8. **EFFECT_APPLIED**: glow dourado aparece
9. **Múltiplos eventos**: fila com 5+ animações executa em sequência
10. **Sem animações**: GAME_SYNC sem TURN_ANIMATIONS → fallback OK

---

## Fluxo Completo

```
1. Back-end: socket.emit('TURN_ANIMATIONS', { animations: [...] })

2. useGameSocket: socket.on('TURN_ANIMATIONS', handleTurnAnimations)

3. AnimationQueue.load(events)
   - Limpa fila anterior
   - Armazena eventos
   - Chama playNext()

4. AnimationQueue.playNext()
   - Pega evento atual
   - Chama BattleAnimator.execute(event, callback)

5. BattleAnimator.execute(event)
   - Cria Sequence de Tweens
   - Adiciona ao AnimationEngine

6. AnimationEngine.update(dt)
   - Processa Tweens
   - Atualiza propriedades dos sprites

7. onComplete callback
   - AnimationQueue avança para próximo evento
   - Repete até fila vazia
```
