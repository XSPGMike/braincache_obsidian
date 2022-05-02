// @ts-ignore
import { marked } from 'marked';
import { BcSet } from './types'

export const cardTemplate = (deck?: boolean) => {
  if(deck)
    return (`#deck deckname\n\nq:\n\na:\n\n`)
  return (`q:\n\na:\n\n`)
}

const parseImages = (content: string): string => {
  return content
    .split('\n')
    .map((content) => {
      if(content.contains('![[')){
        const localImage = content.split('![[')[1].split(']]')[0]
        return content.split('![[')[0] + `<figure><img src=\"${localImage}\"></img></figure>` + content.split(']]')[1]
      }
      return content
    })
    .join('\n')
}

export const processCards = (unprocessedCards: string): 
  { question: string, 
    answer: string, 
    id: string | null}[] => {
  const processedCards = unprocessedCards
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

      question = parseImages(question)
      answer = parseImages(answer)

      return {
        question: marked.parse(question),
        answer: marked.parse(answer),
        id
      }
    })
    .filter(processed => processed)

  return processedCards
}

// extracts decks and cards from all .md files
export const processDecks = (files: string[]): BcSet[] => (
  postProcess(files
    .filter(file => file.includes('#deck'))
    .flatMap(deckFile => {
      return deckFile
        .split('#deck ')
        .filter(unprocessedDeck => (
          unprocessedDeck && unprocessedDeck !== '\n'
        ))
        .map(cleanUDeck => {

          const deckName = cleanUDeck
            .split('\n')[0]

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
    deck 
      ? deck.cards = deck.cards.concat(rawDeck.cards)
      : decks.push(rawDeck)
  }
  return decks
}

export const applyPatches = async(patches: any[], vault: any) => {
  const files = vault.getMarkdownFiles()
  for(const file of files){
    const content = await vault.cachedRead(file)
    let newContent: string[] = []

    content
      .split('\n')
      .forEach((row: string, idx: number, arr: string[]) => {
        newContent.push(row)
        if(row === 'a:' && !arr[idx+1].includes('<!--id:')){
          newContent.push(`<!--id:${patches.shift()}-->`)
        } else if(row === 'a:'){
          patches.shift()
        }
      })

    await vault.modify(file, newContent.join('\n'))
  }
}
