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
};

export default nextConfig;
