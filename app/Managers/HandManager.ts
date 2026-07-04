import * as PIXI from 'pixi.js';
import type { CardInstance } from '@/app/types/cardInstance';
import { CardSprite } from '../components/Pixi/Sprites/CardSprite';

const BASE_CARD_WIDTH = 100;
const BASE_CARD_HEIGHT = 150;
const MAX_HAND_RATIO = 0.55;
const CARD_BOTTOM_MARGIN = 30;
const ARC_HEIGHT = 20;
const MAX_ROTATION_DEG = 5;

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
  private cardSprites: CardSprite[] = [];
  private screenWidth = 0;
  private screenHeight = 0;

  onDragStart?: (e: DragEvent) => void;
  onDragEnd?: (e: DropEvent) => void;

  constructor() {
    this.container = new PIXI.Container();
    this.container.sortableChildren = true;
  }

  getCardSprites(): readonly CardSprite[] {
    return this.cardSprites;
  }

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

  removeSprite(sprite: CardSprite) {
    const idx = this.cardSprites.indexOf(sprite);
    if (idx !== -1) {
      this.cardSprites.splice(idx, 1);
      this.container.removeChild(sprite);
    }
  }

  returnCardToHand(sprite: CardSprite) {
    if (!sprite.destroyed) {
      sprite.endDrag();
      if (sprite.parent !== this.container) {
        this.container.addChild(sprite);
      }
      if (!this.cardSprites.includes(sprite)) {
        this.cardSprites.push(sprite);
      }
    }
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
    const baseY = this.screenHeight - BASE_CARD_HEIGHT - CARD_BOTTOM_MARGIN;
    const maxRotationRad = (MAX_ROTATION_DEG * Math.PI) / 180;

    this.cardSprites.forEach((sprite, index) => {
      if (sprite.isHovered) return;

      sprite.x = startX + index * (BASE_CARD_WIDTH - overlap);

      let rotation = 0;
      let arcOffset = 0;

      if (count > 1) {
        const t = (index - (count - 1) / 2) / ((count - 1) / 2);
        rotation = maxRotationRad * t;
        arcOffset = ARC_HEIGHT * t * t;
      }

      sprite.rotation = rotation;
      sprite.y = baseY + arcOffset;
      sprite.setBaseY(baseY + arcOffset);
    });
  }

  private clear() {
    for (const sprite of this.cardSprites) {
      this.container.removeChild(sprite);
      sprite.destroy();
    }
    this.cardSprites = [];
  }

  destroy() {
    this.clear();
  }
}
