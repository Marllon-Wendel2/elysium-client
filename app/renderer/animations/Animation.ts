export interface Animation {
  finished: boolean;
  update(dt: number): void;
  pause(): void;
  resume(): void;
  stop(): void;
}