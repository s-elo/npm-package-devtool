export type NptConfig = {
  watch?: string[];
  start?: string[];
};

export interface ChoiceItem {
  value: string;
  name: string;
  checked: boolean;
  disabled: boolean | string;
}

export type ChoiceType = (ChoiceItem | string)[];
