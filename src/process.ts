// @ts-ignore
import { marked } from "marked";
import { TFile } from "obsidian";
import { BcSet, Card } from "./types";

export const cardTemplate = (deck?: boolean) => {
	if (deck) return `#deck deckname\n\nq:\n\na:\n\n`;
	return `q:\n\na:\n\n`;
};

const parseImages = (content: string): string => {
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

export const processCards = (
	unprocessedCards: string
): { question: string; answer: string; id: string | null }[] => {
	return unprocessedCards
		.split("q:")
		.filter((unprocessedCard) => unprocessedCard !== "")
		.map((unprocessedCard) => {
			let question = unprocessedCard.split("a:")[0];

			if (question && question[0] === "\n") {
				question = question.slice(1);
			} else {
				return;
			}

			let answer = unprocessedCard.split("a:")[1];

			if (answer && answer[0] === "\n") {
				answer = answer.slice(1);
			} else {
				return;
			}

			let id;

			// check if the card contains a remoteId, if it does, strip it
			if (answer && answer.contains("<!--id:")) {
				id = answer.split("<!--id:")[1].split("-->")[0];
				answer = answer.split("<!--id:")[0] + answer.split("-->")[1];
			}

			question = parseImages(question);
			answer = parseImages(answer);

			return {
				question: marked.parse(question),
				answer: marked.parse(answer),
				id,
			};
		})
		.filter((processed) => processed);
};

const parseRawDeck = (raw: string): { deck: string; cards: Card[] } => {
	let [deck, ...rest] = raw
		.split("\n")
		.filter((l) => l)
		.map((l) => l.trim());
	const cards: Card[] = [];
	let q,
		a = false;

	for (const r of rest) {
		switch (r) {
			case "q:":
				q = true;
				cards.push({ q: "", a: "" });
				break;
			case "a:":
				if (q) [q, a] = [false, true];
				break;
			case "---":
				[q, a] = [false, false];
			default:
				if (q || a) {
					let lc = cards.at(-1);
					if (q) {
						lc["q"] += r + "\n";
					} else if (a) {
						lc["a"] += r + "\n";
					}
					cards[cards.length - 1] = lc;
				}
				break;
		}
	}

	for (const c of cards) {
		if (!c["q"] || !c["a"]) {
			throw new Error("Invalid card construction");
		}
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
	};
};

// map each deck name to the files that contain its cards
export const parseDecks = (files: Map<TFile, string>): BcSet => {
	const bcSet: BcSet = new Map();
	for (const [file, content] of files.entries()) {
		const rawDecks = content.split("#deck").filter((d) => d);
		for (const rd of rawDecks) {
			const { deck, cards } = parseRawDeck(rd);
			if (bcSet.has(deck))
				bcSet.set(deck, [...bcSet.get(deck), { file, cards }]);
			else bcSet.set(deck, [{ file, cards }]);
		}
	}
	return bcSet;
};

// deck: {file: cards, file: card}

//	postProcess(
//		files.flatMap((deckFile) => {
//			return deckFile
//				.split("#deck ")
//				.filter(
//					(unprocessedDeck) =>
//						unprocessedDeck &&
//						unprocessedDeck !== "\n" &&
//						unprocessedDeck.includes("q:") &&
//						unprocessedDeck.includes("a:")
//				)
//				.map((cleanUDeck) => {
//					let deckName = cleanUDeck.split("\n")[0];
//          if(deckName === "#deck")
//            deckName = ''
//					const unprocessedCards = cleanUDeck
//						.split("\n")
//						.filter((row, i) => i !== 0 && row !== "")
//						.join("\n");
//
//					const cards = processCards(unprocessedCards);
//					return {
//						deckName,
//						cards,
//					};
//				})
//        .filter(d => d.deckName.length > 0)
//		})
//;

// if a deck is cited in multiple files it will generate multiples entries in BcSet[], we merge them here
export const postProcess = (rawDecks: BcSet[]): BcSet[] => {
	const decks: BcSet[] = [];
	for (const rawDeck of rawDecks) {
		const deck = decks.find((deck) => deck.deckName === rawDeck.deckName);
		deck
			? (deck.cards = deck.cards.concat(rawDeck.cards))
			: decks.push(rawDeck);
	}
	return decks;
};

export const applyPatches = async (
	patches: any[],
	mdFiles: TFile[],
	mdFileContents: string[],
	vault: any
) => {
	for (const file of mdFiles) {
		let content = mdFileContents[mdFiles.indexOf(file)];
		let newContent: string[] = [];

		// patching should be done using more detailed data
		// {
		//  deckName: {
		//    ["filename"]: [1, 2, 3]
		//  }
		// }

		content
			.split("\n")
			.forEach((row: string, idx: number, arr: string[]) => {
				newContent.push(row);
				if (row === "a:" && !arr[idx + 1].includes("<!--id:")) {
					newContent.push(`<!--id:${patches.shift()}-->`);
				} else if (row === "a:") {
					patches.shift();
				}
			});

		await vault.modify(file, newContent.join("\n"));
	}
};
