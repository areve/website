export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
export function deepAssign<T>(target: T, ...sources: any[]): T {
  return sources.reduce((acc, source) => {
    Object.keys(source).forEach((key) => {
      acc[key] =
        source[key] && typeof source[key] === "object"
          ? deepAssign(acc[key] || {}, source[key])
          : source[key];
    });
    return acc;
  }, target);
}
