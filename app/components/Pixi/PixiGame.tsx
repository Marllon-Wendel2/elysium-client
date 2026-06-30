import { useEffect, useRef } from "react";
import { GameRenderer, type PlayCardAction } from "./PixiRender";
import type { BoardSlot } from "@/app/types/board";
import type { CardInstance } from "@/app/types/cardInstance";

interface PixiGameProps {
  onPlayCard?: (action: PlayCardAction) => void;
  onBoardCardClick?: (slot: BoardSlot, card: CardInstance) => void;
}

export default function PixiGame({ onPlayCard, onBoardCardClick }: PixiGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onPlayCardRef = useRef(onPlayCard);
  const onBoardCardClickRef = useRef(onBoardCardClick);

  useEffect(() => {
    onPlayCardRef.current = onPlayCard;
  }, [onPlayCard]);

  useEffect(() => {
    onBoardCardClickRef.current = onBoardCardClick;
  }, [onBoardCardClickRef])

  useEffect(() => {
    if (!containerRef.current) return;

    let renderer: GameRenderer | null = null;
    let cancelled = false;

    const start = async () => {
      renderer = new GameRenderer(
        containerRef.current!, 
        (action) => {
          onPlayCardRef.current?.(action);
        },
        (slot, card) => {
          onBoardCardClickRef.current?.(slot, card)
        }
      );

      await renderer.initialize();

      if (cancelled) {
        renderer.destroy();
      }
    };

    start();

    return () => {
      cancelled = true;
      renderer?.destroy();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100vw',
        height: '100vh'
      }}
    />
  );
}
