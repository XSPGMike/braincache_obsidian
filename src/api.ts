import { BcSet } from './types';

const token = () => { 
  return localStorage.getItem("braincache-token")
};

export async function checkAuth(): Promise<boolean> {
  if(token()){
  const res = await fetch("https://api.braincache.co/auth/status", {
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
  let res = await fetch(`https://api.braincache.co/decks/${deckId}`, {
    headers: {
    "Authorization": `Bearer ${token()}`
    }
  })

  return res.status === 200
}

async function findRemoteDeck(deckName: string): Promise<string> {
  let res = await fetch(`https://api.braincache.co/decks`, {
    headers: {
      "Authorization": `Bearer ${token()}`
    }
  })
  const decks = await res.json()
  return decks.find((d: any) => d.name === deckName)?.deckId
}

async function findOrCreateDeck(deckName: string): Promise<string>{
  let deckId = localStorage.getItem(`bcDeck_${deckName}`)

  // check if deck is still present on the server
  if(deckId){
    if(await remoteDeckExists(deckId)){
      return deckId
    }
  }

  deckId = await findRemoteDeck(deckName)

  if(deckId){
    return deckId
  }

  const response = await fetch("https://api.braincache.co/decks/", {
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

export async function uploadCards(cardSets: BcSet[]): Promise<{status: boolean}>{
  const promises = []
  for(const set of cardSets){
    const deckId = await findOrCreateDeck(set.deckName);
    localStorage.setItem(`bcDeck_${set.deckName}`, deckId)
    for(const card of set.cards){
      promises.push(fetch(`https://api.braincache.co/decks/${deckId}/card`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          front: card.question,
          back: card.answer
        })
      }))
    }
  }

  const res = await Promise.all(promises)

  return {
    status: res.every(r => r.status === 201)
  }
}
