import type { Metadata } from "next";
import "./globals.scss";

import { defaultFont } from "@/util/font";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "Not-Stock Market",
	description: "todo come up with descriptoin",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className={defaultFont.className}>
				{children}
				<footer className="footer">
					All images and art are property of Cloudy Squid Games&apos; Pixel Cat&apos;s End. The site can be accessed at{" "}
					<a href="https://www.pixelcatsend.com/">https://www.pixelcatsend.com/</a>
				</footer>
			</body>
		</html>
	);
}
