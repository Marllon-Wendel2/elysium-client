import { useEffect, useRef } from "react";
import { GameRenderer, type PlayCardAction } from "./PixiRender";

interface PixiGameProps {
  onPlayCard?: (action: PlayCardAction) => void;
}

export default function PixiGame({ onPlayCard }: PixiGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onPlayCardRef = useRef(onPlayCard);

  useEffect(() => {
    onPlayCardRef.current = onPlayCard;
  }, [onPlayCard]);

  useEffect(() => {
    if (!containerRef.current) return;

    let renderer: GameRenderer | null = null;
    let cancelled = false;

    const start = async () => {
      renderer = new GameRenderer(containerRef.current!, (action) => {
        onPlayCardRef.current?.(action);
      });

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
