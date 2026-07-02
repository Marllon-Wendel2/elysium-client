import * as PIXI from 'pixi.js';

const CARD_WIDTH = 100;
const CARD_HEIGHT = 150;
const CARD_TOP_MARGIN = 30;
const MAX_HAND_RATIO = 0.55;

export class OpponentHandManager {
  container: PIXI.Container;
  private cardBacks: PIXI.Container[] = [];
  private texture: PIXI.Texture | null = null;
  private prevCount = 0;

  constructor() {
    this.container = new PIXI.Container();
    this.loadCardBack();
  }

  private async loadCardBack() {
    try {
      this.texture = await PIXI.Assets.load('/Cards/verso.jpg');
    } catch {
      // fallback will be a graphic
    }
    this.redraw(this.prevCount, window.innerWidth, window.innerHeight);
  }

  update(handCount: number, screenWidth: number, screenHeight: number) {
    if (handCount === this.prevCount) return;
    this.prevCount = handCount;
    this.redraw(handCount, screenWidth, screenHeight);
  }

  private redraw(count: number, screenWidth: number, screenHeight: number) {
    for (const c of this.cardBacks) {
      this.container.removeChild(c);
      c.destroy({ children: true });
    }
    this.cardBacks = [];

    for (let i = 0; i < count; i++) {
      const card = new PIXI.Container();

      if (this.texture) {
        const spr = new PIXI.Sprite(this.texture);
        spr.width = CARD_WIDTH;
        spr.height = CARD_HEIGHT;
        card.addChild(spr);
      } else {
        const g = new PIXI.Graphics()
          .roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, 8)
          .fill({ color: 0x1e293b, alpha: 0.8 })
          .stroke({ width: 2, color: 0x64748b });
        card.addChild(g);
      }

      this.cardBacks.push(card);
      this.container.addChild(card);
    }

    this.positionCards(screenWidth, screenHeight);
  }

  private positionCards(screenWidth: number, screenHeight: number) {
    const count = this.cardBacks.length;
    if (count === 0) return;

    const maxHandWidth = screenWidth * MAX_HAND_RATIO;
    const totalWidth = count * CARD_WIDTH;

    const overlap =
      count > 1 && totalWidth > maxHandWidth
        ? (totalWidth - maxHandWidth) / (count - 1)
        : 0;

    const handWidth = count * CARD_WIDTH - (count - 1) * overlap;
    const startX = (screenWidth - handWidth) / 2;
    const y = CARD_TOP_MARGIN;

    this.cardBacks.forEach((card, i) => {
      card.x = startX + i * (CARD_WIDTH - overlap);
      card.y = y;
    });
  }

  reposition(screenWidth: number, screenHeight: number) {
    this.positionCards(screenWidth, screenHeight);
  }

  destroy() {
    for (const c of this.cardBacks) {
      c.destroy({ children: true });
    }
    this.cardBacks = [];
    this.container.destroy({ children: true });
  }
}
