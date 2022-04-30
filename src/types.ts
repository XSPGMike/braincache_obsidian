export interface BcSet {
  deckName: string;
  cards: {
    question: string;
    answer: string;
    id?: string | null;
  }[]
}
