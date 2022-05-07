export interface Card {
	question: string;
	answer: string;
	id?: string | null;
}

export interface BcSet {
	deckName: string;
	cards: Card[];
}
