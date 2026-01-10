import type { Metadata } from "next";
import "./globals.scss";
import styles from "./layout.module.scss";

import { defaultFont } from "@/util/font";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "Mewtilities",
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
				<header className="header">
					<img src="/img/mewtilities.png" alt="Mewtilities Logo with a cat on top" />
					<svg className="noise">
						<filter id="filter">
							<feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
						</filter>
						<rect x="0" y="0" width="100%" height="100%" filter="url(#filter)" />
					</svg>
				</header>
				<nav className={styles.nav}>
					<div className={styles.navEntry}>
						<Link href="/">Home</Link>
					</div>
					<div className={styles.gap} />
					<div className={styles.navEntry}>
						<Link href="/cat-editor">Cat Editor</Link>
					</div>
					<div className={styles.gap} />
					<div className={styles.navEntry}>
						<Link href="/gene-test">GATO</Link>
					</div>
				</nav>
				{children}
				<footer className={styles.footer}>
					All images and art are property of Cloudy Squid Games&apos; Pixel Cat&apos;s End. The site can be accessed at{" "}
					<a href="https://www.pixelcatsend.com/">https://www.pixelcatsend.com/</a>
				</footer>
			</body>
		</html>
	);
}
