interface Item {
  [key: string]: unknown;
}

export const getAllParents = <T extends Item>(
  items: T,
  fullList: T[],
  idProp: string = 'id',
  parentIdProp: string = 'parentId'
): T[] => {
  let result: T[] = [];

  const preparedItems: T[] = Array.isArray(items) ? items : [items];

  // рекурсивно получаем всех родителей
  const getParent = <T>(state: T, array: T[]): T[] => {
    let result: T[] = [];
    // ищем родителя
    const parent = array.find((item) => item[idProp] === state[parentIdProp]);

    if (parent) {
      result = [...result, parent];

      // если у родителя есть родитель, идем вглубь
      if (parent[parentIdProp]) {
        result = [...result, ...getParent<T>(parent, array)];
      }
    }

    return result;
  };

  // идет по плоскому списку и собираем элементы
  for (const item of preparedItems) {
    result = [...result, item];

    if (item[parentIdProp]) {
      // получаем родителей
      result = [...result, ...getParent<T>(item, fullList)];
    }
  }

  return result;
};
