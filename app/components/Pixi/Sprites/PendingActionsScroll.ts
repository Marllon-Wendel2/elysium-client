import * as PIXI from 'pixi.js';
import type { PlayCardAction } from '../PixiRender';
import type { PlayerView } from '@/app/types/player';

const SCROLL_WIDTH = 360;
const SCROLL_HEIGHT = 840;
const SCROLL_PADDING = 30;
const ITEM_HEIGHT = 72;
const ITEM_GAP = 8;
const POSITION_X = 20;
const POSITION_Y = 80;

const LANE_LABELS: Record<number, string> = {
  0: 'Esquerda',
  1: 'Centro',
  2: 'Direita',
};

const POSITION_LABELS: Record<string, string> = {
  FRONT: 'Frontal',
  BACK: 'Traseira',
};

const POSITION_ICONS: Record<string, string> = {
  FRONT: '⚔️',
  BACK: '🛡️',
};

const TYPE_BADGE_COLORS: Record<string, { bg: number; text: number }> = {
  UNIT: { bg: 0x1e3a5f, text: 0x60a5fa },
  SPELL: { bg: 0x3b1f5e, text: 0xc084fc },
  EQUIPMENT: { bg: 0x5c3d0a, text: 0xfbbf24 },
};

interface ActionItem {
  container: PIXI.Container;
  thumbnail: PIXI.Graphics;
  nameLabel: PIXI.Text;
  typeLabel: PIXI.Text;
  positionIcon: PIXI.Text;
  targetLabel: PIXI.Text;
  removeBtn: PIXI.Container;
  removeBtnBg: PIXI.Graphics;
  removeBtnX: PIXI.Text;
  divider: PIXI.Graphics;
  index: number;
}

export class PendingActionsScroll {
  container: PIXI.Container;
  passContainer: PIXI.Container;
  onConfirm?: () => void;
  onPass?: () => void;
  onRemoveAction?: (index: number) => void;

  private parchmentSprite: PIXI.Sprite | null = null;
  private maskGraphics: PIXI.Graphics;
  private contentContainer: PIXI.Container;
  private headerText: PIXI.Text;
  private countBadge: PIXI.Text;
  private infoBar: PIXI.Text;
  private actionsContainer: PIXI.Container;
  private confirmBtn: PIXI.Container;
  private confirmBtnBg: PIXI.Graphics;
  private confirmBtnLabel: PIXI.Text;
  private confirmBtnCheck: PIXI.Text;
  private clearBtn: PIXI.Text;
  private passBtn: PIXI.Container;
  private passBtnSprite: PIXI.Sprite | null = null;
  private emptyText: PIXI.Text;
  private emptyIcon: PIXI.Text;

  private items: ActionItem[] = [];
  private floatTime = 0;
  private baseY = POSITION_Y;
  private actions: unknown[] = [];
  private currentPhase = '';
  private currentTurn = 0;
  private currentPlayer: PlayerView | null = null;
  private isAnimating = false;
  private isContentVisible = false;
  private maskMaxHeight = SCROLL_HEIGHT - 220;

