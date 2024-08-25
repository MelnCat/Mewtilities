declare module "html2bbcode" {
	interface HTML2BBCodeOptions {
		imagescale?: boolean; // Enable image scale, default: false
		transsize?: boolean; // Enable transform pixel size to size 1-7, default: false
		nolist?: boolean; // Disable list <ul> <ol> <li> support, default: false
		noalign?: boolean; // Disable text-align center support, default: false
		noheadings?: boolean; // Disable HTML headings support, transform to size, default: false
	}

	class HTML2BBCode {
		constructor(options?: HTML2BBCodeOptions);

		/**
		 * Feeds the HTML data to the converter and returns the BBCode equivalent.
		 * @param data - The HTML data to be converted.
		 * @returns The converted BBCode as a string.
		 */
		feed(data: string): string;
	}

	export { HTML2BBCode, HTML2BBCodeOptions };
}
