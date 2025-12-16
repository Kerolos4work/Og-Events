import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
  productionBrowserSourceMaps: false, // Disable source maps in production to avoid parsing errors
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  turbopack: {}, // Empty Turbopack config to avoid errors
  webpack: (config, { dev, isServer }) => {
    // Disable source maps in all environments
    config.devtool = false;

    // Remove any source map related plugins
    config.plugins = config.plugins.filter((plugin: any) =>
      plugin.constructor.name !== 'SourceMapDevToolPlugin' &&
      plugin.constructor.name !== 'EvalSourceMapDevToolPlugin'
    );

    // Ensure source maps are completely disabled
    config.module.rules = config.module.rules.map((rule: any) => {
      if (rule.use && rule.use.loader === 'source-map-loader') {
        return { ...rule, use: undefined };
      }
      if (Array.isArray(rule.use)) {
        rule.use = rule.use.filter((useItem: any) =>
          (typeof useItem === 'string' && !useItem.includes('source-map')) ||
          (typeof useItem === 'object' && useItem.loader !== 'source-map-loader')
        );
      }
      return rule;
    });

    // Set environment variable to disable source maps
    process.env.GENERATE_SOURCEMAP = 'false';

    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.qrserver.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'mmdzysyuazaoyuymjjqu.supabase.co',
        port: '',
        pathname: '/storage/v1/object/**',
      },
    ],
  },
};

export default nextConfig;
