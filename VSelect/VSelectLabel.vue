<template>
  <span class="flex items-center gap-x-1 overflow-x-hidden w-full text-sm">
    <template v-if="Array.isArray(selected)">
      {{ selected.length ? $t('ui.select.label') : $t('ui.select.labelEmpty') }}
      <span
        v-if="selected.length"
        class="flex px-1 min-w-5 w-max items-center justify-center bg-custom-dark-blue text-white h-5 rounded-full"
      >
        {{ selected.length }}
      </span>
    </template>
    <span v-else-if="selected?.text" class="overflow-x-hidden whitespace-nowrap overflow-ellipsis block">
      {{ selected?.text }}
    </span>
    <span v-else class="text-custom-gray">
      {{ placeholder }}
    </span>
  </span>
  <UIcon
    class="flex-[0_0_11px] h-1.5 transition duration-200 text-custom-gray dark:text-custom-blue-9"
    :class="[isOpen ? 'rotate-0' : 'rotate-180']"
    name="i:arrow"
  />
</template>
<script setup lang="ts">
  import type { SelectedVariants } from '~/components/ui/VSelect/VSelect.type';

  type VSelectLabelProps = {
    selected?: SelectedVariants;
    placeholder?: string;
    isOpen?: boolean;
  };

  defineProps<VSelectLabelProps>();
</script>
