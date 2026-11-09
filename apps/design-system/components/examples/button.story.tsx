// apps/design-system/components/examples/button.story.tsx
import { Button } from '@revrebel/ui';
import { defineStory } from '@/lib/story';

export const buttonStory = defineStory({
  Component: Button,
  args: {
    initial: {
      children: 'Book a strategy call',
      color: 'primary',
      colorMode: 'normal',
      colorStyle: 'filled',
      size: 'base',
      clickable: true,
      hoverEffect: 'inverse',
      bracketed: true,
      disabled: false,
    },
  },
});
