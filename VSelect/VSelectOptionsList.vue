<template>
  <div
    class="flex flex-col min-w-full max-w-md max-h-[30rem] overflow-hidden pr-1 py-0.5 bg-white shadow-lg rounded-md dark:bg-custom-blue-3"
    :class="optionsStyles"
  >
    <div v-if="multiple" data-class="select-actions">
      <div v-if="!hideAllSelect" class="flex items-center justify-between gap-x-2 p-3 pb-2">
        <div class="flex items-center gap-x-2 cursor-pointer" @click="handleCheckAll">
          <UCheckbox :model-value="allOptionsChecked" />
          <span class="text-sm text-custom-gray-2">
            {{ $t('ui.select.checkAll') }}
          </span>
        </div>
        <span class="text-sm text-custom-gray cursor-pointer" @click="handleResetOptions">
          {{ $t('ui.select.reset') }}
        </span>
      </div>
      <div :class="hideAllSelect ? 'p-4' : 'border-y p-3'">
        <UInput v-model="searchQuery" :placeholder="$t('ui.select.searchLabel')" trailing-icon="i:search" />
      </div>
    </div>
    <ul v-if="displayedOptions.length" class="flex-1 overflow-y-scroll scrollbar">
      <VSelectOption
        v-for="option in displayedOptions"
        :key="option.id"
        :option="option"
        :multiple="multiple"
        :level="0"
        :selected-ids="selectedIds"
        :searching="searchQuery.length >= MIN_SEARCH_QUERY_LENGTH ? searchQuery : ''"
        :nested-selection="nestedSelection"
        :default-open="defaultOpen"
        @set-option="handleChangeOption"
      />
    </ul>
    <div v-else class="flex justify-center items-center flex-1 text-lg" data-class="select-empty">
      {{ $t('ui.select.notFoundOptions') }}
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { TVSelectOption, SelectedVariants, ResizableProp } from '~/components/ui/VSelect/VSelect.type';

  type VSelectOptionsListProps = {
    options: TVSelectOption[];
    multiple?: boolean;
    selected: SelectedVariants;
    nestedSelection?: boolean;
    resizable?: ResizableProp;
    contentPosition: 'up' | 'down';
    static?: boolean;
    hideAllSelect?: boolean;
    defaultOpen?: boolean;
  };

  type VSelectOptionsListEmits = {
    change: [result: SelectedVariants];
    close: [];
  };

  const emit = defineEmits<VSelectOptionsListEmits>();

  const props = defineProps<VSelectOptionsListProps>();

  const searchQuery = ref<string>('');
  const MIN_SEARCH_QUERY_LENGTH = 2; // сколько нужно символов, чтоб начался поиск

  const optionsStyles = computed(() => {
    if (props.static) {
      return [];
    }
    const styles: string[] = ['absolute z-30 left-0 right-0'];

    switch (props.resizable) {
      case 'both':
        styles.push('resize');
        break;
      case 'x':
        styles.push('resize-x');
        break;
      case 'y':
        styles.push('resize-y');
        break;
      default:
        break;
    }

    if (displayedOptions.value.length <= 6) {
      styles.push('h-max');
    } else {
      if (props.multiple) {
        // мультиселект
        styles.push('h-77');
      } else {
        // сингл селект
        styles.push('h-57');
      }
    }

    if (props.contentPosition === 'down') {
      styles.push('top-[calc(100%+4px)]');
    } else {
      styles.push('bottom-[calc(100%+4px)]');
    }

    return styles.join(' ');
  });

  // id выбранных опций / выбранной опции
  const selectedIds = computed(() => {
    if (Array.isArray(props.selected)) {
      return props.selected.map((option) => option.id);
    }

    return props.selected?.id;
  });

  const allOptionsChecked = computed(() => {
    // если массив древовидный - превращаем в плоский
    const options = isTreeStructure(props.options) ? flatten(props.options) : props.options;

    if (Array.isArray(props.selected) && props.selected?.length) {
      return (
        // проверяем что все доступные опции равны длине выбранных опций
        options.filter((option: TVSelectOption) => option.isSelectable)?.length === props.selected?.length
      );
    }

    return false;
  });

  const multipleSelectPrepareOption = (data: SelectedVariants): SelectedVariants => {
    let result: SelectedVariants = [];

    // проверка для ts
    if (Array.isArray(props.selected)) {
      // сценарий когда выбрано props.nestedSelection и у опции есть потомки
      if (Array.isArray(data)) {
        // опция которую выбрали
        const origin = data[0];

        // проверяем добавлена ли опция в выбранные
        const originAlreadySelected = props.selected?.some((option) => option.id === origin.id);

        if (originAlreadySelected) {
          // удаляем из выбранных все опции из data
          return props.selected?.filter((option) => {
            return data?.every((i) => i.id !== option.id);
          });
        }

        // добавляем опции в выбранные
        result = [...props.selected, ...data];

        result = deleteDuplicates(result);

        return result;
      }

      // сценарий для всех остальных случаев
      // проверяем добавлена ли опция в выбранные
      const optionAlreadySelected = props.selected.some((opt) => opt.id === data.id);

      // удаляем/добавляем опцию в выбранные
      result = optionAlreadySelected ? props.selected.filter((opt) => opt.id !== data.id) : [...props.selected, data];
    }

    return result;
  };

  const handleChangeOption = (data: SelectedVariants): void => {
    let result: SelectedVariants;
    if (Array.isArray(props.selected)) {
      result = multipleSelectPrepareOption(data);
    } else {
      result = data;
      emit('close');
    }

    emit('change', result);
  };

  const handleCheckAll = (): void => {
    let result: TVSelectOption[] = [];

    // если массив древовидный - превращаем в плоский
    const options = isTreeStructure(props.options) ? flatten<TVSelectOption>(props.options) : props.options;

    // фильтруем по доступным опциям
    const selectableOptions = options.filter((option) => option.isSelectable);

    if (
      Array.isArray(props.selected) &&
      selectableOptions.length &&
      props.selected?.length < selectableOptions.length
    ) {
      result = selectableOptions;
    }

    emit('change', result);
  };

  const handleResetOptions = () => {
    emit('change', []);
  };

  const filteredOptions = computed(() => {
    if (searchQuery.value.length >= MIN_SEARCH_QUERY_LENGTH) {
      const isTreeOptions = isTreeStructure(props.options);
      // если массив древовидный, делаем его плоским
      const options = isTreeOptions ? flatten<TVSelectOption>(props.options) : props.options;

      // фильтруем доступные для выбора элементы по поисковому запросу
      const filteredList: TVSelectOption[] =
        options.filter(
          (option: TVSelectOption) =>
            option.text?.toLowerCase()?.includes(searchQuery.value.toLowerCase()) && option.isSelectable
        ) ?? [];

      // если массив древовидный, собираем новое дерево по фильтру
      if (isTreeOptions) {
        if (props.nestedSelection) {
          // если в параметрах указан наследующийся выбор, значит у опции могут быть потомки, которых
          // нужно учитывать при выборе опции,
          // из-за того, что мы фильтровали поиск по плоскому массиву, у опций больше нет массива children.
          // идем по filteredList, и ищем элементы в древовидном props.options по их id
          // заменяем в filteredList элементы на элементы с children из props.options и меняем
          // в них hideChildren на true, чтоб они не отображались визуально при поиске
          for (const index in filteredList) {
            const { element: replaced } = searchInTree(props.options, 'id', filteredList[index].id ?? 0);

            if (replaced) {
              filteredList[index] = { ...replaced, hideChildren: true };
            }
          }
        }

        // получаем всех родителей отфильтрованных опций
        let result: TVSelectOption[] = getAllParents(filteredList, options);

        // удаляем дубликаты
        result = deleteDuplicates(result);

        // превращаем обратно в дерево
        result = flatToTree(result);

        return result ?? [];
      }

      return filteredList;
    }

    return [];
  });

  const displayedOptions = computed(() => {
    // если в поиске что-то есть, показываем отфильтрованный массив
    if (searchQuery.value.length >= MIN_SEARCH_QUERY_LENGTH) {
      return filteredOptions.value;
    }

    return props.options;
  });
</script>
