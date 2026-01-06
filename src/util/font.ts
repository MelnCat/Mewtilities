import { Inter } from "next/font/google";
import localFont from "next/font/local";

export const defaultFont = localFont({
	src: [
		{
			path: "../assets/font/PixeloidSans.ttf",
			weight: "400",
		},
		{
			path: "../assets/font/PixeloidSans-Bold.ttf",
			weight: "700",
		},
		{
			path: "../assets/font/PixeloidMono.ttf",
			weight: "400",
            style: "italic"
		},
	],
});
