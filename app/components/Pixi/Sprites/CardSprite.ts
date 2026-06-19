import * as PIXI from 'pixi.js';
import type { CardInstance } from '@/app/types/game';

const CLASS_BORDER_COLORS: Record<string, number> = {
  citizen: 0x60a5fa,
  army: 0xef4444,
  mage: 0xa855f7,
  noble: 0xfacc15,
  spell: 0x22d3ee,
  equipment: 0xf59e0b,
};

const HOVER_SCALE = 1.15;
const HOVER_LIFT = -20;
const HOVER_GLOW_COLOR = 0xfbbf24;

export class CardSprite extends PIXI.Container {
  card: CardInstance;
  private artSprite: PIXI.Sprite | null = null;
  private bg: PIXI.Graphics;
  private statsContainer: PIXI.Container;
  private glowGraphics: PIXI.Graphics;
  private cardWidth: number;
  private cardHeight: number;
  private isHovered = false;
  private baseY = 0;
  private borderColor: number;
  private _dragging = false;
  private _animating = false;
  private targetScaleX = 1;
  private targetScaleY = 1;
  private targetY = 0;

  constructor(card: CardInstance, width: number, height: number) {
    super();

    this.card = card;
    this.cardWidth = width;
    this.cardHeight = height;
    this.borderColor = CLASS_BORDER_COLORS[card.base.class] ?? 0x9ca3af;

    this.bg = new PIXI.Graphics();
    this.addChild(this.bg);

    this.glowGraphics = new PIXI.Graphics();
    this.addChild(this.glowGraphics);

    this.statsContainer = new PIXI.Container();
    this.addChild(this.statsContainer);

    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.hitArea = new PIXI.Rectangle(0, 0, width, height);

    this.on('pointerover', this.onHoverIn);
    this.on('pointerout', this.onHoverOut);

    this.build(width, height);
  }

  setDragging(value: boolean) {
    this._dragging = value;
    if (value) {
      this.isHovered = false;
      this.clearGlow();
      this.targetScaleX = 1;
      this.targetScaleY = 1;
      this._animating = true;
    }
  }

  private onHoverIn = () => {
    if (this._dragging) return;
    this.isHovered = true;
    this.baseY = this.y;
    this.drawGlow();
    this.computeTarget();
  };

  private onHoverOut = () => {
    if (this._dragging) return;
    this.isHovered = false;
    this.clearGlow();
    this.computeTarget();
  };

  private drawGlow() {
    this.glowGraphics.clear();
    this.glowGraphics
      .roundRect(-4, -4, this.cardWidth + 8, this.cardHeight + 8, 10)
      .fill({ color: HOVER_GLOW_COLOR, alpha: 0.25 })
      .stroke({ width: 3, color: HOVER_GLOW_COLOR, alpha: 0.8 });
  }

  private clearGlow() {
    this.glowGraphics.clear();
  }

  private computeTarget() {
    this.targetScaleX = this.isHovered ? HOVER_SCALE : 1;
    this.targetScaleY = this.isHovered ? HOVER_SCALE : 1;
    this.targetY = this.isHovered ? this.baseY + HOVER_LIFT : this.baseY;
    this._animating = true;
  }

  tick(dt: number) {
    if (!this._animating) return;

    const speed = 0.15 * dt;
    this.scale.x += (this.targetScaleX - this.scale.x) * speed;
    this.scale.y += (this.targetScaleY - this.scale.y) * speed;
    this.y += (this.targetY - this.y) * speed;

    const scaleDone = Math.abs(this.scale.x - this.targetScaleX) < 0.005;
    const yDone = Math.abs(this.y - this.targetY) < 0.5;

    if (scaleDone && yDone) {
      this.scale.x = this.targetScaleX;
      this.scale.y = this.targetScaleY;
      this.y = this.targetY;
      this._animating = false;
    }
  }

  setBaseY(y: number) {
    this.baseY = y;
  }

  getBaseY(): number {
    return this.baseY;
  }

  startDrag() {
    this.setDragging(true);
    this.alpha = 0.9;
    this.zIndex = 1000;
  }

  endDrag() {
    this.alpha = 1;
    this.zIndex = 0;
    this._dragging = false;
  }

  private async build(width: number, height: number) {
    this.bg
      .roundRect(0, 0, width, height, 8)
      .fill({ color: 0x000000, alpha: 0.4 })
      .stroke({ width: 2, color: this.borderColor });

    if (this.card.base.artUrl) {
      try {
        const texture = await PIXI.Assets.load(this.card.base.artUrl);
        this.artSprite = new PIXI.Sprite(texture);
        this.artSprite.width = width;
        this.artSprite.height = height;

        const mask = new PIXI.Graphics()
          .roundRect(0, 0, width, height, 8)
          .fill({ color: 0xffffff });
        this.artSprite.mask = mask;

        this.addChildAt(mask, 0);
        this.addChildAt(this.artSprite, 0);
      } catch {
        // arte indisponivel, mantem fundo escuro
      }
    }

    this.buildStats(width, height);
  }

  private buildStats(width: number, height: number) {
    const statsBg = new PIXI.Graphics()
      .roundRect(0, height - 22, width, 22, 0)
      .fill({ color: 0x000000, alpha: 0.75 });

    this.statsContainer.addChild(statsBg);

    const attackText = new PIXI.Text({
      text: `⚔${this.card.state.currentAttack}`,
      style: { fontSize: 11, fill: 0xf87171, fontWeight: 'bold', fontFamily: 'Arial' },
    });
    attackText.x = 4;
    attackText.y = height - 19;
    this.statsContainer.addChild(attackText);

    const lifeText = new PIXI.Text({
      text: `♥${this.card.state.currentLife}`,
      style: { fontSize: 11, fill: 0x34d399, fontWeight: 'bold', fontFamily: 'Arial' },
    });
    lifeText.anchor.set(1, 0);
    lifeText.x = width - 4;
    lifeText.y = height - 19;
    this.statsContainer.addChild(lifeText);
  }

  updateCard(card: CardInstance, width: number, height: number) {
    this.card = card;

    const attackText = this.statsContainer.children.find(
      (c) => c instanceof PIXI.Text && (c as PIXI.Text).text.startsWith('⚔')
    ) as PIXI.Text | undefined;
    const lifeText = this.statsContainer.children.find(
      (c) => c instanceof PIXI.Text && (c as PIXI.Text).text.startsWith('♥')
    ) as PIXI.Text | undefined;

    if (attackText) attackText.text = `⚔${card.state.currentAttack}`;
    if (lifeText) lifeText.text = `♥${card.state.currentLife}`;
  }
}
