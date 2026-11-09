import { defineStory } from '@/lib/story';
import { PreviewButton } from './preview-button';

export const previewButtonStory = defineStory({
  Component: PreviewButton,
  args: {
    initial: {
      label: 'Preview component',
      variant: 'primary',
      disabled: false,
    },
  },
});
