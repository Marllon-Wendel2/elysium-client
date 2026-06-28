import { CardInstance } from "./cardInstance";

export interface PlayCardAction {
  type: 'DOWN_CARD';
  cardInstance: CardInstance;
  targetSlot: { lane: number; position: string; owner: string };
  owner: string;
  invoqueWay: string;
}