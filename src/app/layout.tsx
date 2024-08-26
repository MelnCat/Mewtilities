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
			<body className={defaultFont.className}>{children}</body>
		</html>
	);
}
