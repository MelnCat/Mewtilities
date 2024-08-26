import { PartialCatGene } from "@/util/cat";

export const CatGeneDisplay = (data: { gene: string } | { gene: PartialCatGene }) => {
	if (typeof data.gene !== "string") return <CatGeneDisplay gene={deserialize} />
}