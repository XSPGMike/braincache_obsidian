import { TFile } from "obsidian";

export interface Card {
	q: string;
	a: string;
	id?: string | null;
}

export type BcMap = Map<string, { file: TFile, cards: Card[], lines: number[]}[]>;
