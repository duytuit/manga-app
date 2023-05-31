const path = require('path');

/** @type {import('next').NextConfig} */
module.exports = {
    generateBuildId: async () => {
        // You can, for example, get the latest git commit hash here
        return 'my-build-id';
    },
    reactStrictMode: true,
    webpack: (config) => {
        config.resolve.alias['~'] = path.resolve(__dirname, 'src');

        config.module.rules.push({
            test: /\.svg$/i,
            issuer: /\.[jt]sx?$/,
            use: ['@svgr/webpack'],
        });

        return config;
    },
    async rewrites() {
        return [
            {
                source: '/kytserver/:slug*',
                destination: 'https://animanlabv2.online/kytserver/:slug*', // Matched parameters can be used in the destination
            },
        ];
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    images: {
        unoptimized: true,
        domains: [
            'lh3.googleusercontent.com',
            'st.nettruyenco.com',
            'st.ntcdntempv3.com',
            'i331.ntcdntempv26.com',
            's4.anilist.co',
            'animanlab.online',
            'res.cloudinary.com',
            'cdn.myanimelist.net',
            'kyt-proxy.onrender.com',
        ],
        minimumCacheTTL: 24 * 60 * 60,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    staticPageGenerationTimeout: 5 * 6 * 1000,
};