  constructor() {
    this.container = new PIXI.Container();
    this.container.x = POSITION_X;
    this.container.y = POSITION_Y;
    this.container.zIndex = 1500;
    this.container.sortableChildren = true;

    this.passContainer = new PIXI.Container();
    this.passContainer.x = POSITION_X;
    this.passContainer.zIndex = 1500;

    this.maskGraphics = new PIXI.Graphics();
    this.maskGraphics.zIndex = 1;
    this.container.addChild(this.maskGraphics);

    this.contentContainer = new PIXI.Container();
    this.contentContainer.zIndex = 2;
    this.contentContainer.mask = this.maskGraphics;
    this.container.addChild(this.contentContainer);

    this.headerText = new PIXI.Text({
      text: 'Ações Pendentes',
      style: {
        fontSize: 15,
        fill: 0x3d2b1f,
        fontFamily: 'Georgia, serif',
        fontWeight: 'bold',
      },
    });
    this.headerText.x = SCROLL_PADDING;
    this.headerText.y = 100;
    this.contentContainer.addChild(this.headerText);

    this.countBadge = new PIXI.Text({
      text: '0',
      style: {
        fontSize: 12,
        fill: 0xffffff,
        fontFamily: 'Arial',
        fontWeight: 'bold',
      },
    });
    this.countBadge.anchor.set(0.5);
    this.contentContainer.addChild(this.countBadge);

    this.infoBar = new PIXI.Text({
      text: '',
      style: {
        fontSize: 10,
        fill: 0x6b5c4d,
        fontFamily: 'Arial',
      },
    });
    this.infoBar.x = SCROLL_PADDING;
    this.infoBar.y = 122;
    this.contentContainer.addChild(this.infoBar);

    const dividerLine = new PIXI.Graphics();
    dividerLine.rect(SCROLL_PADDING, 138, SCROLL_WIDTH - SCROLL_PADDING * 2, 1)
      .fill({ color: 0xc4a882, alpha: 0.5 });
    this.contentContainer.addChild(dividerLine);

    this.actionsContainer = new PIXI.Container();
    this.actionsContainer.y = 148;
    this.contentContainer.addChild(this.actionsContainer);

    this.emptyIcon = new PIXI.Text({
      text: '🎯',
      style: { fontSize: 32, fontFamily: 'Arial' },
    });
    this.emptyIcon.anchor.set(0.5);
    this.emptyIcon.x = SCROLL_WIDTH / 2;
    this.emptyIcon.y = 340;
    this.emptyIcon.alpha = 0.4;
    this.contentContainer.addChild(this.emptyIcon);

    this.emptyText = new PIXI.Text({
      text: 'Nenhuma ação pendente',
      style: {
        fontSize: 12,
        fill: 0x8b7d6b,
        fontFamily: 'Arial',
        align: 'center',
      },
    });
    this.emptyText.anchor.set(0.5);
    this.emptyText.x = SCROLL_WIDTH / 2;
    this.emptyText.y = 380;
    this.contentContainer.addChild(this.emptyText);

    this.confirmBtn = new PIXI.Container();
    this.confirmBtn.y = SCROLL_HEIGHT - 180;
    this.confirmBtn.eventMode = 'static';
    this.confirmBtn.cursor = 'pointer';
    this.confirmBtn.zIndex = 10;
    this.container.addChild(this.confirmBtn);

    this.confirmBtnBg = new PIXI.Graphics();
    this.confirmBtn.addChild(this.confirmBtnBg);

    this.confirmBtnCheck = new PIXI.Text({
      text: '✓ ',
      style: { fontSize: 13, fill: 0xffffff, fontFamily: 'Arial', fontWeight: 'bold' },
    });
    this.confirmBtnCheck.x = SCROLL_PADDING + 10;
    this.confirmBtnCheck.y = 10;
    this.confirmBtn.addChild(this.confirmBtnCheck);

    this.confirmBtnLabel = new PIXI.Text({
      text: 'Confirmar Jogadas',
      style: { fontSize: 13, fill: 0xffffff, fontFamily: 'Arial', fontWeight: 'bold' },
    });
    this.confirmBtnLabel.x = SCROLL_PADDING + 26;
    this.confirmBtnLabel.y = 10;
    this.confirmBtn.addChild(this.confirmBtnLabel);

    this.confirmBtn.on('pointertap', () => {
      if (this.actions.length > 0) this.onConfirm?.();
    });
    this.confirmBtn.on('pointerover', () => {
      if (this.actions.length > 0) this.updateConfirmBtnStyle(true);
    });
    this.confirmBtn.on('pointerout', () => {
      this.updateConfirmBtnStyle(false);
    });

    this.clearBtn = new PIXI.Text({
      text: 'Limpar tudo',
      style: {
        fontSize: 10,
        fill: 0x8b7d6b,
        fontFamily: 'Arial',
        align: 'center',
      },
    });
    this.clearBtn.anchor.set(0.5, 0);
    this.clearBtn.x = SCROLL_WIDTH / 2;
    this.clearBtn.y = SCROLL_HEIGHT - 130;
    this.clearBtn.eventMode = 'static';
    this.clearBtn.cursor = 'pointer';
    this.clearBtn.zIndex = 10;
    this.clearBtn.on('pointertap', () => {
      this.onRemoveAction && this.clearAll();
    });
    this.clearBtn.on('pointerover', () => {
      this.clearBtn.style.fill = 0xc0392b;
    });
    this.clearBtn.on('pointerout', () => {
      this.clearBtn.style.fill = 0x8b7d6b;
    });
    this.container.addChild(this.clearBtn);

    this.passBtn = new PIXI.Container();
    this.passBtn.eventMode = 'static';
    this.passBtn.cursor = 'pointer';
    this.passBtn.visible = false;
    this.passContainer.addChild(this.passBtn);

    this.passBtn.on('pointertap', () => this.onPass?.());
    this.passBtn.on('pointerover', () => {
      if (this.passBtnSprite) this.passBtnSprite.alpha = 0.7;
    });
    this.passBtn.on('pointerout', () => {
      if (this.passBtnSprite) this.passBtnSprite.alpha = 1;
    });

    this.container.visible = false;
    this.drawConfirmButton(false);
  }

