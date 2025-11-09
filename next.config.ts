const nextConfig = {
  // For Turbopack workspace root inference – ensure it points to this project
  // See: https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack#root-directory
  turbopack: {
    root: __dirname,
  },
  // Asegurar que las APIs funcionen en producción
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  async rewrites() {
    return [
      { source: '/api/process', destination: '/api/process-notes' },
    ];
  },
};

export default nextConfig;
