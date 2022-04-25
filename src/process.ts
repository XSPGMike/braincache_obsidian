export const cardTemplate = (deck?: boolean) => {
  if(deck)
    return (`#deck_deckname\n\n#q\n\n#a\n\n\n---\n`)
  return (`#q\n\n#a\n\n\n---\n`)
}
