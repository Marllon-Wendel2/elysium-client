import * as PIXI from 'pixi.js';
import useGameStore from '@/app/store/gameStore';
import type { BoardSlot, CardInstance } from '@/app/types/game';
import { BoardManager } from './Managers/BoardManager';
import { HandManager } from './Managers/HandManager';
import { DeckManager } from './Managers/DeckManager';
import { OpponentHandManager } from './Managers/OpponentHandManager';
import type { SlotDropTarget } from './Managers/BoardManager';

export interface PlayCardAction {
  type: 'DOWN_CARD';
  cardInstance: CardInstance;
  targetSlot: { lane: number; position: string; owner: string };
  owner: string;
  invoqueWay: string;
}

export class GameRenderer {
  app: PIXI.Application;

  backgroundLayer = new PIXI.Container();
  boardLayer = new PIXI.Container();
  handLayer = new PIXI.Container();
  deckLayer = new PIXI.Container();
  hudLayer = new PIXI.Container();
  effectLayer = new PIXI.Container();

  private boardManager: BoardManager;
  private handManager: HandManager;
  private deckManager: DeckManager;
  private opponentHandManager: OpponentHandManager;
  private unsubscribers: (() => void)[] = [];
  private prevBoardSlots: BoardSlot[] = [];
  private prevHand: CardInstance[] = [];
  private destroyed = false;
  private resizeObserver: ResizeObserver | null = null;
  private container: HTMLDivElement;
  private onPlayCard?: (action: PlayCardAction) => void;
  private currentDropTarget: SlotDropTarget | null = null;
  private dragCardSprite: PIXI.Container | null = null;

  constructor(container: HTMLDivElement, onPlayCard?: (action: PlayCardAction) => void) {
    this.container = container;
    this.onPlayCard = onPlayCard;

    this.boardManager = new BoardManager();
    this.handManager = new HandManager();
    this.deckManager = new DeckManager();
    this.opponentHandManager = new OpponentHandManager();

    this.app = new PIXI.Application();

    this.setupDragDrop();
  }

  private setupDragDrop() {
    this.handManager.onDragStart = ({ sprite }) => {
      this.dragCardSprite = sprite;
      this.boardManager.clearHighlight();
    };

    this.handManager.onDragEnd = ({ card, sprite, globalPoint }) => {
      const w = this.app.screen.width;
      const h = this.app.screen.height;

      const dropTarget = this.boardManager.getSlotAtGlobal(globalPoint, w, h);

      if (dropTarget && this.isValidDropTarget(dropTarget, card)) {
        this.boardManager.clearHighlight();
        this.shakeBoard();

        const action: PlayCardAction = {
          type: 'DOWN_CARD',
          cardInstance: card,
          targetSlot: {
            lane: dropTarget.slot.lane,
            position: dropTarget.slot.position,
            owner: dropTarget.slot.owner,
          },
          owner: useGameStore.getState().playerSide,
          invoqueWay: 'NORMAL',
        };

        console.log('🃏 Play card action:', action);
        this.onPlayCard?.(action);

        this.handManager.removeDraggingFromHand();
        sprite.destroy();
      } else {
        this.boardManager.clearHighlight();
        this.handManager.returnCardToHand(sprite);
      }

      this.dragCardSprite = null;
      this.currentDropTarget = null;
    };
  }

  private isValidDropTarget(target: SlotDropTarget, card: CardInstance): boolean {
    const slot = target.slot;

    if (slot.owner !== useGameStore.getState().playerSide) return false;
    if (slot.cardInstance) return false;

    if (card.base.type === 'UNIT') {
      return true;
    }

    if (card.base.type === 'SPELL' || card.base.type === 'EQUIPMENT') {
      return slot.position === 'FRONT';
    }

    return true;
  }

  private shakeBoard() {
    const layer = this.boardLayer;
    const duration = 8;
    const intensity = 6;
    let elapsed = 0;
    const originalX = layer.x;

    const shake = () => {
      elapsed++;
      if (elapsed > duration) {
        layer.x = originalX;
        this.app.ticker.remove(shake);
        return;
      }
      const progress = elapsed / duration;
      const dampening = 1 - progress;
      layer.x = originalX + (Math.random() * 2 - 1) * intensity * dampening;
    };

    this.app.ticker.add(shake);
  }