  async init() {
    try {
      const [parchmentTexture, arrowTexture] = await Promise.all([
        PIXI.Assets.load('/assets/pergaminho.png'),
        PIXI.Assets.load('/assets/seta-para-a-direita.svg'),
      ]);

      this.parchmentSprite = new PIXI.Sprite(parchmentTexture);
      this.parchmentSprite.width = SCROLL_WIDTH;
      this.parchmentSprite.height = SCROLL_HEIGHT;
      this.parchmentSprite.zIndex = 0;
      this.container.addChildAt(this.parchmentSprite, 0);

      this.passBtnSprite = new PIXI.Sprite(arrowTexture);
      this.passBtnSprite.anchor.set(0.5);
      this.passBtnSprite.width = 40;
      this.passBtnSprite.height = 40;
      this.passBtn.addChild(this.passBtnSprite);
    } catch {
      // fallback: sem pergaminho
    }
  }

  setActions(actions: unknown[], phase: string, turn: number, player: PlayerView) {
    this.actions = actions;
    this.currentPhase = phase;
    this.currentTurn = turn;
    this.currentPlayer = player;

    this.rebuildItems();
    this.updateInfoBar();
    this.updateHeader();
    this.updateConfirmButton();
  }

  private rebuildItems() {
    for (const item of this.items) {
      this.actionsContainer.removeChild(item.container);
      item.container.destroy();
    }
    this.items = [];

    const hasActions = this.actions.length > 0;
    this.emptyIcon.visible = !hasActions;
    this.emptyText.visible = !hasActions;
    this.clearBtn.visible = hasActions;

    if (!hasActions) {
      this.updateMaskHeight(220);
      return;
    }

    this.actions.forEach((action, index) => {
      const item = this.createActionItem(action, index);
      this.items.push(item);
      this.actionsContainer.addChild(item.container);
    });

    const contentHeight = 76 + this.actions.length * (ITEM_HEIGHT + ITEM_GAP) + 100;
    this.updateMaskHeight(Math.min(contentHeight, this.maskMaxHeight));
  }

