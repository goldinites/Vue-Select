import type { ProcessDictionary } from '~/lib/api/BpmProcess/BpmProcessApi.type';

export type TVSelectOption = {
  children?: TVSelectOption[];
  hideChildren?: boolean;
  additionalData?: unknown;
} & ProcessDictionary;

export type SelectedVariants = TVSelectOption | TVSelectOption[];

export type ResizableProp = null | 'x' | 'y' | 'both';