  public async initialize() {
    await this.app.init({
      backgroundAlpha: 0,
      antialias: true,
    });

    if (this.destroyed) return;

    this.resizeCanvas();
    this.container.appendChild(this.app.canvas);

    this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
    this.resizeObserver.observe(this.container);

    this.app.stage.addChild(this.backgroundLayer);
    this.app.stage.addChild(this.boardLayer);
    this.app.stage.addChild(this.handLayer);
    this.app.stage.addChild(this.deckLayer);
    this.app.stage.addChild(this.effectLayer);
    this.app.stage.addChild(this.hudLayer);

    this.boardLayer.addChild(this.boardManager.container);
    this.handLayer.addChild(this.handManager.container);
    this.deckLayer.addChild(this.deckManager.container);
    this.handLayer.addChild(this.opponentHandManager.container);

    this.handManager.setApp(this.app);

    await this.createBackground();

    if (this.destroyed) return;

    this.app.ticker.add(this.tick);
    this.subscribeToStore();
    this.syncFromStore();
  }

  private tick = (ticker: PIXI.Ticker) => {
    const dt = ticker.deltaTime;
    this.handManager.tick(dt);

    const sprite = this.handManager.getDraggingSprite();
    if (sprite) {
      const w = this.app.screen.width;
      const h = this.app.screen.height;
      const globalPos = sprite.getGlobalPosition();
      const center = new PIXI.Point(globalPos.x + sprite.width / 2, globalPos.y + sprite.height / 2);
      const target = this.boardManager.getSlotAtGlobal(center, w, h);

      if (target !== this.currentDropTarget) {
        this.currentDropTarget = target;
        this.boardManager.highlightSlot(target?.slot ?? null);
      }
    }
  };

  private resizeCanvas() {
    const { width, height } = this.container.getBoundingClientRect();
    if (width === 0 || height === 0) return;

    this.app.renderer.resize(width, height);

    const bg = this.backgroundLayer.children[0] as PIXI.Sprite | undefined;
    if (bg) {
      bg.width = width;
      bg.height = height;
    }

    const state = useGameStore.getState();
    if (state.board.slots.length > 0) {
      this.boardManager.rebuild(state.board.slots, width, height);
    }
    if (state.player.hand.length > 0) {
      this.handManager.rebuild(state.player.hand, width, height);
    }
    this.deckManager.update(state.player.deckCount, state.opponent.deckCount, width, height);
    this.opponentHandManager.update(state.opponent.handCount, width, height);
  }

  private async createBackground() {
    const texture = await PIXI.Assets.load('/Cards/bord.jpg');
    const bg = new PIXI.Sprite(texture);
    bg.width = this.app.screen.width;
    bg.height = this.app.screen.height;
    this.backgroundLayer.addChild(bg);
  }

  private subscribeToStore() {
    const unsub = useGameStore.subscribe((state) => {
      const w = this.app.screen.width;
      const h = this.app.screen.height;

      const boardChanged =
        state.board.slots !== this.prevBoardSlots &&
        JSON.stringify(state.board.slots) !== JSON.stringify(this.prevBoardSlots);

      if (boardChanged) {
        this.prevBoardSlots = state.board.slots;

        if (this.boardManager.container.children.length === 0) {
          this.boardManager.rebuild(state.board.slots, w, h);
        } else {
          this.boardManager.update(state.board.slots, w, h);
        }
      }

      const handChanged =
        state.player.hand !== this.prevHand &&
        JSON.stringify(state.player.hand) !== JSON.stringify(this.prevHand);

      if (handChanged) {
        this.prevHand = state.player.hand;

        if (this.handManager.container.children.length === 0) {
          this.handManager.rebuild(state.player.hand, w, h);
        } else {
          this.handManager.update(state.player.hand, w, h);
        }
      }

      this.deckManager.update(state.player.deckCount, state.opponent.deckCount, w, h);
      this.opponentHandManager.update(state.opponent.handCount, w, h);
    });

    this.unsubscribers.push(unsub);
  }

  private syncFromStore() {
    const state = useGameStore.getState();
    const w = this.app.screen.width;
    const h = this.app.screen.height;

    this.prevBoardSlots = state.board.slots;
    this.prevHand = state.player.hand;

    if (state.board.slots.length > 0) {
      this.boardManager.rebuild(state.board.slots, w, h);
    }

    if (state.player.hand.length > 0) {
      this.handManager.rebuild(state.player.hand, w, h);
    }

    this.deckManager.update(state.player.deckCount, state.opponent.deckCount, w, h);
    this.opponentHandManager.update(state.opponent.handCount, w, h);
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;

    // this.app.ticker.remove(this.tick);
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;

    for (const unsub of this.unsubscribers) unsub();
    this.unsubscribers = [];

    this.boardManager.destroy();
    this.handManager.destroy();
    this.deckManager.destroy();
    this.opponentHandManager.destroy();
  }
}
