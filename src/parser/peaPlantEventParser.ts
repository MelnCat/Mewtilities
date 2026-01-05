import { parseDom } from "@/util/dom";
import { PeaPhenotype } from "@/util/peaplant";
import { failure, Result, success } from "@/util/result";

export interface RawPeaPlantEntry {
	testee: { phenotype: PeaPhenotype } | null;
	testers: { letter: string; phenotype: PeaPhenotype }[];
	parents: ["mystery" | "a" | "b" | "c" | "d" | "e", "mystery" | "a" | "b" | "c" | "d" | "e"] | null;
	descendants: { phenotype: PeaPhenotype }[];
}

export const parsePeaPlantEventPage = (content: string): Result<RawPeaPlantEntry> => {
	const doc = parseDom(content);
	const form = doc.querySelector(".formlike-content-area form");
	if (!form) return failure("Invalid page layout");
	if (!form.getAttribute("action")?.includes("/event-hub/peas-game")) return failure("Not a bean plant page");

	const parsePlantJail = (jail: Element) => {
		const getImage = (clazz: string) => {
			return (jail.getElementsByClassName(clazz)?.[0] as HTMLImageElement | undefined) ?? null;
		};
		const base = getImage("plant-base");
		if (!base) return failure("Plant base missing");
		if (base.src.includes("/crate_mystery")) return null;
		const varie = getImage("plant-varie");
		const pot = getImage("plant-pot");
		if (!pot) return failure("Plant pot missing");
		const peas = getImage("plant-peas");
		if (!peas) return failure("Plant peas missing");
		const flower = getImage("plant-flower");
		if (!flower) return failure("Plant flower missing");
		const baseColor = base.src.match(/plant_base_(\w+)\.png/)?.[1];
		const varieData = varie?.src.match(/variegation_(\w+)_(\w+)\.png/)?.slice(1);
		const potType = pot.src.match(/pot_(\w+)\.png/)?.[1];
		const peasData = peas.src.match(/pods_(\w+)_(\w+)\.png/)?.slice(1);
		const flowerData = flower.src.match(/flower_(\w+?)_(\w+?)(?:_(?:yes|no))?\.png/)?.slice(1);
		const clazz = [...base.classList].find(x => x !== "plant-base");
		if (!baseColor || !potType || !peasData || !flowerData || !clazz) return failure("Invalid plant components");
		const baseData = clazz.split("-").slice(1);
		const albino = baseColor !== "darkgreen" && baseColor !== "lavender";
		return success({
			...(potType === "mystery" ? null : { letter: potType as "a" }),
			phenotype: {
				size: baseData[0] === "normal" ? "Normal" : "Miniature",
				stem: baseData[1] === "straight" ? "Straight" : "Curly",
				stemColor: baseColor === "darkgreen" ? "Dark" : baseColor === "lavender" ? "Light" : "?",
				pod: peasData[0] === "smooth" ? "Smooth" : "Wrinkly",
				podColor: peasData[1] === "green" ? "Green" : "Gold",
				variegation: varieData || albino ? "Yes" : "No",
				variegationColor: albino || varieData ? ((albino ? baseColor: varieData![1]) === "gold" ? "Gold" : "White") : "?",
				variegationCount: albino ? 5 : varieData ? (+varieData[0] as 0 | 1 | 2 | 3 | 4 | 5) : "?",
				flower: (flowerData[0][0].toUpperCase() + flowerData[0].slice(1)) as PeaPhenotype["flower"],
				flowerColor: (flowerData[1][0].toUpperCase() + flowerData[1].slice(1)) as PeaPhenotype["flowerColor"],
			} satisfies PeaPhenotype,
		});
	};

	const topRow = form.querySelector(".horizontalflex.wrapflex.justify");
	if (!topRow) return failure("Top row missing");
	const topRowPlants = [...topRow.children].map(x => x.querySelector(".plantjail")).map(x => (x ? parsePlantJail(x) : x));
	if (topRowPlants.slice(1).includes(null)) return failure("Plant jail missing");

	if (topRowPlants.some(x => x?.ok === false)) return topRowPlants.find(x => !x!.ok)!;
	const testee = topRowPlants.includes(null) ? null : topRowPlants.find(x => !x?.data?.letter)!.data!;
	const testers = topRowPlants.filter(x => x?.data?.letter)!.map(x => x!.data!) as { phenotype: PeaPhenotype; letter: "a" }[];
	const parent1 = (form.querySelector("#parent_a") as HTMLSelectElement | null)?.value;
	const parent2 = (form.querySelector("#parent_b") as HTMLSelectElement | null)?.value;
	// if (!parent1 || !parent2) return failure("Parent missing");
	const bottomRow = doc.querySelectorAll(".horizontalflex.wrapflex.justify")?.[1];
	if (!bottomRow) return failure("Bottom row missing");
	const bottomRowPlants = [...bottomRow.children].map(x => x.querySelector(".plantjail")).map(x => (x ? parsePlantJail(x) : x));
	if (bottomRowPlants.includes(null)) return failure("Plant jail missing");

	if (bottomRowPlants.some(x => !x!.ok)) return bottomRowPlants.find(x => !x!.ok)!;

	return success({
		testee,
		testers,
		parents: parent1 === undefined ? null : [parent1 as "a", parent2 as "a"],
		descendants: bottomRowPlants.map(x => x!.data!),
	});
};