  private createActionItem(action: unknown, index: number): ActionItem {
    const itemContainer = new PIXI.Container();
    itemContainer.y = index * (ITEM_HEIGHT + ITEM_GAP);
    itemContainer.eventMode = 'static';

    const act = action as Record<string, unknown>;
    const playCard = action as PlayCardAction;
    const card = playCard.cardInstance?.base;
    const target = playCard.targetSlot;

    const cardName = card?.name ?? 'Carta';
    const cardArt = card?.artUrl ?? '';
    const cardType = (card?.type as string) ?? 'UNIT';
    const laneLabel = LANE_LABELS[target?.lane] ?? `Lane ${target?.lane}`;
    const posLabel = POSITION_LABELS[target?.position] ?? target?.position;
    const posIcon = POSITION_ICONS[target?.position] ?? '❓';

    const thumbnail = new PIXI.Graphics();
    thumbnail.roundRect(0, 0, 48, 64, 4)
      .fill({ color: 0x1a1a2e, alpha: 0.8 });
    thumbnail.x = SCROLL_PADDING;
    thumbnail.y = 4;
    thumbnail.eventMode = 'none';
    itemContainer.addChild(thumbnail);

    if (cardArt) {
      const thumbSprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
      thumbSprite.width = 48;
      thumbSprite.height = 64;
      thumbSprite.x = SCROLL_PADDING;
      thumbSprite.y = 4;
      thumbSprite.eventMode = 'none';
      itemContainer.addChild(thumbSprite);

      PIXI.Assets.load(cardArt).then((texture) => {
        thumbSprite.texture = texture;
      }).catch(() => {
        const placeholder = new PIXI.Text({
          text: '🃏',
          style: { fontSize: 20, fontFamily: 'Arial' },
        });
        placeholder.anchor.set(0.5);
        placeholder.x = SCROLL_PADDING + 24;
        placeholder.y = 36;
        itemContainer.addChild(placeholder);
      });
    }

    const nameLabel = new PIXI.Text({
      text: cardName,
      style: {
        fontSize: 11,
        fill: 0x3d2b1f,
        fontFamily: 'Georgia, serif',
        fontWeight: 'bold',
      },
    });
    nameLabel.x = SCROLL_PADDING + 56;
    nameLabel.y = 6;
    itemContainer.addChild(nameLabel);

    const typeColors = TYPE_BADGE_COLORS[cardType as keyof typeof TYPE_BADGE_COLORS] || { bg: 0x333333, text: 0xcccccc };
    const typeLabel = new PIXI.Text({
      text: cardType,
      style: {
        fontSize: 8,
        fill: typeColors.text,
        fontFamily: 'Arial',
        fontWeight: 'bold',
      },
    });
    typeLabel.x = SCROLL_PADDING + 56 + nameLabel.width + 6;
    typeLabel.y = 8;
    itemContainer.addChild(typeLabel);

    const typeBg = new PIXI.Graphics();
    typeBg.roundRect(nameLabel.x + nameLabel.width + 2, 5, typeLabel.width + 8, 14, 3)
      .fill({ color: typeColors.bg, alpha: 0.6 });
    itemContainer.addChild(typeBg);
    itemContainer.removeChild(typeLabel);
    itemContainer.addChild(typeLabel);

    const posText = new PIXI.Text({
      text: `${posIcon} ${posLabel}`,
      style: {
        fontSize: 10,
        fill: 0x6b5c4d,
        fontFamily: 'Arial',
      },
    });
    posText.x = SCROLL_PADDING + 56;
    posText.y = 24;
    itemContainer.addChild(posText);

    const targetLabel = new PIXI.Text({
      text: `→ ${laneLabel} · ${posLabel}`,
      style: {
        fontSize: 9,
        fill: 0x8b7d6b,
        fontFamily: 'Arial',
        fontStyle: 'italic',
      },
    });
    targetLabel.x = SCROLL_PADDING + 56;
    targetLabel.y = 40;
    itemContainer.addChild(targetLabel);

    const removeBtn = new PIXI.Container();
    removeBtn.x = SCROLL_WIDTH - SCROLL_PADDING - 16;
    removeBtn.y = 4;
    removeBtn.eventMode = 'static';
    removeBtn.cursor = 'pointer';
    removeBtn.alpha = 0;
    itemContainer.addChild(removeBtn);

    const removeBtnBg = new PIXI.Graphics();
    removeBtnBg.circle(8, 8, 8).fill({ color: 0x4a3728, alpha: 0.6 });
    removeBtn.addChild(removeBtnBg);

    const removeBtnX = new PIXI.Text({
      text: '✕',
      style: { fontSize: 10, fill: 0xd4c4a8, fontFamily: 'Arial', fontWeight: 'bold' },
    });
    removeBtnX.anchor.set(0.5);
    removeBtnX.x = 8;
    removeBtnX.y = 8;
    removeBtn.addChild(removeBtnX);

    removeBtn.on('pointerover', () => {
      removeBtnBg.clear();
      removeBtnBg.circle(8, 8, 8).fill({ color: 0xc0392b, alpha: 0.9 });
      removeBtnX.style.fill = 0xffffff;
    });
    removeBtn.on('pointerout', () => {
      removeBtnBg.clear();
      removeBtnBg.circle(8, 8, 8).fill({ color: 0x4a3728, alpha: 0.6 });
      removeBtnX.style.fill = 0xd4c4a8;
    });
    removeBtn.on('pointertap', () => {
      this.onRemoveAction?.(index);
    });

    itemContainer.on('pointerover', () => {
      removeBtn.alpha = 1;
    });
    itemContainer.on('pointerout', () => {
      removeBtn.alpha = 0;
    });

    const divider = new PIXI.Graphics();
    divider.rect(SCROLL_PADDING, ITEM_HEIGHT - 2, SCROLL_WIDTH - SCROLL_PADDING * 2, 1)
      .fill({ color: 0xc4a882, alpha: 0.3 });
    divider.y = 4;
    itemContainer.addChild(divider);

    return {
      container: itemContainer,
      thumbnail,
      nameLabel,
      typeLabel,
      positionIcon: posText,
      targetLabel,
      removeBtn,
      removeBtnBg,
      removeBtnX,
      divider,
      index,
    };
  }

  private updateMaskHeight(height: number) {
    this.maskGraphics.clear();
    this.maskGraphics.roundRect(0, 0, SCROLL_WIDTH, height, 8)
      .fill({ color: 0xffffff });
  }

  private updateInfoBar() {
    if (!this.currentPlayer) return;
    const phaseName = this.currentPhase === 'DECLARATION' ? 'Declaração'
      : this.currentPhase === 'STANDBY' ? 'Preparação'
      : this.currentPhase;
    this.infoBar.text = `Turno ${this.currentTurn} · ${phaseName} · ${this.currentPlayer.manaAvailable}/${this.currentPlayer.totalMana} Mana`;
  }

