export function distinctBy<T>(valueSelector?: (item: T) => unknown): (value: T, index: number, array: T[]) => boolean {
  return valueSelector
    ? (item, index, array) => array.findIndex((x) => valueSelector(x) === valueSelector(item)) === index
    : (value, index, array) => array.findIndex((x) => value === x) === index;
}
