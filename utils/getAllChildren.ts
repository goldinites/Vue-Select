interface Item<T> {
  [key: string]: unknown;
  children: T[];
}

export const getAllChildren = <T extends Item<T>>(item: T): T[] => {
  // рекурсивно получаем всех потомков
  const getChildren = <T>(item: T): T[] => {
    let result: T[] = [];

    const children = item.children ?? [];

    for (const child of children) {
      result = [...result, child];

      // если у потомка есть потомки, идем вглубь
      if (child.children?.length) {
        result = [...result, ...getChildren<T>(child)];
      }
    }

    return result;
  };

  return getChildren<T>(item);
};
