import * as PIXI from 'pixi.js';
import type { BoardSlot, PlayerOwner } from '@/app/types/board';
import { SlotSprite, SLOT_WIDTH, SLOT_HEIGHT } from '../components/Pixi/Sprites/SlotSprite';
import { CardSprite } from '../components/Pixi/Sprites/CardSprite';

const SLOT_GAP = 10;
const SIDE_GAP = 60;
const HAND_AREA_HEIGHT = 200;

type RowKey = `${string}-${string}`;

export interface SlotDropTarget {
  slot: BoardSlot;
  bounds: PIXI.Rectangle;
}

export class BoardManager {
  container: PIXI.Container;
  private slotMap = new Map<string, SlotSprite>();
  private highlightGraphics: PIXI.Graphics;
  private highlightedSlot: string | null = null;
  private playerSide: PlayerOwner = 'PLAYERONE';

  constructor() {
    this.container = new PIXI.Container();
    this.highlightGraphics = new PIXI.Graphics();
    this.highlightGraphics.zIndex = 999;
  }

  setPlayerSide(side: PlayerOwner) {
    this.playerSide = side;
  }

  rebuild(slots: BoardSlot[], screenWidth: number, screenHeight: number) {
    this.clear();
    this.layoutSlots(slots, screenWidth, screenHeight);
  }

  update(slots: BoardSlot[], screenWidth: number, screenHeight: number) {
    const nextIds = new Set(slots.map((s) => this.slotKey(s)));

    for (const [id, sprite] of this.slotMap) {
      if (!nextIds.has(id)) {
        this.container.removeChild(sprite);
        sprite.destroy();
        this.slotMap.delete(id);
      }
    }

    for (const slot of slots) {
      const key = this.slotKey(slot);
      const existing = this.slotMap.get(key);

      if (existing) {
        existing.updateSlot(slot);
      } else {
        const sprite = new SlotSprite(slot);
        this.slotMap.set(key, sprite);
        this.container.addChild(sprite);
      }
    }

    this.reposition(screenWidth, screenHeight);
  }

  getSlotAtGlobal(globalPoint: PIXI.Point, screenWidth: number, screenHeight: number): SlotDropTarget | null {
    const localPoint = this.container.toLocal(globalPoint);

    for (const [id, sprite] of this.slotMap) {
      const scale = sprite.scale.x;
      const bounds = new PIXI.Rectangle(
        sprite.x,
        sprite.y,
        SLOT_WIDTH * scale,
        SLOT_HEIGHT * scale,
      );

      if (
        localPoint.x >= bounds.x &&
        localPoint.x <= bounds.x + bounds.width &&
        localPoint.y >= bounds.y &&
        localPoint.y <= bounds.y + bounds.height
      ) {
        return {
          slot: sprite.slot,
          bounds,
        };
      }
    }

    return null;
  }

  highlightSlot(slot: BoardSlot | null) {
    this.highlightGraphics.clear();

    if (!slot) {
      this.highlightedSlot = null;
      return;
    }

    const key = this.slotKey(slot);
    if (this.highlightedSlot === key) return;
    this.highlightedSlot = key;

    const sprite = this.slotMap.get(key);
    if (!sprite) return;

    const scale = sprite.scale.x;
    const padding = 6;

    this.highlightGraphics
      .roundRect(
        sprite.x - padding,
        sprite.y - padding,
        SLOT_WIDTH * scale + padding * 2,
        SLOT_HEIGHT * scale + padding * 2,
        10,
      )
      .stroke({ width: 3, color: 0x22c55e, alpha: 0.9 });

    this.container.addChild(this.highlightGraphics);
  }

  clearHighlight() {
    this.highlightGraphics.clear();
    this.highlightedSlot = null;
  }

  getAllPlayerSlots(): BoardSlot[] {
    const slots: BoardSlot[] = [];
    for (const sprite of this.slotMap.values()) {
      if (sprite.slot.owner === 'PLAYERONE' && !sprite.slot.cardInstance) {
        slots.push(sprite.slot);
      }
    }
    return slots;
  }

  private layoutSlots(slots: BoardSlot[], screenWidth: number, screenHeight: number) {
    const rows = this.groupByRow(slots);
    const rowOrder = this.getRowOrder();
    const occupiedRows = rowOrder.filter((k) => rows.has(k));

    if (occupiedRows.length === 0) return;

    const maxSlotsInRow = Math.max(
      ...occupiedRows.map((k) => rows.get(k)!.length),
    );

    const maxRowWidth = maxSlotsInRow * SLOT_WIDTH + (maxSlotsInRow - 1) * SLOT_GAP;
    const scale = maxRowWidth > screenWidth - SIDE_GAP * 2
      ? (screenWidth - SIDE_GAP * 2) / maxRowWidth
      : 1;

    const scaledW = SLOT_WIDTH * scale;
    const scaledH = SLOT_HEIGHT * scale;
    const scaledGap = SLOT_GAP * scale;

    const rowBlockHeight = scaledH + scaledGap;

    const opponentRows = occupiedRows.filter((k) => k.startsWith('PLAYERTWO'));
    const playerRows = occupiedRows.filter((k) => k.startsWith('PLAYERONE'));

    const opponentBlockHeight = opponentRows.length * rowBlockHeight;
    const playerBlockHeight = playerRows.length * rowBlockHeight;
    const gapBetween = SIDE_GAP;

    const totalBlockHeight = opponentBlockHeight + gapBetween + playerBlockHeight;
    const availableHeight = screenHeight - HAND_AREA_HEIGHT;
    const startY = (availableHeight - totalBlockHeight) / 2;

    occupiedRows.forEach((rowKey, rowIndex) => {
      const rowSlots = rows.get(rowKey)!;
      rowSlots.sort((a, b) => a.lane - b.lane);

      const rowWidth = rowSlots.length * scaledW + (rowSlots.length - 1) * scaledGap;
      const rowX = (screenWidth - rowWidth) / 2;

      let rowY: number;
      if (rowIndex < opponentRows.length) {
        rowY = startY + rowIndex * rowBlockHeight;
      } else {
        rowY = startY + opponentBlockHeight + gapBetween + (rowIndex - opponentRows.length) * rowBlockHeight;
      }

      rowSlots.forEach((slot, slotIndex) => {
        const sprite = new SlotSprite(slot);
        sprite.x = rowX + slotIndex * (scaledW + scaledGap);
        sprite.y = rowY;
        sprite.scale.set(scale);

        this.slotMap.set(this.slotKey(slot), sprite);
        this.container.addChild(sprite);
      });
    });
  }