  private updateHeader() {
    const count = this.actions.length;
    this.countBadge.text = String(count);
    this.countBadge.x = SCROLL_WIDTH - SCROLL_PADDING - 10;
    this.countBadge.y = 106;

    if (count > 0) {
      const badgeBg = new PIXI.Graphics();
      badgeBg.circle(0, 0, 10).fill({ color: 0x059669, alpha: 0.9 });
      this.countBadge.parent?.addChildAt(badgeBg, 0);
      const oldBg = this.container.children.find((c, i) => i > 2 && c !== this.contentContainer && c !== this.maskGraphics && c !== this.parchmentSprite && (c as PIXI.Graphics)._fillStyle?.color === 0x059669);
      if (oldBg) oldBg.destroy();
    }
  }

  private updateConfirmButton(hover = false) {
    const hasActions = this.actions.length > 0;
    this.drawConfirmButton(hasActions, hover);
    this.confirmBtn.eventMode = hasActions ? 'static' : 'none';
    this.confirmBtn.cursor = hasActions ? 'pointer' : 'default';
    this.passBtn.visible = !hasActions;
    this.passBtn.eventMode = hasActions ? 'none' : 'static';
    this.passBtn.cursor = hasActions ? 'default' : 'pointer';
  }

  private drawConfirmButton(hasActions: boolean, hover: boolean) {
    this.confirmBtnBg.clear();
    const color = hasActions
      ? (hover ? 0x047857 : 0x059669)
      : 0x333333;
    const alpha = hasActions ? 1 : 0.5;
    this.confirmBtnBg.roundRect(SCROLL_PADDING, 0, SCROLL_WIDTH - SCROLL_PADDING * 2, 36, 8)
      .fill({ color, alpha });

    this.confirmBtnLabel.style.fill = hasActions ? 0xffffff : 0x666666;
    this.confirmBtnCheck.style.fill = hasActions ? 0xffffff : 0x666666;
  }

  private updateConfirmBtnStyle(hover: boolean) {
    this.drawConfirmButton(this.actions.length > 0, hover);
  }

  private clearAll() {
    for (let i = this.actions.length - 1; i >= 0; i--) {
      this.onRemoveAction?.(i);
    }
  }

  tick(_dt: number) {
    if (!this.container.visible || this.isAnimating) return;
    this.floatTime += 0.016;
    this.container.y = this.baseY + Math.sin(this.floatTime * 1.5) * 3;
  }

  async showUnroll() {
    if (this.isAnimating || this.isContentVisible) return;
    this.isAnimating = true;

    this.container.visible = true;
    this.container.alpha = 1;
    this.maskGraphics.scale.y = 0;
    this.maskGraphics.y = 0;

    const duration = 400;
    const start = performance.now();

    await new Promise<void>((resolve) => {
      const animate = () => {
        const elapsed = performance.now() - start;
        const t = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        this.maskGraphics.scale.y = eased;
        if (t < 1) {
          requestAnimationFrame(animate);
        } else {
          this.maskGraphics.scale.y = 1;
          this.isAnimating = false;
          this.isContentVisible = true;
          resolve();
        }
      };
      requestAnimationFrame(animate);
    });
  }

  async hideRoll() {
    if (this.isAnimating || !this.isContentVisible) return;
    this.isAnimating = true;

    const duration = 300;
    const start = performance.now();

    await new Promise<void>((resolve) => {
      const animate = () => {
        const elapsed = performance.now() - start;
        const t = Math.min(elapsed / duration, 1);
        const eased = t * t;
        this.maskGraphics.scale.y = 1 - eased;
        if (t < 1) {
          requestAnimationFrame(animate);
        } else {
          this.maskGraphics.scale.y = 0;
          this.container.visible = false;
          this.isAnimating = false;
          this.isContentVisible = false;
          resolve();
        }
      };
      requestAnimationFrame(animate);
    });
  }

  setVisible(visible: boolean) {
    if (visible && !this.container.visible && !this.isAnimating) {
      this.showUnroll();
    } else if (!visible && this.container.visible && !this.isAnimating) {
      this.hideRoll();
    }
  }

  hasContent(): boolean {
    return this.actions.length > 0;
  }

  destroy() {
    for (const item of this.items) {
      item.container.destroy();
    }
    this.items = [];
    this.container.destroy({ children: true });
  }
}
