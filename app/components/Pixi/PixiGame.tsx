import { useEffect, useRef } from "react";
import { GameRenderer, type PlayCardAction } from "./PixiRender";
import type { BoardSlot } from "@/app/types/board";
import type { CardInstance } from "@/app/types/cardInstance";

interface PixiGameProps {
  onPlayCard?: (action: PlayCardAction) => void;
  onActionPerformed?: (actionId: string, slot: BoardSlot, card: CardInstance) => void;
  onConfirm?: () => void;
  onRemoveAction?: (index: number) => void;
}

export default function PixiGame({ onPlayCard, onActionPerformed, onConfirm, onRemoveAction }: PixiGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onPlayCardRef = useRef(onPlayCard);
  const onActionPerformedRef = useRef(onActionPerformed);
  const onConfirmRef = useRef(onConfirm);
  const onRemoveActionRef = useRef(onRemoveAction);

  useEffect(() => {
    onPlayCardRef.current = onPlayCard;
  }, [onPlayCard]);

  useEffect(() => {
    onActionPerformedRef.current = onActionPerformed;
  }, [onActionPerformed]);

  useEffect(() => {
    onConfirmRef.current = onConfirm;
  }, [onConfirm]);

  useEffect(() => {
    onRemoveActionRef.current = onRemoveAction;
  }, [onRemoveAction]);

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
        (actionId, slot, card) => {
          onActionPerformedRef.current?.(actionId, slot, card);
        }
      );

      await renderer.initialize();

      if (cancelled) {
        renderer.destroy();
        return;
      }

      renderer.setOnConfirmCallback(() => onConfirmRef.current?.());
      renderer.setOnRemoveActionCallback((index) => onRemoveActionRef.current?.(index));
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
