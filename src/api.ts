import { Vault, TFile } from 'obsidian'
import { Card, BcSet } from './types';

const API_URL = "https://api.braincache.co"
const api = (endPoint: string) => `${API_URL}/${endPoint}` 

const token = () => { 
  return localStorage.getItem("braincache-token")
};

export async function checkAuth(): Promise<boolean> {
  if(token()){
  const res = await fetch(api('auth/status'), {
    headers: {
      "Authorization": `Bearer ${token()}`,
    }
  })

  if(res.status !== 200) {
    localStorage.removeItem("braincache-token");
  }

  return res.status === 200;
  } 

  return false
}

async function remoteDeckExists(deckId: string): Promise<boolean> {
  let res = await fetch(api(`decks/${deckId}`), {
    headers: {
    "Authorization": `Bearer ${token()}`
    }
  })

  return res.status === 200
}

async function findRemoteDeck(deckName: string): Promise<string> {
  let res = await fetch(api('decks'), {
    headers: {
      "Authorization": `Bearer ${token()}`
    }
  })
  const decks = await res.json()
  return decks.find((d: any) => d.name === deckName)?.deckId
}

async function findOrCreateDeck(deckName: string): Promise<string>{
  let deckId = localStorage.getItem(`bcDeck_${deckName}`)

  /* the deck has been used locally before, 
     this checks if it is still present on the server */
  if(deckId){
    if(await remoteDeckExists(deckId)){
      return deckId
    }
  }

  /* the deck hasn't been used locally yet, 
     this checks if a deck with the same name exists on the server */
  deckId = await findRemoteDeck(deckName)

  if(deckId){
    return deckId
  }

  /* the deck hasn't been used locally,
     a deck with that name doesn't exists on the sever, hence it gets created */
  const response = await fetch(api('decks'), {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token()}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: deckName
    })
  })

  const deck = await response.json();
  return deck.deckId;
}

async function getBinary(img: string, vault: Vault){
  let file
  if(file = vault.getFiles().filter((el: TFile) => el.name === img)[0]){
    const fileBuffer = await vault.readBinary(file)
    return {data: fileBuffer, name: file.name}
  }
}

/* if the card contains images they will be uploaded */
async function uploadMedia(card: Card, vault: Vault): Promise<Card>{
  if(card.question.includes('<img src="')){
    const questionImages = card.question.match(/<img [^>]*src="[^"]*"[^>]*>/gm)
                              .map(x => x.replace(/.*src="([^"]*)".*/, '$1'));
    const questionBinaries = []

    for(const qImage of questionImages){
      const imageBuffer = await getBinary(qImage, vault)
      questionBinaries.push(new File([imageBuffer.data], imageBuffer.name))
    }

    const remoteImagesIds: string[] = []
    for(const bin of questionBinaries){
      const formData = new FormData()
      formData.append('media', bin)
      const res = await fetch(api(`cards/media`), {
        headers: {
        "Authorization": `Bearer ${token()}`,
        },
        method: "POST",
        body: formData,
      })
      const json = await res.json()
      remoteImagesIds.push(json.url)
    }
    console.log(remoteImagesIds)

    card.question = card.question
      .split('\n')
      .map((n) => {
        if(n.includes('src="')){
          const next = n.replace(/src="(?:[^'\/]*\/)*([^']+)"/g, `src="${remoteImagesIds.shift()}"`);
          return next
        } else {
          return n
        }
      })
      .join('\n')
  }
  console.log(card)
  return card
}

export async function syncRemoteDecks(cardSets: BcSet[], vault: Vault): Promise<any[]>{
  const promises = []
  const headers = {
    "authorization": `Bearer ${token()}`,
    "content-type": "application/json"
  }
  for(const set of cardSets){
    const deckId = await findOrCreateDeck(set.deckName);
    localStorage.setItem(`bcDeck_${set.deckName}`, deckId)
    for(let card of set.cards){
      card = await uploadMedia(card, vault)
      /* if the card has an id it updates the remote card with the local contents, 
         otherwise creates a new one */
      if(card.id){
        promises.push(fetch(api(`cards/${card.id}`), {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            front: card.question,
            back: card.answer
          })
        }))
      } else {
        promises.push(fetch(api(`decks/${deckId}/card`), {
          method: "POST",
          headers,
          body: JSON.stringify({
            front: card.question,
            back: card.answer
          })
        }))
      }
    }
  }

  const results = await Promise.all(promises)

  /* this array will contain ids to apply to new cards, 
     with empty spaces in between in order to easily allocate them, 
     this is an hack and it sucks */

  const cardPatches = []
  for(const result of results){
    try {
      const data = await result.json()
      data.cardId
        ? cardPatches.push(data.cardId)
        : cardPatches.push(undefined)
      continue
    } catch( _ ) {}
    cardPatches.push(undefined)
  }

  return cardPatches
}
