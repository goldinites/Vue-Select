<template>
  <div
    ref="selectRef"
    class="group relative pb-1"
    data-class="select"
    :class="{
      'pointer-events-none cursor-not-allowed': disabled,
    }"
  >
    <div class="size-full" @click="handleToggleOptions()">
      <slot name="label" :is-open="isOpenOptions" :toggle-open="handleToggleOptions">
        <div
          class="flex justify-between items-center gap-x-2 py-2 px-2.5 rounded-md cursor-pointer dark:ring-custom-blue-8"
          :class="selectStyles"
          data-class="select-label"
        >
          <VSelectLabel :placeholder="placeholder" :selected="selected" :is-open="isOpenOptions" />
        </div>
      </slot>
    </div>
    <div
      v-if="Array.isArray(selected) && selected.length && !isOpenOptions"
      class="absolute left-0 right-0 z-20 hidden group-hover:block"
      :class="{
        'top-full': contentPosition === 'down',
        'bottom-full': contentPosition === 'up',
      }"
    >
      <VSelectSelected :selected="selected" :options="options" />
    </div>
    <div v-if="isOpenOptions" data-class="select-options">
      <VSelectOptionsList
        :options="options"
        :selected="selected"
        :multiple="multiple"
        :nested-selection="nestedSelection"
        :resizable="resizable"
        :content-position="contentPosition"
        @close="handleToggleOptions(false)"
        @change="setOptions"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { TVSelectOption, SelectedVariants, ResizableProp } from '~/components/ui/VSelect/VSelect.type';
  import { onClickOutside } from '@vueuse/core';
  import { tv } from 'tailwind-variants';

  type VSelectProps = {
    options: TVSelectOption[];
    placeholder?: string;
    initialValue?: SelectedVariants;
    multiple?: boolean;
    nestedSelection?: boolean;
    resizable?: ResizableProp;
    size?: 'sm' | 'md';
    color?: 'default' | 'blue' | 'white';
    disabled?: boolean;
  };

  type VSelectEmits = {
    change: [result: SelectedVariants];
  };

  const props = withDefaults(defineProps<VSelectProps>(), {
    options: () => [],
    initialValue: (props) => (props.multiple ? [] : {}),
    multiple: false,
    resizable: null,
    placeholder: '',
    size: 'md',
    color: 'default',
    disabled: false,
  });

  const emit = defineEmits<VSelectEmits>();

  const selectRef = ref<HTMLDivElement | null>(null);

  const selected = ref<SelectedVariants>(props.initialValue);

  const [isOpenOptions, handleToggleOptions] = useToggle<boolean>(false);

  const contentPosition = ref<'up' | 'down'>('down');

  onClickOutside(selectRef, () => {
    if (isOpenOptions.value) {
      handleToggleOptions(false);
    }
  });

  const setOptions = (data: SelectedVariants) => {
    if (!props.multiple && selected.value?.id !== data?.id) {
      emit('change', data);
    }

    selected.value = data;
  };

  const isEqualSelectedWithInitial = () => {
    if (!Array.isArray(props.initialValue) && !Array.isArray(selected.value)) {
      return false;
    }

    if (props.initialValue?.length !== selected.value?.length) {
      return false;
    }

    const selectedIdsStr = selected.value
      .map((item) => item.id)
      .sort()
      .join('');
    const initialIdsStr = props.initialValue
      .map((item) => item.id)
      .sort()
      .join('');

    return selectedIdsStr === initialIdsStr;
  };

  watch(isOpenOptions, (opened) => {
    if (!opened && props.multiple) {
      if (!isEqualSelectedWithInitial()) {
        emit('change', selected.value);
      }
    }
  });

  watch(
    () => props.initialValue,
    (value) => {
      selected.value = value;
    }
  );

  const styles = tv({
    variants: {
      size: {
        sm: 'h-8',
        md: 'h-10',
      },
      color: {
        default: 'ring-1 ring-custom-gray-3 dark:bg-custom-blue-3',
        blue: 'bg-custom-light-blue-5 dark:bg-custom-gray-16',
        white: 'bg-white dark:bg-custom-blue-3',
      },
      disabled: {
        true: 'bg-custom-gray-10 dark:bg-custom-gray-15',
      },
    },
    defaultVariants: {
      size: 'md',
      color: 'default',
      disabled: false,
    },
  });

  const selectStyles = computed(() => {
    return styles({ size: props.size, color: props.color, disabled: props.disabled });
  });

  const reset = () => {
    selected.value = props.multiple ? [] : {};
  };

  const dropdownHeight = computed(() => (props.multiple ? 308 : 228));

  onMounted(() => {
    const setOptionsPosition = (el: HTMLElement | null) => {
      const bounding = selectRef.value?.getBoundingClientRect();
      if (!bounding) {
        return;
      }

      const elRect = el?.getBoundingClientRect();

      const spaceBelow = elRect ? elRect.bottom - bounding.bottom : window.innerHeight - bounding.bottom;

      const spaceAbove = elRect ? bounding.top - elRect.top : bounding.top;

      contentPosition.value = spaceBelow > dropdownHeight.value || spaceBelow > spaceAbove ? 'down' : 'up';
    };

    setOptionsPosition(null);
    window.addEventListener('scroll', () => setOptionsPosition(null));
    window.addEventListener('resize', () => setOptionsPosition(null));

    document.querySelectorAll('.scrollbar').forEach((scrollbar) => {
      if (scrollbar.querySelector('[data-class="select"]')) {
        setOptionsPosition(scrollbar as HTMLElement);
        scrollbar.addEventListener('scroll', () => setOptionsPosition(scrollbar as HTMLElement));
      }
    });
  });

  defineExpose({
    reset,
  });
</script>
