import * as PIXI from 'pixi.js';
import type { CardInstance } from '@/app/types/cardInstance';

const TOOLTIP_WIDTH = 220;
const TOOLTIP_PADDING = 10;
const BG_COLOR = 0x1a1a2e;
const BORDER_COLOR = 0xfbbf24;
const TEXT_COLOR = 0xe2e8f0;
const LABEL_COLOR = 0x94a3b8;
const ACCENT_COLOR = 0xfbbf24;

let _sharedTooltip: CardTooltip | null = null;

export function getSharedTooltip(): CardTooltip {
  if (!_sharedTooltip) {
    _sharedTooltip = new CardTooltip();
  }
  return _sharedTooltip;
}

const STYLE_NAME = new PIXI.TextStyle({
  fontSize: 14,
  fontWeight: 'bold',
  fill: ACCENT_COLOR,
  fontFamily: 'Arial',
  wordWrap: true,
  wordWrapWidth: TOOLTIP_WIDTH - TOOLTIP_PADDING * 2,
});

const STYLE_META = new PIXI.TextStyle({
  fontSize: 10,
  fill: LABEL_COLOR,
  fontFamily: 'Arial',
  wordWrap: true,
  wordWrapWidth: TOOLTIP_WIDTH - TOOLTIP_PADDING * 2,
});

const STYLE_DESC = new PIXI.TextStyle({
  fontSize: 11,
  fill: TEXT_COLOR,
  fontFamily: 'Arial',
  wordWrap: true,
  wordWrapWidth: TOOLTIP_WIDTH - TOOLTIP_PADDING * 2,
  lineHeight: 14,
});

const STYLE_STAT = new PIXI.TextStyle({
  fontSize: 11,
  fill: TEXT_COLOR,
  fontFamily: 'Arial',
  fontWeight: 'bold',
});

const STYLE_ABILITY = new PIXI.TextStyle({
  fontSize: 10,
  fill: 0x60a5fa,
  fontFamily: 'Arial',
  fontStyle: 'italic',
  wordWrap: true,
  wordWrapWidth: TOOLTIP_WIDTH - TOOLTIP_PADDING * 2,
});

export class CardTooltip extends PIXI.Container {
  private bg: PIXI.Graphics;
  private contentContainer: PIXI.Container;
  private screenWidth = 0;
  private screenHeight = 0;

  constructor() {
    super();
    this.visible = false;
    this.zIndex = 9999;

    this.bg = new PIXI.Graphics();
    this.addChild(this.bg);

    this.contentContainer = new PIXI.Container();
    this.addChild(this.contentContainer);
  }

  setScreenSize(w: number, h: number) {
    this.screenWidth = w;
    this.screenHeight = h;
  }

  show(card: CardInstance, anchorX: number, anchorY: number) {
    this.contentContainer.removeChildren();
    this.buildContent(card);

    const totalHeight = this.contentContainer.height + TOOLTIP_PADDING * 2;

    this.bg.clear();
    this.bg
      .roundRect(0, 0, TOOLTIP_WIDTH, totalHeight, 6)
      .fill({ color: BG_COLOR, alpha: 0.95 })
      .stroke({ width: 1, color: BORDER_COLOR, alpha: 0.8 });

    let tx = anchorX + 12;
    let ty = anchorY - totalHeight / 2;

    if (tx + TOOLTIP_WIDTH > this.screenWidth - 10) {
      tx = anchorX - TOOLTIP_WIDTH - 12;
    }
    if (ty < 10) ty = 10;
    if (ty + totalHeight > this.screenHeight - 10) {
      ty = this.screenHeight - totalHeight - 10;
    }

    this.x = tx;
    this.y = ty;
    this.visible = true;
  }

  hide() {
    this.visible = false;
    this.contentContainer.removeChildren();
  }

  private buildContent(card: CardInstance) {
    const base = card.base;
    const state = card.state;
    let y = TOOLTIP_PADDING;

    const nameText = new PIXI.Text({ text: base.name, style: STYLE_NAME });
    nameText.x = TOOLTIP_PADDING;
    nameText.y = y;
    this.contentContainer.addChild(nameText);
    y += nameText.height + 4;

    const metaParts = [base.type, base.class, base.rarity].filter(Boolean);
    const metaText = new PIXI.Text({ text: metaParts.join(' | '), style: STYLE_META });
    metaText.x = TOOLTIP_PADDING;
    metaText.y = y;
    this.contentContainer.addChild(metaText);
    y += metaText.height + 2;

    const manaText = new PIXI.Text({
      text: `Mana: ${base.mana}  |  Energia: ${base.energy}`,
      style: STYLE_META,
    });
    manaText.x = TOOLTIP_PADDING;
    manaText.y = y;
    this.contentContainer.addChild(manaText);
    y += manaText.height + 6;

    const divider1 = new PIXI.Graphics()
      .rect(TOOLTIP_PADDING, y, TOOLTIP_WIDTH - TOOLTIP_PADDING * 2, 1)
      .fill({ color: BORDER_COLOR, alpha: 0.3 });
    this.contentContainer.addChild(divider1);
    y += 7;

    if (base.description) {
      const descText = new PIXI.Text({ text: base.description, style: STYLE_DESC });
      descText.x = TOOLTIP_PADDING;
      descText.y = y;
      this.contentContainer.addChild(descText);
      y += descText.height + 6;
    }

    const divider2 = new PIXI.Graphics()
      .rect(TOOLTIP_PADDING, y, TOOLTIP_WIDTH - TOOLTIP_PADDING * 2, 1)
      .fill({ color: BORDER_COLOR, alpha: 0.3 });
    this.contentContainer.addChild(divider2);
    y += 7;

    const statsRow = new PIXI.Container();
    const stats = [
      { label: 'ATK', value: state.currentAttack, color: 0xf87171 },
      { label: 'HP', value: state.currentLife, color: 0x34d399 },
      { label: 'Range', value: base.range, color: 0x60a5fa },
    ];
    let sx = 0;
    for (const s of stats) {
      const t = new PIXI.Text({
        text: `${s.label}: ${s.value}`,
        style: new PIXI.TextStyle({ ...STYLE_STAT, fill: s.color }),
      });
      t.x = sx;
      statsRow.addChild(t);
      sx += t.width + 14;
    }
    statsRow.x = TOOLTIP_PADDING;
    statsRow.y = y;
    this.contentContainer.addChild(statsRow);
    y += 20;

    if (base.ability && base.ability.length > 0) {
      const divider3 = new PIXI.Graphics()
        .rect(TOOLTIP_PADDING, y, TOOLTIP_WIDTH - TOOLTIP_PADDING * 2, 1)
        .fill({ color: BORDER_COLOR, alpha: 0.3 });
      this.contentContainer.addChild(divider3);
      y += 7;

      for (const ab of base.ability) {
        const abText = new PIXI.Text({
          text: `[${ab.trigger}] ${ab.effect}`,
          style: STYLE_ABILITY,
        });
        abText.x = TOOLTIP_PADDING;
        abText.y = y;
        this.contentContainer.addChild(abText);
        y += abText.height + 2;
      }
    }

    if (card.status.length > 0) {
      const statusText = new PIXI.Text({
        text: `Status: ${card.status.join(', ')}`,
        style: new PIXI.TextStyle({ ...STYLE_META, fill: 0xfacc15 }),
      });
      statusText.x = TOOLTIP_PADDING;
      statusText.y = y;
      this.contentContainer.addChild(statusText);
    }
  }
}
