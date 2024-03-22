import { Vault, TFile } from "obsidian";
import { Card, BcMap } from "./types";

const API_URL = "https://api.braincache.co";
const api = (endPoint: string) => `${API_URL}/${endPoint}`;

const token = () => {
	return localStorage.getItem("braincache-token");
};

export async function checkAuth(): Promise<boolean> {
	if (token()) {
		const res = await fetch(api("auth/status"), {
			headers: {
				Authorization: `Bearer ${token()}`,
			},
		});

		if (res.status !== 200) {
			localStorage.removeItem("braincache-token");
		}

		return res.status === 200;
	}

	return false;
}

async function getDeck(deckName: string): Promise<string> {
	let res = await fetch(api("decks"), {
		headers: {
			Authorization: `Bearer ${token()}`,
		},
	});
	const decks = await res.json();
	return decks.find((d: any) => d.name === deckName)?.deckId;
}

async function createDeck(deckName: string): Promise<string> {
	const response = await fetch(api("decks"), {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token()}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			name: deckName,
		}),
	});
	const deck = await response.json();
	return deck.deckId;
}

async function getOrCreateDeck(deckName: string): Promise<string | undefined> {
	if (deckName.length === 0) return;
	/* the deck hasn't been used locally yet, this checks if a deck with the same name exists on the server */
	let deckId;
	if (deckId = await getDeck(deckName))
		return deckId;

	/* a deck with that name doesn't exists on the sever, hence it gets created */
	deckId = await createDeck(deckName)
	return deckId
}

async function getBinary(img: string, vault: Vault) {
	let file;
	if ((file = vault.getFiles().filter((el: TFile) => el.name === img)[0])) {
		const fileBuffer = await vault.readBinary(file);
		return { data: fileBuffer, name: file.name };
	}
}

async function uploadMedia(card: Card, vault: Vault): Promise<Card> {
	for (const entry of ["q", "a"])
		if (card[entry as "q" | "a"].includes('<img src="')) {
			const entryImages = card[entry as "q" | "a"]
				.match(/<img [^>]*src="[^"]*"[^>]*>/gm)
				.map((x) => x.replace(/.*src="([^"]*)".*/, "$1"));
			const entryBinaries = [];

			for (const qImage of entryImages) {
				const imageBuffer = await getBinary(qImage, vault);
				entryBinaries.push(
					new File([imageBuffer.data], imageBuffer.name)
				);
			}

			const remoteImagesIds: string[] = [];
			for (const bin of entryBinaries) {
				const formData = new FormData();
				formData.append("media", bin);
				const res = await fetch(api(`cards/media`), {
					headers: {
						Authorization: `Bearer ${token()}`,
					},
					method: "POST",
					body: formData,
				});
				const json = await res.json();
				remoteImagesIds.push(json.url);
			}

			card[entry as "q" | "a"] = card[
				entry as "q" | "a"
			]
				.split("\n")
				.map((n) => {
					if (n.includes('src="')) {
						const next = n.replace(
							/src="(?:[^'\/]*\/)*([^']+)"/g,
							`src="${remoteImagesIds.shift()}"`
						);
						return next;
					} else {
						return n;
					}
				})
				.join("\n");
		}
		console.log(card)
	return card;
}

async function uploadCards(deckId: string, cards: Card[], vault?: Vault): Promise<string[]> {

  async function createCard(deckId: string, card: Card): Promise<Response> {
	card = await uploadMedia(card, vault)
    return fetch(api(`decks/${deckId}/card`), {
      method: "POST",
      headers,
      body: JSON.stringify({
        front: card.q,
        back: card.a
      })
    })
  }

  async function updateCard(card: Card): Promise<Response> {
    if(!card.id) throw new Error("Card Id is not defined")
	card = await uploadMedia(card, vault)
    return fetch(api(`cards/${card.id}`), {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        front: card.q,
        back: card.a
      })
    })
  }

	const headers = {
		authorization: `Bearer ${token()}`,
		"content-type": "application/json",
	}

  let promises = []
  for(const card of cards){
    if(!card.id)
      promises.push(createCard(deckId, card))
    else
      promises.push(updateCard(card))
  }

  const responses = await Promise.all(promises)

  const cardIds = []

  for(const response of responses){
    const { cardId } = await response.json()
    cardIds.push(cardId)
  }

  return cardIds
}

async function writeIds(vault: Vault, file: TFile, ids: string[], lines: number[]){
  if(lines.length !== ids.length)
    throw new Error("Less cards than expected")

  for(const [i, id] of ids.entries()){
    const contents = await vault.read(file)
    const splits = contents.split("\n")
	if(splits[lines[i]] !== `<!--id:${id}-->`) {
		splits.splice(lines[i]+i, 0, `<!--id:${id}-->`)
		vault.modify(file, splits.join('\n'))
	}
  }
}

export async function syncDecks(cardSets: BcMap, vault: Vault){
	for (const [name, data] of cardSets) {
		const deck = await getOrCreateDeck(name)
		for (const { file, cards, lines } of data) {
		  const cardIds = await uploadCards(deck, cards, vault)
		  await writeIds(vault, file, cardIds, lines)
		}
	}
}
