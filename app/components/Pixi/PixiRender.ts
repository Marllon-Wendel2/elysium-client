import * as PIXI from 'pixi.js';
import useGameStore from '@/app/store/gameStore';
import type { CardInstance } from '@/app/types/cardInstance';
import type { BoardSlot } from '@/app/types/board';
import { BoardManager } from '../../Managers/BoardManager';
import { HandManager } from '../../Managers/HandManager';
import { DeckManager } from '../../Managers/DeckManager';
import { OpponentHandManager } from '../../Managers/OpponentHandManager';
import { InputHandler } from '../../renderer/input/InputHandler';
import { ActionMenu } from './Sprites/ActionMenu';
import { PendingActionsScroll } from './Sprites/PendingActionsScroll';
import { getSharedTooltip } from './Sprites/CardTooltip';
import { animations } from '../../renderer/animations/AnimationEngine';

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
  private actionMenu: ActionMenu;
  private pendingScroll: PendingActionsScroll;
  private unsubscribers: (() => void)[] = [];
  private prevBoardSlots: BoardSlot[] = [];
  private prevHand: CardInstance[] = [];
  private prevPendingActions: unknown[] = [];
  private prevPlayerSide: import('@/app/types/board').PlayerOwner = 'PLAYERONE';
  private prevPhase = '';
  private prevTurn = 0;
  private destroyed = false;
  private resizeObserver: ResizeObserver | null = null;
  private container: HTMLDivElement;
  private topVideo: PIXI.Sprite | null = null;
  private bottomVideo: PIXI.Sprite | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private onPlayCard?: (action: PlayCardAction) => void;
  private onActionPerformed?: (actionId: string, slot: BoardSlot, card: CardInstance) => void;
  private onConfirmCallback?: () => void;
  private onPassCallback?: () => void;
  private onRemoveActionCallback?: (index: number) => void;



  constructor(
    container: HTMLDivElement,
    onPlayCard?: (action: PlayCardAction) => void,
    onActionPerformed?: (actionId: string, slot: BoardSlot, card: CardInstance) => void,
  ) {
    this.container = container;
    this.onPlayCard = onPlayCard;

    this.boardManager = new BoardManager();
    this.handManager = new HandManager();
    this.deckManager = new DeckManager();
    this.opponentHandManager = new OpponentHandManager();
    this.actionMenu = new ActionMenu();
    this.pendingScroll = new PendingActionsScroll();

    this.app = new PIXI.Application();

    this.inputHandler = new InputHandler(this.boardManager, this.handManager, this.app, this.actionMenu);
    this.inputHandler.onCardDrop = (action) => {
      this.onPlayCard?.(action);
    };
    this.inputHandler.onCardDropped = (card) => {
      const store = useGameStore.getState();
      const newHand = store.player.hand.filter((c) => c.instanceId !== card.instanceId);
      useGameStore.setState({
        player: { ...store.player, hand: newHand },
      });
    };
    this.onActionPerformed = onActionPerformed;

    this.inputHandler.onActionPerformed = (actionId, slot, card) => {
      this.onActionPerformed?.(actionId, slot, card);
    };

    this.pendingScroll.onConfirm = () => {
      this.onConfirmCallback?.();
    };
    this.pendingScroll.onPass = () => {
      this.onPassCallback?.();
    };
    this.pendingScroll.onRemoveAction = (index) => {
      this.onRemoveActionCallback?.(index);
    };

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
    this.hudLayer.addChild(this.actionMenu.container);
    this.hudLayer.addChild(this.pendingScroll.container);
    this.hudLayer.addChild(this.pendingScroll.passContainer);

    const tooltip = getSharedTooltip();
    this.hudLayer.addChild(tooltip);

    await this.createBackground();
    await this.pendingScroll.init();

    if (this.destroyed) return;

    this.app.ticker.add(this.tick);
    this.subscribeToStore();
    this.syncFromStore();
  }

  private tick = (ticker: PIXI.Ticker) => {
    const dt = ticker.deltaTime;
    animations.update(dt);
    this.inputHandler.updateHighlight();
    this.pendingScroll.tick(dt);
  };

  private resizeCanvas() {
    const { width, height } = this.container.getBoundingClientRect();
    if (width === 0 || height === 0) return;

    this.app.renderer.resize(width, height);

    const tooltip = getSharedTooltip();
    tooltip.setScreenSize(width, height);

    if (this.topVideo && this.bottomVideo) {
      const halfH = height / 2;
      this.topVideo.width = width;
      this.topVideo.height = halfH;
      this.topVideo.scale.y = -1;
      this.topVideo.y = halfH;
      this.bottomVideo.width = width;
      this.bottomVideo.height = halfH;
      this.bottomVideo.y = halfH;
    }

    this.pendingScroll.passContainer.x = width / 2;
    this.pendingScroll.passContainer.y = height - 280;

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
    const video = document.createElement('video');
    video.src = '/Background/BoardAnimation.mp4';
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    await video.play().catch(() => {});
    this.videoElement = video;

    const source = new PIXI.VideoSource({ resource: video });
    const texture = new PIXI.Texture({ source });

    const w = this.app.screen.width;
    const h = this.app.screen.height;
    const halfH = h / 2;

    this.bottomVideo = new PIXI.Sprite(texture);
    this.bottomVideo.width = w;
    this.bottomVideo.height = halfH;
    this.bottomVideo.y = halfH;

    this.topVideo = new PIXI.Sprite(texture);
    this.topVideo.width = w;
    this.topVideo.height = halfH;
    this.topVideo.scale.y = -1;
    this.topVideo.y = halfH;

    this.backgroundLayer.addChild(this.topVideo);
    this.backgroundLayer.addChild(this.bottomVideo);
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

        this.inputHandler.refreshBindings();
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

      const pendingChanged =
        state.pendingActions !== this.prevPendingActions &&
        JSON.stringify(state.pendingActions) !== JSON.stringify(this.prevPendingActions);

      if (pendingChanged || state.phase !== this.prevPhase || state.turn !== this.prevTurn) {
        this.prevPendingActions = state.pendingActions;
        this.prevPhase = state.phase;
        this.prevTurn = state.turn;

        this.pendingScroll.setActions(
          state.pendingActions,
          state.phase,
          state.turn,
          state.player,
        );

        const shouldShow = state.phase === 'DECLARATION' || state.phase === 'STANDBY';
        const hasActions = state.pendingActions.length > 0;
        this.pendingScroll.setVisible(shouldShow && hasActions);
        this.pendingScroll.passContainer.visible = shouldShow;
      }
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

    this.pendingScroll.setActions(
      state.pendingActions,
      state.phase,
      state.turn,
      state.player,
    );

    const shouldShow = state.phase === 'DECLARATION' || state.phase === 'STANDBY';
    const hasActions = state.pendingActions.length > 0;
    if (shouldShow && hasActions) {
      this.pendingScroll.showUnroll();
    }
    this.pendingScroll.passContainer.visible = shouldShow;
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;

    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.src = '';
      this.videoElement.load();
      this.videoElement = null;
    }
    this.topVideo = null;
    this.bottomVideo = null;

    this.inputHandler.destroy();
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;

    for (const unsub of this.unsubscribers) unsub();
    this.unsubscribers = [];

    this.boardManager.destroy();
    this.handManager.destroy();
    this.deckManager.destroy();
    this.opponentHandManager.destroy();
    this.pendingScroll.destroy();
  }

  setOnConfirmCallback(cb: () => void) {
    this.onConfirmCallback = cb;
  }

  setOnPassCallback(cb: () => void) {
    this.onPassCallback = cb;
  }

  setOnRemoveActionCallback(cb: (index: number) => void) {
    this.onRemoveActionCallback = cb;
  }
}