  private reposition(screenWidth: number, screenHeight: number) {
    const rows = new Map<RowKey, SlotSprite[]>();

    for (const sprite of this.slotMap.values()) {
      const key: RowKey = `${sprite.slot.owner}-${sprite.slot.position}`;
      if (!rows.has(key)) rows.set(key, []);
      rows.get(key)!.push(sprite);
    }

    const rowOrder = this.getRowOrder();
    const occupiedRows = rowOrder.filter((k) => rows.has(k));

    if (occupiedRows.length === 0) return;

    const maxSlotsInRow = Math.max(
      ...occupiedRows.map((k) => rows.get(k)!.length),
    );

    const maxRowWidth = maxSlotsInRow * SLOT_WIDTH + (maxSlotsInRow - 1) * SLOT_GAP;
    const scale = maxRowWidth > screenWidth - SIDE_GAP * 2
      ? (screenWidth - SIDE_GAP * 2) / maxRowWidth
      : 1;

    const scaledW = SLOT_WIDTH * scale;
    const scaledGap = SLOT_GAP * scale;
    const scaledH = SLOT_HEIGHT * scale;
    const rowBlockHeight = scaledH + scaledGap;

    const opponentRows = occupiedRows.filter((k) => k.startsWith('PLAYERTWO'));
    const playerRows = occupiedRows.filter((k) => k.startsWith('PLAYERONE'));

    const opponentBlockHeight = opponentRows.length * rowBlockHeight;
    const playerBlockHeight = playerRows.length * rowBlockHeight;
    const gapBetween = SIDE_GAP;

    const totalBlockHeight = opponentBlockHeight + gapBetween + playerBlockHeight;
    const availableHeight = screenHeight - HAND_AREA_HEIGHT;
    const startY = (availableHeight - totalBlockHeight) / 2;

    occupiedRows.forEach((rowKey, rowIndex) => {
      const rowSprites = rows.get(rowKey)!;
      rowSprites.sort((a, b) => a.slot.lane - b.slot.lane);

      const rowWidth = rowSprites.length * scaledW + (rowSprites.length - 1) * scaledGap;
      const rowX = (screenWidth - rowWidth) / 2;

      let rowY: number;
      if (rowIndex < opponentRows.length) {
        rowY = startY + rowIndex * rowBlockHeight;
      } else {
        rowY = startY + opponentBlockHeight + gapBetween + (rowIndex - opponentRows.length) * rowBlockHeight;
      }

      rowSprites.forEach((sprite, slotIndex) => {
        sprite.x = rowX + slotIndex * (scaledW + scaledGap);
        sprite.y = rowY;
        sprite.scale.set(scale);
      });
    });
  }

  private groupByRow(slots: BoardSlot[]): Map<RowKey, BoardSlot[]> {
    const map = new Map<RowKey, BoardSlot[]>();

    for (const slot of slots) {
      const key: RowKey = `${slot.owner}-${slot.position}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(slot);
    }

    return map;
  }

  private getRowOrder(): RowKey[] {
    const opponent = this.playerSide === 'PLAYERONE' ? 'PLAYERTWO' : 'PLAYERONE';
    return [
      `${opponent}-BACK`,
      `${opponent}-FRONT`,
      `${this.playerSide}-FRONT`,
      `${this.playerSide}-BACK`,
    ];
  }

  private slotKey(slot: BoardSlot): string {
    return `${slot.owner}-${slot.position}-${slot.lane}`;
  }

  private clear() {
    for (const sprite of this.slotMap.values()) {
      this.container.removeChild(sprite);
      sprite.destroy();
    }
    this.slotMap.clear();
    this.highlightGraphics.clear();
  }

  getBoardCardSprites(): { cardSprite: CardSprite; slot: BoardSlot }[] {
    const result: { cardSprite: CardSprite; slot: BoardSlot } [] = [];

    for (const sprite of this.slotMap.values()) {
      const cardSprite = sprite.getCardSprite();
      if (cardSprite) {
        result.push({
          cardSprite,
          slot: sprite.slot,
        });
      }
    }

    return result;
  }

  destroy() {
    this.clear();
  }
}
