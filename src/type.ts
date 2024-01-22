export type NptConfig = {
  watch?: string[];
  start?: string[];
};

export type ChoiceType = (
  | {
      value: string;
      name: string;
      checked: boolean;
      disabled: boolean | string;
    }
  | string
)[];
