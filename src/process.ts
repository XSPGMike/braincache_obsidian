import { BcSet } from './types'

export const cardTemplate = (deck?: boolean) => {
  if(deck)
    return (`#deck_deckname\n\n#q\n\n#a\n\n\n---\n`)
  return (`#q\n\n#a\n\n\n---\n`)
}

export const processCards = (unprocessedCards: string): {question: string, answer: string}[] => {
  return unprocessedCards
    .split('q:')
    .filter(unprocessedCard => unprocessedCard !== '')
    .map(unprocessedCard => {

      let question = unprocessedCard
        .split('a:')[0]

      if(question && question[0] === '\n'){
        question = question.slice(1)
      } else {
        return
      }

      let answer = unprocessedCard
        .split('a:')[1]

      if(answer && answer[0] === '\n'){
        answer = answer.slice(1)
      } else {
        return
      }

      let id = null

      // check if the card contains a remoteId, if it does, strip it
      if(answer && answer.contains('<!--id:')){
        id = answer
          .split('<!--id:')[1]
          .split('-->')[0]
        answer = answer.split('<!--id:')[0] + answer.split('-->')[1]
      }

      return {
        question,
        answer,
        id
      }
    })
    .filter(processed => processed)
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

// if a deck is cited in multiple files it will generate multiples entries in BcSet[], we merge them here
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
