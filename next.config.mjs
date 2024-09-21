/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "pce.crab.trade",
				port: "",
				pathname: "**",
			},
		],
	},
	webpack: config => ({
		...config,
		resolve: {
			...config.resolve,
			fallback: {
				...config.resolve.fallback,
				fs: false,
				tls: false,
				child_process: false,
				net: false,
				canvas: false,
			},
		},
	}),
	experimental: {
		turbo: {
			resolveAlias: {
				fs: { browser: "buffer" },
				tls: { browser: "buffer" },
				child_process: { browser: "buffer" },
				net: { browser: "buffer" },
				canvas: { browser: "buffer" },
			},
		},
	},
};

export default nextConfig;
