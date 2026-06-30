import * as PIXI from 'pixi.js';
import { CardSprite } from '@/app/components/Pixi/Sprites/CardSprite';
import { BoardManager } from '@/app/Managers/BoardManager';
import { HandManager } from '@/app/Managers/HandManager';
import type { PlayCardAction } from '@/app/types/actions';
import type { CardInstance } from '@/app/types/cardInstance';
import type { BoardSlot } from '@/app/types/board';
import useGameStore from '@/app/store/gameStore';

export class InputHandler {
  onCardDrop?: (action: PlayCardAction) => void;
  onBoardCardClick?: (slot: BoardSlot, card: CardInstance) => void;

  private boardManager: BoardManager;
  private handManager: HandManager;
  private app: PIXI.Application;
  private dragTarget: CardSprite | null = null;
  private dragOffset = { x: 0, y: 0 };

  constructor(
    boardManager: BoardManager,
    handManager: HandManager,
    app: PIXI.Application,
  ) {
    this.boardManager = boardManager;
    this.handManager = handManager;
    this.app = app;

    this.bindDrag();
  }

  refreshBindings() {
    this.unbindDrag();
    this.unbindBoardClicks();
    this.bindDrag();
    this.bindBoardClicks();
  }

  destroy() {
    this.unbindDrag();
    this.unbindBoardClicks();
    this.endDragCleanup();
    this.dragTarget = null;
  }

  updateHighlight() {
    const sprite = this.dragTarget;
    if (!sprite) return;

    const w = this.app.screen.width;
    const h = this.app.screen.height;
    const globalPos = sprite.getGlobalPosition();
    const center = new PIXI.Point(
      globalPos.x + sprite.width / 2,
      globalPos.y + sprite.height / 2,
    );
    const target = this.boardManager.getSlotAtGlobal(center, w, h);
    this.boardManager.highlightSlot(target?.slot ?? null);
  }

  private bindDrag() {
    for (const sprite of this.handManager.getCardSprites()) {
      sprite.on('pointerdown', this.onPointerDown);
    }
  }

  private unbindDrag() {
    for (const sprite of this.handManager.getCardSprites()) {
      sprite.off('pointerdown', this.onPointerDown);
    }
  }

  private onPointerDown = (e: PIXI.FederatedPointerEvent) => {
    const sprite = e.currentTarget as CardSprite;
    if (!sprite) return;

    this.dragTarget = sprite;

    const mouseX = e.clientX ?? e.global.x;
    const mouseY = e.clientY ?? e.global.y;

    this.dragOffset.x = sprite.getGlobalPosition().x - mouseX;
    this.dragOffset.y = sprite.getGlobalPosition().y - mouseY;

    sprite.startDrag();
    sprite.zIndex = 1000;

    this.boardManager.clearHighlight();

    this.handManager.onDragStart?.({
      card: sprite.card,
      sprite,
      globalPoint: new PIXI.Point(mouseX, mouseY),
    });

    document.addEventListener('pointermove', this.onPointerMove);
    document.addEventListener('pointerup', this.onPointerUp);
  };

  private onPointerMove = (e: PointerEvent) => {
    const t = this.dragTarget;
    if (!t) return;

    const canvasRect = this.app.canvas.getBoundingClientRect();
    const localX = e.clientX - canvasRect.left;
    const localY = e.clientY - canvasRect.top;

    t.x = localX + this.dragOffset.x;
    t.y = localY + this.dragOffset.y;
  };

  private onPointerUp = (e: PointerEvent) => {
    const t = this.dragTarget;
    if (!t) return;

    this.endDragCleanup();

    const canvasRect = this.app.canvas.getBoundingClientRect();
    const globalPoint = new PIXI.Point(
      e.clientX - canvasRect.left,
      e.clientY - canvasRect.top,
    );

    const dropTarget = this.boardManager.getSlotAtGlobal(
      globalPoint,
      this.app.screen.width,
      this.app.screen.height,
    );

    if (dropTarget && this.isValidDropTarget(dropTarget.slot, t.card)) {
      this.boardManager.clearHighlight();

      const action: PlayCardAction = {
        type: 'DOWN_CARD',
        cardInstance: t.card,
        targetSlot: {
          lane: dropTarget.slot.lane,
          position: dropTarget.slot.position,
          owner: dropTarget.slot.owner,
        },
        owner: useGameStore.getState().playerSide,
        invoqueWay: 'NORMAL',
      };

      console.log('🃏 Play card action:', action);
      this.onCardDrop?.(action);

      this.handManager.removeSprite(t);
      t.destroy();
    } else {
      this.boardManager.clearHighlight();
      this.handManager.returnCardToHand(t);
    }

    this.dragTarget = null;
  };

  private isValidDropTarget(slot: BoardSlot, card: CardInstance): boolean {
    if (slot.owner !== useGameStore.getState().playerSide) return false;
    if (slot.cardInstance) return false;

    if (card.base.type === 'UNIT') return true;
    if (card.base.type === 'SPELL' || card.base.type === 'EQUIPMENT') {
      return slot.position === 'FRONT';
    }

    return true;
  }

  private endDragCleanup() {
    document.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('pointerup', this.onPointerUp);
  }

  private bindBoardClicks() {
    for (const { cardSprite, slot } of this.boardManager.getBoardCardSprites()) {
      cardSprite.on('pointertap', this.onBoardCardTap);
    }
  }

  private unbindBoardClicks() {
     for (const { cardSprite } of this.boardManager.getBoardCardSprites()) {
      cardSprite.off('pointertap', this.onBoardCardTap);
    }
  }

  private onBoardCardTap = (e: PIXI.FederatedPointerEvent) => {
    const sprite = e.currentTarget as CardSprite;
    if (!sprite) return;

    for (const { cardSprite, slot } of this.boardManager.getBoardCardSprites()) {
      if (cardSprite === sprite) {
        this.onBoardCardClick?.(slot, sprite.card);
        return;
      }
    }
  };

}
