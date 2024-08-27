export const downloadFile = (name: string, blob: Blob) => {
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.style.display = "none";
	a.href = url;
	a.download = name;
	document.body.appendChild(a);
	a.click();
	URL.revokeObjectURL(url);
	a.remove();
};
