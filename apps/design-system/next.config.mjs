import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createNextStory } from '@fumadocs/story/next';
import { createMDX } from 'fumadocs-mdx/next';

const projectRoot = dirname(fileURLToPath(import.meta.url));

const withMDX = createMDX();
const withStory = createNextStory();

const githubPagesBasePath = process.env.GITHUB_ACTIONS === 'true' ? '/client-tools' : '';

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  output: 'export',
  trailingSlash: true,
  basePath: githubPagesBasePath,
  assetPrefix: githubPagesBasePath || undefined,
  images: {
    unoptimized: true,
  },
  // Keep type generation and Turbopack tooling scoped to this workspace.
  // Dev/build use Webpack because npm workspaces hoist shared Next dependencies.
  turbopack: {
    root: projectRoot,
  },
  webpack(webpackConfig) {
    // @fumadocs/story uses its glob string as webpack Rule.test. Webpack expects
    // a RegExp (or an absolute literal path), so normalize only the Story rule.
    for (const rule of webpackConfig.module?.rules ?? []) {
      if (!rule || typeof rule !== 'object' || !('use' in rule)) continue;

      const useEntries = Array.isArray(rule.use) ? rule.use : [rule.use];
      const isStoryRule = useEntries.some(
        (entry) =>
          entry &&
          typeof entry === 'object' &&
          'loader' in entry &&
          entry.loader === '@fumadocs/story/webpack/story',
      );

      if (isStoryRule) {
        rule.test = /\.story\.[jt]sx?$/;
      }
    }

    return webpackConfig;
  },
};

export default withStory(withMDX(config));
