import * as PIXI from 'pixi.js';
import useGameStore from '@/app/store/gameStore';
import type { CardInstance } from '@/app/types/cardInstance';
import type { BoardSlot } from '@/app/types/board';
import { BoardManager } from '../../Managers/BoardManager';
import { HandManager } from '../../Managers/HandManager';
import { DeckManager } from '../../Managers/DeckManager';
import { OpponentHandManager } from '../../Managers/OpponentHandManager';
import { InputHandler } from '../../renderer/input/InputHandler';

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
  private inputHandler: InputHandler;
  private unsubscribers: (() => void)[] = [];
  private prevBoardSlots: BoardSlot[] = [];
  private prevHand: CardInstance[] = [];
  private prevPlayerSide: import('@/app/types/board').PlayerOwner = 'PLAYERONE';
  private destroyed = false;
  private resizeObserver: ResizeObserver | null = null;
  private container: HTMLDivElement;
  private onPlayCard?: (action: PlayCardAction) => void;
  private onBoardCardClick?: (slot: BoardSlot, card: CardInstance) => void;


  constructor(
    container: HTMLDivElement,
    onPlayCard?: (action: PlayCardAction) => void,
    onBoardCardClick?: (slot: BoardSlot, card: CardInstance) => void,
  ) {
    this.container = container;
    this.onPlayCard = onPlayCard;

    this.boardManager = new BoardManager();
    this.handManager = new HandManager();
    this.deckManager = new DeckManager();
    this.opponentHandManager = new OpponentHandManager();

    this.app = new PIXI.Application();

    this.inputHandler = new InputHandler(this.boardManager, this.handManager, this.app);
    this.inputHandler.onCardDrop = (action) => {
      this.onPlayCard?.(action);
    };
    this.onBoardCardClick = onBoardCardClick;

    this.inputHandler.onBoardCardClick = (slot, card) => {
      this.onBoardCardClick?.(slot, card);
    }
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

    await this.createBackground();

    if (this.destroyed) return;

    this.app.ticker.add(this.tick);
    this.subscribeToStore();
    this.syncFromStore();
  }

  private tick = (ticker: PIXI.Ticker) => {
    const dt = ticker.deltaTime;
    this.handManager.tick(dt);
    this.inputHandler.updateHighlight();
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
    this.boardManager.setPlayerSide(state.playerSide);
    if (state.board.slots.length > 0) {
      this.boardManager.rebuild(state.board.slots, width, height);
    }
    if (state.player.hand.length > 0) {
      this.handManager.rebuild(state.player.hand, width, height);
      this.inputHandler.refreshBindings();
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

      if (state.playerSide !== this.prevPlayerSide) {
        this.prevPlayerSide = state.playerSide;
        this.boardManager.setPlayerSide(state.playerSide);
        this.boardManager.rebuild(state.board.slots, w, h);
      }

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

        this.inputHandler.refreshBindings();
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

    this.prevPlayerSide = state.playerSide;
    this.boardManager.setPlayerSide(state.playerSide);
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

    this.inputHandler.refreshBindings();
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;

    this.inputHandler.destroy();
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
