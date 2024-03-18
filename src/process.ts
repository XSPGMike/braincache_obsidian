// @ts-ignore
import { marked } from "marked";
import { TFile } from "obsidian";
import { BcMap, Card } from "./types";

export const cardTemplate = (deck?: boolean) => {
	if (deck) return `#deck deckname\n\nq:\n\na:\n\n`;
	return `q:\n\na:\n\n`;
};

// convert md image to valid html
const imgMDtoHTML = (content: string): string => {
	return content
	.split("\n")
	.map((content) => {
		if (content.contains("![[")) {
			const localImage = content.split("![[")[1].split("]]")[0];
			return (
				content.split("![[")[0] +
					`<figure><img src=\"${localImage}\"></img></figure>` +
					content.split("]]")[1]
			);
		}
		return content;
	})
	.join("\n");
};

const parseRawDeck = (raw: string, line: number): {deck: string; cards: Card[]; lines: number[] } => {
	let [deck, ...rest] = raw.split("\n").map(l => l.trim())

	const cards: Card[] = [];
	let q, a = false;
	const lines = []

	for (const [i, r] of rest.entries()) {
		if(r === 'q:') {
			q = true;
			cards.push({ q: "", a: "" });
		} else if(r === 'a:') {
			if (q) {
				[q, a] = [false, true];
				lines.push(line+i+2)
			}
		} else if(r === '#end-deck') {
			[q, a] = [false, false]
		} else {
			if (q || a) {
				let lc = cards.at(-1);
				if (q) {
					lc["q"] += r + "\n";
				} else if (a) {
					if(r.contains("<!--id:")){
						lc.id = r.split("<!--id:")[1].split("-->")[0]
						continue
					}
					lc["a"] += r + "\n";
				}
				cards[cards.length - 1] = lc;
			}
		}
	}

	for (let [i, c] of cards.entries()) {
		let { q, a } = c
		if(!q || !a) {
			throw new Error(`Invalid card construction, missing ${!q ? 'question' : 'answer'}`)
		}
		q = marked(q)
		a = marked(a)
		cards[i] = {...c, q, a}
	}

	if (q || a) {
		throw new Error("Card wasn't closed");
	}

	if (cards.length === 0) {
		throw new Error("No cards, remove deck tag");
	}

	return {
		deck,
		cards,
		lines,
	};
};

// map each deck name to the files that contain its cards
export const parseDecks = (files: Map<TFile, string>): BcMap => {
	const bcMap: BcMap = new Map();
	for (const [file, content] of files.entries()) {
		let cnt = 0
		const deckStrings = content.split("#deck").filter((d) => d)
		const rawDecks: [d: string, line: number][] = []
		for(const d of deckStrings) {
			rawDecks.push([d, cnt])
			cnt += d.split('\n').length
		}
		for (const [rd, line] of rawDecks) {
			try {
				const { deck, cards, lines } = parseRawDeck(rd, line);
				if (bcMap.has(deck))
					bcMap.set(deck, [...bcMap.get(deck), { file, cards, lines }]);
				else bcMap.set(deck, [{ file, cards, lines }]);
			} catch(e) {
				throw e
			}
		}
	}
	return bcMap;
};
