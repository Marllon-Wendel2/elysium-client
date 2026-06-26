import * as PIXI from 'pixi.js';
import type { CardInstance } from '@/app/types/cardInstance';
import { CardSprite } from '../Sprites/CardSprite';

const BASE_CARD_WIDTH = 100;
const BASE_CARD_HEIGHT = 150;
const MAX_HAND_RATIO = 0.55;
const CARD_BOTTOM_MARGIN = 30;

export interface DragEvent {
  card: CardInstance;
  sprite: CardSprite;
  globalPoint: PIXI.Point;
}

export interface DropEvent {
  card: CardInstance;
  sprite: CardSprite;
  globalPoint: PIXI.Point;
}

export class HandManager {
  container: PIXI.Container;
  private app: PIXI.Application | null = null;
  private cardSprites: CardSprite[] = [];
  private dragTarget: CardSprite | null = null;
  private dragOffset = { x: 0, y: 0 };
  private screenWidth = 0;
  private screenHeight = 0;

  onDragStart?: (e: DragEvent) => void;
  onDragEnd?: (e: DropEvent) => void;

  constructor() {
    this.container = new PIXI.Container();
    this.container.sortableChildren = true;
  }

  setApp(app: PIXI.Application) {
    this.app = app;
  }

  rebuild(hand: CardInstance[], screenWidth: number, screenHeight: number) {
    this.cancelDrag();
    this.clear();
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    hand.forEach((card) => {
      const sprite = new CardSprite(card, BASE_CARD_WIDTH, BASE_CARD_HEIGHT);
      this.cardSprites.push(sprite);
      this.container.addChild(sprite);
    });

    this.positionCards();
    this.bindDrag();
  }

  update(hand: CardInstance[], screenWidth: number, screenHeight: number) {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    const prevIds = this.cardSprites.map((s) => s.card.instanceId);
    const nextIds = hand.map((c) => c.instanceId);

    const sameOrder =
      prevIds.length === nextIds.length &&
      prevIds.every((id, i) => id === nextIds[i]);

    if (sameOrder) {
      this.cardSprites.forEach((sprite, i) => {
        sprite.updateCard(hand[i], BASE_CARD_WIDTH, BASE_CARD_HEIGHT);
      });
      this.positionCards();
      return;
    }

    this.rebuild(hand, screenWidth, screenHeight);
  }

  tick(dt: number) {
    for (const sprite of this.cardSprites) {
      sprite.tick(dt);
    }
  }

  getDraggingCard(): CardInstance | null {
    const t = this.dragTarget;
    if (t) return t.card;
    return null;
  }

  getDraggingSprite(): CardSprite | null {
    return this.dragTarget;
  }

  private cancelDrag() {
    if (this.dragTarget) {
      this.endDragCleanup();
      this.dragTarget = null;
    }
  }

  private endDragCleanup() {
    document.removeEventListener('pointermove', this.onDocumentMove);
    document.removeEventListener('pointerup', this.onDocumentUp);
  }

  removeDraggingFromHand() {
    const t = this.dragTarget;
    if (!t) return;
    this.endDragCleanup();
    const idx = this.cardSprites.indexOf(t);
    if (idx !== -1) {
      this.cardSprites.splice(idx, 1);
      this.container.removeChild(t);
    }
    this.dragTarget = null;
  }

  returnCardToHand(sprite: CardSprite) {
    this.endDragCleanup();
    if (!sprite.destroyed) {
      sprite.endDrag();
      if (sprite.parent !== this.container) {
        this.container.addChild(sprite);
      }
      if (!this.cardSprites.includes(sprite)) {
        this.cardSprites.push(sprite);
      }
    }
    this.dragTarget = null;
    this.positionCards();
  }

  positionCards() {
    const count = this.cardSprites.length;
    if (count === 0) return;

    const maxHandWidth = this.screenWidth * MAX_HAND_RATIO;
    const totalWidth = count * BASE_CARD_WIDTH;

    const overlap =
      count > 1 && totalWidth > maxHandWidth
        ? (totalWidth - maxHandWidth) / (count - 1)
        : 0;

    const handWidth = count * BASE_CARD_WIDTH - (count - 1) * overlap;
    const startX = (this.screenWidth - handWidth) / 2;
    const y = this.screenHeight - BASE_CARD_HEIGHT - CARD_BOTTOM_MARGIN;

    this.cardSprites.forEach((sprite, index) => {
      sprite.x = startX + index * (BASE_CARD_WIDTH - overlap);
      sprite.y = y;
      sprite.setBaseY(y);
    });
  }

  private bindDrag() {
    for (const sprite of this.cardSprites) {
      sprite.on('pointerdown', this.onPointerDown);
    }
  }

  private onPointerDown = (e: PIXI.FederatedPointerEvent) => {
    const sprite = e.currentTarget as CardSprite;
    if (!sprite || !this.cardSprites.includes(sprite)) return;
    if (!this.app) return;

    this.dragTarget = sprite;

    const canvasRect = this.app.canvas.getBoundingClientRect();
    const mouseX = e.clientX ?? (e.global.x);
    const mouseY = e.clientY ?? (e.global.y);

    this.dragOffset.x = sprite.getGlobalPosition().x - mouseX;
    this.dragOffset.y = sprite.getGlobalPosition().y - mouseY;

    sprite.startDrag();
    sprite.zIndex = 1000;

    this.onDragStart?.({
      card: sprite.card,
      sprite,
      globalPoint: new PIXI.Point(mouseX, mouseY),
    });

    document.addEventListener('pointermove', this.onDocumentMove);
    document.addEventListener('pointerup', this.onDocumentUp);
  };

  private onDocumentMove = (e: PointerEvent) => {
    const t = this.dragTarget;
    if (!t || !this.app) return;

    const canvasRect = this.app.canvas.getBoundingClientRect();
    const localX = e.clientX - canvasRect.left;
    const localY = e.clientY - canvasRect.top;

    t.x = localX + this.dragOffset.x;
    t.y = localY + this.dragOffset.y;
  };

  private onDocumentUp = (e: PointerEvent) => {
    const t = this.dragTarget;
    if (!t || !this.app) return;

    this.endDragCleanup();

    const canvasRect = this.app.canvas.getBoundingClientRect();
    const globalPoint = new PIXI.Point(
      e.clientX - canvasRect.left,
      e.clientY - canvasRect.top,
    );

    this.onDragEnd?.({
      card: t.card,
      sprite: t,
      globalPoint,
    });
  };

  private clear() {
    for (const sprite of this.cardSprites) {
      sprite.off('pointerdown', this.onPointerDown);
      this.container.removeChild(sprite);
      sprite.destroy();
    }
    this.cardSprites = [];
    this.dragTarget = null;
  }

  destroy() {
    this.endDragCleanup();
    this.clear();
  }
}
