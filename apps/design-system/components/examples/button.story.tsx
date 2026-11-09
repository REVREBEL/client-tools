// apps/design-system/components/examples/button.story.tsx
import { Button } from '@revrebel/ui';
import { defineStory } from '@/lib/story';

export const buttonStory = defineStory({
  Component: Button,
  args: {
    initial: {
      children: 'Open playlist',
      variant: 'primary',
      size: 'md',
      disabled: false,
      fullWidth: false,
    },
  },
});
