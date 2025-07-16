<template>
  <li data-class="option">
    <div
      class="flex items-center justify-between gap-x-3 pr-1"
      :class="optionStyles"
      data-class="option-content"
      @click.stop="handleOptionClick(option)"
    >
      <div class="flex items-center gap-x-3 flex-1 py-2 text-sm" :style="`padding-left: ${optionPadding}px`">
        <UCheckbox
          v-if="multiple"
          :disabled="!option.isSelectable && !canShowChildren"
          :model-value="isSelectedOption"
          :ui="{
            background: 'disabled:bg-custom-gray-3 dark:disabled:bg-custom-blue-8',
            border: 'disabled:border-custom-gray-3 dark:disabled:border-custom-blue-8',
          }"
          :indeterminate="indeterminate"
          @click.stop="handleSetOption(option)"
        />
        <span :class="[isSelectedOption && !multiple && 'text-custom-gray dark:text-custom-blue-9']">
          {{ option?.text }}
        </span>
      </div>
      <ArrowButton v-if="canShowChildren" :is-open="isOpenChildren" />
    </div>
    <TransitionExpand v-if="canShowChildren" v-show="isOpenChildren">
      <ul>
        <VSelectOption
          v-for="child in option.children"
          :key="child.id"
          :option="child"
          :multiple="multiple"
          :level="props.level + 1"
          :selected-ids="selectedIds"
          :searching="searching"
          :nested-selection="nestedSelection"
          @set-option="handleSetOption"
        />
      </ul>
    </TransitionExpand>
  </li>
</template>
<script setup lang="ts">
  import type { TVSelectOption, SelectedVariants } from '~/components/ui/VSelect/VSelect.type';

  type VSelectOptionProps = {
    option: TVSelectOption;
    selectedIds?: number | string | (number | string | undefined)[];
    multiple?: boolean;
    level?: number;
    searching?: string;
    nestedSelection?: boolean;
    defaultOpen?: boolean;
  };

  type VSelectOptionEmits = {
    'set-option': [data: SelectedVariants];
  };

  const props = withDefaults(defineProps<VSelectOptionProps>(), {
    level: 1,
    selectedIds: undefined,
    searching: '',
    defaultOpen: false,
  });

  const indeterminate = computed(() => {
    if (!props.multiple || !props.nestedSelection) {
      return false;
    }
    if (!Array.isArray(props.selectedIds) || !Array.isArray(props.option?.children) || props.option.isSelectable) {
      return false;
    }

    const result = getAllChildren(props.option).filter((child) => child.isSelectable);
    // собираем все выбранные селекты.
    const selected = result.filter((child) => (props.selectedIds as number[])?.includes(child.id!));
    // если не выбранно не одного или выбраны все селекты то это не индетерминат состояние.
    return result.length !== 0 && selected.length !== 0 && selected.length !== result.length;
  });

  // визуальная вложенность через паддинг
  const optionPadding = computed(() => {
    const STANDARD_OPTION_PADDING: number = 12;

    return props.level * STANDARD_OPTION_PADDING + STANDARD_OPTION_PADDING;
  });

  const optionStyles = computed(() => {
    // опцию нельзя выбрать
    if (!props.option?.isSelectable) {
      // для мультиселекта
      if (props.multiple) {
        return props.option?.children?.length ? 'cursor-pointer' : 'pointer-events-none cursor-not-allowed';
      }

      // для сингл селекта
      return 'pointer-events-none bg-custom-light-blue-5 opacity-50 cursor-not-allowed dark:bg-custom-gray-8';
    }

    // опцию можно выбрать
    return 'cursor-pointer hover:bg-custom-light-blue-4 hover:text-custom-dark-blue dark:hover:bg-custom-gray-8 dark:hover:text-custom-blue-2';
  });

  const canShowChildren = computed(() => {
    return props.multiple && props.option?.children?.length && !props.option?.hideChildren;
  });

  const isSelectedOption = computed(() => {
    if (!Array.isArray(props.selectedIds)) {
      return props.selectedIds === props.option?.id;
    }

    if (canShowChildren.value && !props.option?.isSelectable) {
      return getAllChildren(props.option)
        .filter((child) => child.isSelectable)
        .every((child) => (props.selectedIds as number[])?.includes(child.id as number));
    }

    return props.selectedIds.includes(props.option?.id as number);
  });

  const emit = defineEmits<VSelectOptionEmits>();

  const handleSetOption = (option: SelectedVariants): void => {
    // если в параметрах указан наследующийся выбор и у опции есть потомки
    // добавляем опцию, и всех потомков
    if (!props.nestedSelection || Array.isArray(option) || !option.children?.length) {
      emit('set-option', option);
      return;
    }

    if (option.isSelectable) {
      emit('set-option', [option]);
      return;
    }

    emit('set-option', getAllChildren(option).filter((child) => child.isSelectable) ?? []);
  };

  const handleOptionClick = (option: TVSelectOption): void => {
    if (canShowChildren.value) {
      handleToggleChildren();
      return;
    }

    handleSetOption(option);
  };

  const [isOpenChildren, handleToggleChildren] = useToggle(props.defaultOpen);

  watch(
    () => props.searching,
    (value: string) => {
      // раскрываем опции при вводе символов, закрываем если поле поиска пусто
      handleToggleChildren(!!value.length);
    }
  );
</script>
