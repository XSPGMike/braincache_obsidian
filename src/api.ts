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

async function createDeck(deckName: string): Promise<string>{
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
    const deckId = await createDeck(set.deckName);
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
