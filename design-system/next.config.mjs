import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createNextStory } from '@fumadocs/story/next';
import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();
const withStory = createNextStory();
const projectRoot = dirname(fileURLToPath(import.meta.url));

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
  turbopack: {
    root: projectRoot,
  },
};

export default withStory(withMDX(config));
