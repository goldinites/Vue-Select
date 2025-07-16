interface Item<T> {
  [key: string]: unknown;
  children?: T[];
}

export const flatToTree = <T extends Item<T>>(
  list: T[],
  idProp: string = 'id',
  parentIdProp: string = 'parentId'
): T[] => {
  const copiedList: T[] = structuredClone(list);

  return copiedList
    .reduce((acc: T[], item) => {
      const children = copiedList.filter((i) => i[parentIdProp] === item[idProp]);

      if (children.length) {
        item.children = children;
      }

      acc.push(item);

      return acc;
    }, [])
    .filter((item: T) => !item[parentIdProp]);
};
