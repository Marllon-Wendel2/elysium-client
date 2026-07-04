export type EasingFunction = (t: number) => number;

export const Easing = {
  linear: ((t: number) => t) as EasingFunction,

  easeInQuad: ((t: number) => t * t) as EasingFunction,

  easeOutQuad: ((t: number) => t * (2 - t)) as EasingFunction,

  easeInOutQuad: ((t: number) =>
    t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t) as EasingFunction,

  easeInCubic: ((t: number) => t * t * t) as EasingFunction,

  easeOutCubic: ((t: number) => {
    const t1 = t - 1;
    return t1 * t1 * t1 + 1;
  }) as EasingFunction,

  easeInOutCubic: ((t: number) =>
    t < 0.5
      ? 4 * t * t * t
      : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1) as EasingFunction,

  easeOutBack: ((t: number) => {
    const c = 1.70158;
    const t1 = t - 1;
    return 1 + (c + 1) * t1 * t1 * t1 + c * t1 * t1;
  }) as EasingFunction,

  easeOutElastic: ((t: number) => {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin(((t - 0.1) * 5 * Math.PI) / 0.3) + 1;
  }) as EasingFunction,
};