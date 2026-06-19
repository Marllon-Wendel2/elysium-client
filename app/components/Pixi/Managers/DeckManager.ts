import * as PIXI from 'pixi.js';

const DECK_WIDTH = 80;
const DECK_HEIGHT = 112;
const DECK_MARGIN = 40;

export class DeckManager {
  container: PIXI.Container;
  private playerDeck: PIXI.Container;
  private opponentDeck: PIXI.Container;
  private playerCountText: PIXI.Text;
  private opponentCountText: PIXI.Text;
  private playerBack: PIXI.Sprite | null = null;
  private opponentBack: PIXI.Sprite | null = null;

  constructor() {
    this.container = new PIXI.Container();

    this.playerDeck = new PIXI.Container();
    this.opponentDeck = new PIXI.Container();
    this.container.addChild(this.playerDeck);
    this.container.addChild(this.opponentDeck);

    this.playerCountText = new PIXI.Text({
      text: '0',
      style: { fontSize: 14, fill: 0xffffff, fontWeight: 'bold', fontFamily: 'Arial' },
    });
    this.playerCountText.anchor.set(0.5);
    this.playerDeck.addChild(this.playerCountText);

    this.opponentCountText = new PIXI.Text({
      text: '0',
      style: { fontSize: 14, fill: 0xffffff, fontWeight: 'bold', fontFamily: 'Arial' },
    });
    this.opponentCountText.anchor.set(0.5);
    this.opponentDeck.addChild(this.opponentCountText);

    this.loadCardBacks();
  }

  private async loadCardBacks() {
    try {
      const texture = await PIXI.Assets.load('/Cards/verso.jpg');

      this.playerBack = new PIXI.Sprite(texture);
      this.playerBack.width = DECK_WIDTH;
      this.playerBack.height = DECK_HEIGHT;
      this.playerDeck.addChildAt(this.playerBack, 0);

      this.opponentBack = new PIXI.Sprite(texture);
      this.opponentBack.width = DECK_WIDTH;
      this.opponentBack.height = DECK_HEIGHT;
      this.opponentDeck.addChildAt(this.opponentBack, 0);
    } catch {
      // fallback: draw a rect
      const g = new PIXI.Graphics()
        .roundRect(0, 0, DECK_WIDTH, DECK_HEIGHT, 8)
        .fill({ color: 0x1e293b, alpha: 0.8 })
        .stroke({ width: 2, color: 0x64748b });

      this.playerDeck.addChildAt(g, 0);
      this.opponentDeck.addChildAt(g.clone(), 0);
    }
  }

  update(playerDeckCount: number, opponentDeckCount: number, screenWidth: number, screenHeight: number) {
    this.playerCountText.text = `${playerDeckCount}`;
    this.opponentCountText.text = `${opponentDeckCount}`;

    const handAreaHeight = 200;
    const deckY = screenHeight - handAreaHeight / 2 - DECK_HEIGHT / 2;

    this.playerDeck.x = screenWidth - DECK_WIDTH - DECK_MARGIN;
    this.playerDeck.y = deckY;

    this.opponentDeck.x = screenWidth - DECK_WIDTH - DECK_MARGIN;
    this.opponentDeck.y = DECK_MARGIN;

    this.playerCountText.x = DECK_WIDTH / 2;
    this.playerCountText.y = DECK_HEIGHT + 16;

    this.opponentCountText.x = DECK_WIDTH / 2;
    this.opponentCountText.y = DECK_HEIGHT + 16;
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
