interface Item<T> {
  children?: T[];
}

export const isTreeStructure = <T extends Item<T>>(obj: T | T[]): boolean => {
  if (Array.isArray(obj)) {
    return obj.some((item) => item?.children);
  }

  return !!obj?.children;
};
