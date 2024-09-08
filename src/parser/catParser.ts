import { parseDom } from "@/util/dom";
import { failure, Result, success } from "@/util/result";
import { Cat, Season } from "@prisma/client";
import { readFileSync } from "fs";
import { HTML2BBCode } from "html2bbcode";
import { chunk } from "remeda";

export type RawCat = Omit<Cat, "trinketId" | "clothing"> & { trinketName: string | null; clothingKeys: string[] };

export const parseCatPage = (content: string): Result<RawCat> => {
	const doc = parseDom(content);
	const form = doc.querySelector(".forum-post-group");
	if (!form) return failure("Invalid page layout");
	const builder = {} as Partial<RawCat>;
	const title = doc.querySelector(".cat-title b")?.textContent;
	if (!title) return failure("Invalid title");
	builder.name = title;
	const columns = [...form.querySelectorAll(".bio-group-column")];
	const findColumn = (text: string) =>
		columns
			.find(x => x.children[0]?.textContent?.startsWith(text))
			?.querySelector(".bio-group-end")
			?.textContent?.trim();
	const birthdayText = findColumn("Birthday");
	if (!birthdayText) return failure("Missing birthday");
	const birthdayComponents = birthdayText.match(/(\w+) (\d+), Year (\d+)/);
	if (
		!birthdayComponents?.[1] ||
		!birthdayComponents?.[2] ||
		!birthdayComponents?.[3] ||
		!(birthdayComponents?.[1]?.toUpperCase() in Season) ||
		isNaN(+birthdayComponents?.[2]) ||
		isNaN(+birthdayComponents?.[3])
	)
		return failure("Birthday text missing or invalid");
	builder.birthYear = +birthdayComponents?.[3];
	builder.birthSeason = Season[birthdayComponents?.[1]?.toUpperCase() as keyof typeof Season];
	builder.birthDay = +birthdayComponents?.[2];

	const wind = findColumn("Wind");
	if (!wind) return failure("Missing wind");
	builder.wind = wind;

	const age = findColumn("Age")?.match(/(\w+) \((.+?)\)/);
	if (!age?.[1] || !age?.[2]) return failure("Missing age");
	builder.ageType = age?.[1];
	builder.ageNumber = age?.[2];

	const pronouns = findColumn("Pronouns");
	if (!pronouns) return failure("Missing pronouns");
	builder.pronouns = pronouns;

	const origin = findColumn("Origin");
	if (!origin) return failure("Missing origin");
	builder.origin = origin;

	const id = findColumn("ID Code")?.match(/\[cat=(\d+)\]/)?.[1];
	if (!id || isNaN(+id)) return failure("ID missing or invalid");
	builder.id = +id;

	const species = findColumn("Species");
	if (!species) return failure("Species missing");
	builder.species = species;

	const size = findColumn("Size")?.match(/([\d.]+) lbs\. \/ ([\d.]+) kg/);
	if (!size?.[1] || !size?.[2] || isNaN(+size?.[1]) || isNaN(+size?.[2])) return failure("Size missing or invalid");
	builder.sizeLb = +size?.[1];
	builder.sizeKg = +size?.[2];

	const fur = findColumn("Fur");
	if (!fur) return failure("Fur missing");
	builder.fur = fur;

	const color = findColumn("Color");
	if (!color) return failure("Color missing");
	builder.color = color;

	const pattern = findColumn("Pattern");
	if (!pattern) return failure("Pattern missing");
	builder.pattern = pattern;

	const whiteMarks = findColumn("White Marks");
	if (!whiteMarks) return failure("White marks missing");
	builder.whiteMarks = whiteMarks;

	const accentColor = findColumn("Accent Color");
	builder.accentColor = accentColor ?? null;

	const eyeColor = findColumn("Eye Color");
	if (!eyeColor) return failure("Eye color missing");
	builder.eyeColor = eyeColor;

	const mayorBonusText = form.querySelector(":where(#base-stats, #total-stats) + .genes-code")?.textContent?.matchAll(/([+-]\d+) (\w+)/g);
	const statBonuses: Record<string, number> = {};
	const trinketBonusText = form.querySelector(".trinket-subgroup .bio-group-label")?.textContent?.matchAll(/(\w+) ([+-]\d+)/g);
	if (mayorBonusText)
		for (const bonus of mayorBonusText) {
			statBonuses[bonus[2].toLowerCase()] = +bonus[1];
		}
	if (trinketBonusText)
		for (const bonus of trinketBonusText) {
			const name = bonus[1].toLowerCase();
			if (name in statBonuses) statBonuses[name] += +bonus[2];
			else statBonuses[name] = +bonus[2];
		}

	const reverseBonus = (data: string | null | undefined, name: string) => {
		if (data === null || data === undefined || data.trim() === "") return null;
		if (name in statBonuses) return +data - statBonuses[name];
		return +data;
	};

	console.log(statBonuses)
	const bravery = findColumn("Bravery");
	//if (!bravery || isNaN(+bravery)) return failure("Bravery missing");
	builder.bravery = reverseBonus(bravery, "bravery");

	const benevolence = findColumn("Benevolence");
	builder.benevolence = reverseBonus(benevolence, "benevolence");

	const energy = findColumn("Energy");
	builder.energy = reverseBonus(energy, "energy");

	const extroversion = findColumn("Extroversion");
	builder.extroversion = reverseBonus(extroversion, "extroversion");

	const dedication = findColumn("Dedication");
	builder.dedication = reverseBonus(dedication, "dedication");

	const jobLoop = [...form.querySelectorAll(".cat-title-loop")].find(x => x.firstChild?.textContent?.startsWith("Day Job"));
	const toNumberOrUndefined = (str: string | undefined) => (str === undefined ? undefined : +str);
	if (jobLoop) {
		const childNodes = [...jobLoop.childNodes].filter(x => x.textContent?.trim());
		const job = childNodes[1]?.textContent?.match(/[\w ]+/)?.[0]?.trim();
		if (!job) return failure("Job missing or invalid");
		builder.job = job;
		const jobCol = jobLoop.querySelector(".bio-group-column");
		if (!jobCol) return failure("Job column missing or invalid");
		const jobXp = [...jobCol.childNodes]
			.filter(x => x.nodeType === x.TEXT_NODE && x.textContent?.trim())
			.map(
				x =>
					[
						x.textContent?.match(/(.+?) Level/)?.[1],
						{
							level: toNumberOrUndefined(x.textContent?.match(/Level (\d+)/)?.[1]),
							xp: x.textContent?.includes("Maximum Level") ? 0 : toNumberOrUndefined(x.textContent?.match(/(\d+)\/\d+ EXP/)?.[1]),
						},
					] as const
			);
		if (jobXp.some(x => x[0] === undefined || x[1].level === undefined || x[1].xp === undefined)) return failure("Job xp invalid");
		builder.jobXp = Object.fromEntries(jobXp);
	} else {
		builder.job = null;
		builder.jobXp = null;
	}

	const classLoop = [...form.querySelectorAll(".cat-title-loop")].find(x => x.firstChild?.textContent?.startsWith("Adventuring Class"));
	if (classLoop) {
		const childNodes = [...classLoop.childNodes].filter(x => x.textContent?.trim());
		const clazz = childNodes[1]?.textContent?.match(/[\w ]+/)?.[0]?.trim();
		if (!clazz) return failure("Class missing or invalid");
		builder.class = clazz;
		const classCol = classLoop.querySelector(".bio-group-column");
		if (!classCol) return failure("class column missing or invalid");
		const classXp = [...classCol.childNodes]
			.filter(x => x.nodeType === x.TEXT_NODE && x.textContent?.trim())
			.map(
				x =>
					[
						x.textContent?.match(/(.+?) Level/)?.[1],
						{
							level: toNumberOrUndefined(x.textContent?.match(/Level (\d+)/)?.[1]),
							xp: x.textContent?.includes("Maximum Level") ? 0 : toNumberOrUndefined(x.textContent?.match(/(\d+)\/\d+ EXP/)?.[1]),
						},
					] as const
			);
		if (classXp.some(x => x[0] === undefined || x[1].level === undefined || x[1].xp === undefined)) return failure("Job xp invalid");
		builder.classXp = Object.fromEntries(classXp);
	} else {
		builder.class = null;
		builder.classXp = null;
	}
	// todo check if city
	const getStat = (id: string, name: string) => {
		if (form.querySelector("#base-stats")) {
			const content = form.querySelector(`#base-stats #${id}-num`)?.textContent;
			if (!content || isNaN(+content)) return null;
			return +content;
		} else if (form.querySelector("#total-stats")) {
			const content = form.querySelector(`#total-stats #${id}-num`)?.textContent;
			if (!content || isNaN(+content)) return null;
			return reverseBonus(content, name);
		} else return null;
	};
	const strength = getStat("str", "strength");
	builder.strength = strength;

	const agility = getStat("agi", "agility");
	builder.agility = agility;

	const health = getStat("hlth", "health");
	builder.health = health;

	const finesse = getStat("fin", "finesse");
	builder.finesse = finesse;

	const cleverness = getStat("clev", "cleverness");
	builder.cleverness = cleverness;

	const perception = getStat("per", "perception");
	builder.perception = perception;

	const luck = getStat("luck", "luck");
	builder.luck = luck;

	const centerMessage = doc.querySelector(".formlike-content-area.center")?.textContent;
	builder.travelling = centerMessage?.includes("is currently out travel") ?? false;

	const location = doc.querySelector(".location-text")?.textContent?.replaceAll("★", "").trim();
	if (!location) return failure("Location missing");
	builder.location = location;

	const genetic = form.querySelector(".genes-code.cat-minigroup")?.textContent?.match(/\w+/g);
	if (genetic) builder.genetic = genetic.join("") === "UnknownGeneticString" ? null : genetic.join("");

	const friends = [...form.querySelectorAll(".cat-title-loop")].find(x => x.firstChild?.textContent?.startsWith("Friends"))?.querySelector(".bio-scroll");
	if (!friends) return failure("Friends missing");
	if (friends?.textContent?.trim() === "n/a") builder.friends = {};
	else {
		const found = chunk(
			[...friends.childNodes].filter(x => x?.textContent?.trim()),
			2
		).map(x => [
			([...x[0].childNodes].find(x => (x as HTMLElement).tagName === "A") as HTMLElement)?.getAttribute("href")?.match(/&id=(\d+)/)?.[1],
			x[1]?.textContent?.replace("- ", "").trim(),
		]);
		if (found.some(x => x.includes(undefined))) return failure("Friends invalid");
		builder.friends = Object.fromEntries(found);
	}
	const family = [...form.querySelectorAll(".cat-title-loop")].find(x => x.firstChild?.textContent?.startsWith("Family"))?.querySelector(".bio-scroll");
	if (!family) return failure("Family missing");
	if (family?.textContent?.trim() === "n/a") builder.family = {};
	else {
		const found = chunk(
			[...family.childNodes].filter(x => x?.textContent?.trim()),
			2
		).map(x => [
			((x[0] as HTMLElement).tagName === "A" ? (x[0] as HTMLElement) : (x[0].childNodes[0] as HTMLElement))?.getAttribute("href")?.match(/&id=(\d+)/)?.[1],
			x[1]?.textContent?.replace("- ", "").trim(),
		]);
		if (found.some(x => x.includes(undefined))) return failure("Family invalid");
		builder.family = Object.fromEntries(found);
	}

	const ownerName = doc
		.querySelector(".breadcrumbs > p")
		?.firstChild?.textContent?.match(/(.+)\'s Village/)?.[1]
		.trim();
	builder.ownerName = ownerName ?? null;

	const ownerId = doc
		.querySelector(".breadcrumbs > p > a")
		?.getAttribute("href")
		?.match(/&id=(\d+)/)?.[1]
		.trim();
	builder.ownerId = ownerId ? +ownerId : null;

	const personality = doc
		.querySelector(".cat-bio-column1 .rune-group:nth-child(4) .cat-minigroup-r")
		?.textContent?.match(/(.+) Personality/)?.[1]
		.trim();
	if (!personality) return failure("Personality missing or invalid");
	builder.personality = personality;

	const trinket = doc
		.querySelector(".horizontalflex:has(.trinket-group) .itemjail img")
		?.getAttribute("src")
		?.match(/trinkets\/(.*)\.png/)?.[1];
	builder.trinketName = trinket === "" ? null : trinket ?? null;

	const bioElement = doc.querySelector(".cat-title + .editable-userpage-contents");
	if (bioElement) {
		const bio = new HTML2BBCode().feed(bioElement.innerHTML).toString();
		builder.bio = bio;
	} else builder.bio = null;

	const clothing = [...form.querySelectorAll(".catjail .cat-clothes")].map(x => x.getAttribute("src")?.match(/\/(\w+)\.png/)?.[1]);
	if (clothing.includes(undefined)) return failure("Clothing missing or invalid");
	builder.clothingKeys = clothing as string[];

	return success(builder as RawCat);
};