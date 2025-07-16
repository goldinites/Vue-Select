interface Item<T> {
  children?: T[];
}

export const flatten = <T extends Item<T>>(list: T[]): T[] => {
  function getChildren(list: T[]): T[] {
    let result: T[] = [];
    const copiedList: T[] = structuredClone(list);

    for (const item of copiedList) {
      result = [...result, item];

      if (item.children?.length) {
        result = [...result, ...getChildren(item.children)];
      }

      delete item?.children;
    }

    return result;
  }

  const copiedList: T[] = structuredClone(list);

  return getChildren(copiedList);
};
