export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
export function deepAssign<T>(target: T, ...sources: any[]): T {
  return sources.reduce((acc, source) => {
    Object.keys(source).forEach((key) => {
      if (Array.isArray(source[key])) {
        acc[key] = source[key].slice();
      } else if (source[key] && typeof source[key] === "object") {
        acc[key] = deepAssign(acc[key] || {}, source[key]);
      } else {
        acc[key] = source[key];
      }
    });
    return acc;
  }, target);
}
