import { BcSet } from './types'

export const cardTemplate = (deck?: boolean) => {
  if(deck)
    return (`#deck_deckname\n\n#q\n\n#a\n\n\n---\n`)
  return (`#q\n\n#a\n\n\n---\n`)
}

export const processCards = (unprocessedCards: string): {question: string, answer: string}[] => {
  return unprocessedCards
    .split('---')
    .filter(unprocessedCard => unprocessedCard !== '')
    .map(unprocessedCard => {

      const question = unprocessedCard
        .split('#q')[1]
        .split('\n')[1]
        .split('#a')[0]

      const answer = unprocessedCard.split('#a')[1].split('\n')[1]

      return {
        question,
        answer
      }
    })
}

// extracts decks and cards from all .md files
export const processDecks = (files: string[]): BcSet[] => (
  postProcess(files
    .filter(file => file.includes('#deck'))
    .flatMap(deckFile => {
      return deckFile
        .split('#deck_')
        .filter(unprocessedDeck => (
          unprocessedDeck && unprocessedDeck !== '\n'
        ))
        .map(cleanUDeck => {

          const deckName = cleanUDeck
            .split('\n')[0]
            .split(' ')[0]

          const unprocessedCards = cleanUDeck
            .split('\n')
            .filter((row, i) => i !== 0 && row !== '')
            .join('\n')

          return {
            deckName,
            cards: processCards(unprocessedCards)
          }
        })
      })
  )
)

// merges cards of the same deck
export const postProcess = (rawDecks: BcSet[]): BcSet[] => {
  const decks: BcSet[] = []
  for(const rawDeck of rawDecks) {
    const deck = decks.find(deck => deck.deckName === rawDeck.deckName)
    if(deck) {
      deck.cards = deck.cards.concat(rawDeck.cards)
    } else {
      decks.push(rawDeck)
    }
  }
  return decks
}
