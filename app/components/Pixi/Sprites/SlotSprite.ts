import * as PIXI from 'pixi.js';
import type { BoardSlot } from '@/app/types/game';
import { CardSprite } from './CardSprite';

export const SLOT_WIDTH = 96;
export const SLOT_HEIGHT = 144;

const OWNER_BORDER: Record<string, number> = {
  PLAYERONE: 0x3b82f6,
  PLAYERTWO: 0xef4444,
};

export class SlotSprite extends PIXI.Container {
  slot: BoardSlot;
  private bg: PIXI.Graphics;
  private cardSprite: CardSprite | null = null;
  private slotId: string;

  constructor(slot: BoardSlot) {
    super();

    this.slot = slot;
    this.slotId = `${slot.owner}-${slot.position}-${slot.lane}`;

    this.bg = new PIXI.Graphics();
    this.addChild(this.bg);

    this.build();
    this.renderCard();
  }

  private build() {
    const borderAlpha = this.slot.cardInstance ? 0.9 : 0.3;
    const fillColor = this.slot.cardInstance ? 0x1a1a2e : 0x000000;

    this.bg.clear();
    this.bg
      .roundRect(0, 0, SLOT_WIDTH, SLOT_HEIGHT, 8)
      .fill({ color: fillColor, alpha: 0.5 })
      .stroke({
        width: 2,
        color: OWNER_BORDER[this.slot.owner] ?? 0x6b7280,
        alpha: borderAlpha,
      });
  }

  private renderCard() {
    if (this.cardSprite) {
      this.removeChild(this.cardSprite);
      this.cardSprite.destroy();
      this.cardSprite = null;
    }

    if (this.slot.cardInstance) {
      this.cardSprite = new CardSprite(this.slot.cardInstance, SLOT_WIDTH, SLOT_HEIGHT);
      this.addChild(this.cardSprite);
    }
  }

  getId(): string {
    return this.slotId;
  }

  updateSlot(slot: BoardSlot) {
    const sameCard =
      this.slot.cardInstance?.instanceId === slot.cardInstance?.instanceId;

    this.slot = slot;
    this.slotId = `${slot.owner}-${slot.position}-${slot.lane}`;

    this.build();

    if (!sameCard) {
      this.renderCard();
    } else if (this.cardSprite && slot.cardInstance) {
      this.cardSprite.updateCard(slot.cardInstance, SLOT_WIDTH, SLOT_HEIGHT);
    }
  }
}
