import * as PIXI from 'pixi.js';

export interface ActionMenuItem {
    id: string,
    iconUrl: string,
    label: string,
    enabled: boolean
}

const ITEM_WIDTH = 90;
const ITEM_HEIGHT = 110;
const ICON_SIZE = 70;
const LABEL_FONT_SIZE = 14;
const ITEM_GAP = 16;
const MENU_PADDING = 20;
const MIN_BG_ITEMS = 5;
const BG_RADIUS = 14;
const BG_COLOR = 0x1a1a2e;
const BG_ALPHA = 0.92;
const HOVER_BORDER = 0xfbbf24;

export class ActionMenu {
    container: PIXI.Container;
    onAction?: (actionId: string) => void;

    private bg: PIXI.Graphics;
    private itemsContainer: PIXI.Container;

     private items: { 
        container: PIXI.Container; 
        bg: PIXI.Graphics; 
        action: ActionMenuItem 
    }[] = [];

    constructor() {
        this.container = new PIXI.Container();
        this.container.visible = false;

        this.container.zIndex = 2000;

        this.bg = new PIXI.Graphics();
        this.container.addChild(this.bg);

        this.itemsContainer = new PIXI.Container();
        this.container.addChild(this.itemsContainer);
    }

    setActions(actions: ActionMenuItem[]) {
        for (const item of this.items) {
            this.itemsContainer.removeChild(item.container);
            item.container.destroy();
        }

        this.items = [];

        if (actions.length === 0) {
            this.hide();
            return;
        }

        const contentWidth = actions.length * ITEM_WIDTH + (actions.length - 1) * ITEM_GAP;
        const minBgWidth = MIN_BG_ITEMS * ITEM_WIDTH + (MIN_BG_ITEMS - 1) * ITEM_GAP;
        const menuWidth = Math.max(minBgWidth, contentWidth) + MENU_PADDING * 2;

        this.bg.clear();
        this.bg
            .roundRect(0, 0, menuWidth, ITEM_HEIGHT + MENU_PADDING * 2, BG_RADIUS)
            .fill({ color: BG_COLOR, alpha: BG_ALPHA });

        const itemsTotalWidth = actions.length * ITEM_WIDTH + (actions.length - 1) * ITEM_GAP;
        const itemsStartX = (menuWidth - itemsTotalWidth) / 2;

        actions.forEach((action, index) => {
            const itemContainer = new PIXI.Container();

            const x = itemsStartX + index * (ITEM_WIDTH + ITEM_GAP);
            itemContainer.x = x;
            itemContainer.y = MENU_PADDING;

            const iconBg = new PIXI.Graphics();
            iconBg
                .roundRect(0, 0, ICON_SIZE, ICON_SIZE, 8)
                .fill({ color: 0x000000, alpha: 0.5 })
                .stroke({ width: 2, color: 0x4b5563, alpha: 0.6 });
            itemContainer.addChild(iconBg);

            const iconSprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
            iconSprite.width = ICON_SIZE;
            iconSprite.height = ICON_SIZE;
            itemContainer.addChild(iconSprite);

            PIXI.Assets.load(action.iconUrl).then((texture) => {
                iconSprite.texture = texture;
            });

            const label = new PIXI.Text({
                text: action.label,
                style: {
                fontSize: LABEL_FONT_SIZE,
                fill: 0xffffff,
                fontFamily: 'Arial',
                fontWeight: 'bold',
                align: 'center',
                },
            });
            label.anchor.set(0.5, 0);
            label.x = ICON_SIZE / 2;
            label.y = ICON_SIZE + 6;
            itemContainer.addChild(label);

            if (!action.enabled) {
                itemContainer.alpha = 0.4;
                itemContainer.eventMode = 'none';
            } else {
                itemContainer.eventMode = 'static';
                itemContainer.cursor = 'pointer';

                itemContainer.on('pointerover', () => {
                iconBg.clear();
                iconBg
                    .roundRect(0, 0, ICON_SIZE, ICON_SIZE, 8)
                    .fill({ color: 0x000000, alpha: 0.5 })
                    .stroke({ width: 3, color: HOVER_BORDER, alpha: 0.9 });
                });

                itemContainer.on('pointerout', () => {
                iconBg.clear();
                iconBg
                    .roundRect(0, 0, ICON_SIZE, ICON_SIZE, 8)
                    .fill({ color: 0x000000, alpha: 0.5 })
                    .stroke({ width: 2, color: 0x4b5563, alpha: 0.6 });
                });

                itemContainer.on('pointertap', () => {
                this.onAction?.(action.id);
                });
            }

            this.itemsContainer.addChild(itemContainer);
            this.items.push({ container: itemContainer, bg: iconBg, action });
        })
    }

    show(screenWidth: number, screenHeight: number) {
        if (this.items.length === 0) return;

        const contentWidth = this.items.length * ITEM_WIDTH + (this.items.length - 1) * ITEM_GAP;
        const minBgWidth = MIN_BG_ITEMS * ITEM_WIDTH + (MIN_BG_ITEMS - 1) * ITEM_GAP;
        const menuWidth = Math.max(minBgWidth, contentWidth) + MENU_PADDING * 2;
        const menuHeight = ITEM_HEIGHT + MENU_PADDING * 2;

        const handTop = screenHeight - 150 - 30;
        const menuY = handTop - menuHeight - 10;

        const menuX = (screenWidth - menuWidth) / 2;

        this.container.x = menuX;
        this.container.y = menuY;
        this.container.visible = true;
    }

    hide() {
        this.container.visible = false;
    }

    isOpen(): boolean {
        return this.container.visible;
    }

}
