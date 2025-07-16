<template>
  <div
    class="flex py-2 pl-4 pr-1 rounded-md bg-custom-gray-10 h-max max-h-40 overflow-hidden dark:bg-custom-blue-3"
    data-class="selected-popover"
  >
    <ul v-if="selectedOptions.length" class="flex flex-col flex-1 gap-y-2 overflow-y-scroll scrollbar break-words pr-2">
      <li v-for="(option, index) in selectedOptions" :key="index" class="text-sm text-custom-gray-2 dark:text-white">
        {{ option }}
      </li>
    </ul>
  </div>
</template>
<script setup lang="ts">
  import type { TVSelectOption } from '~/components/ui/VSelect/VSelect.type';

  type VSelectSelectedProps = {
    selected: TVSelectOption[];
    options: TVSelectOption[];
  };

  const props = withDefaults(defineProps<VSelectSelectedProps>(), {
    selected: () => [],
    options: () => [],
  });

  const selectedOptions = computed(() => {
    const isTree = isTreeStructure(props.options);
    let prepared: (string | undefined)[];

    if (isTree) {
      // сценарий для многоуровневого селекта
      // древовидный массив делаем плоским
      const options = flatten<TVSelectOption>(props.options);
      let result: TVSelectOption[][] = [];

      // для каждой опции собираем массив от опции до главного предка
      for (const option of props.selected) {
        result = [...result, [...getAllParents(option, options)]];
      }

      result = result.toSorted((a, b) => a.length - b.length); // сортируем по возрастающей вложенности к потомку

      prepared = result.map((options: TVSelectOption[]) => {
        return options
          .map((option: TVSelectOption) => option?.text) // берем название опции
          .reverse() // разворачиваем от главного предка
          .join('/'); // склеиваем в строку
      });
    } else {
      // сценарий для обычного мультиселекса
      // собираем массив названий выбранных опций
      prepared = props.selected?.map((option: TVSelectOption) => option?.text) ?? [];
    }

    return prepared;
  });
</script>
