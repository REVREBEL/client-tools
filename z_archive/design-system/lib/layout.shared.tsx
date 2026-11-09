import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: 'REVREBEL Design System',
    },
    githubUrl: 'https://github.com/REVREBEL/client-tools',
    searchToggle: {
      enabled: false,
    },
  };
}
