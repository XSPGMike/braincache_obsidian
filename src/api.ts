import { BcSet } from './types';

const token = () => { 
  console.log(localStorage.getItem("braincache-token"));
  return localStorage.getItem("braincache-token")
};

export async function checkAuth(): Promise<boolean> {
  const res = await fetch("https://api.braincache.co/auth/status", {
    headers: {
      cookie: `session=${token()}`
    },
    credentials: 'include'
  })
  if(res.status !== 200) {
    localStorage.removeItem("braincache-token");
  }
  return res.status === 200;
}

async function createDeck(deckName: string): Promise<string>{
  const response = await fetch("https://api.braincache.co/decks", {
    method: "POST",
    body: JSON.stringify({
      "name": deckName
    }),
    headers: {
      cookie: `session=${token()}`,
      contentType: "application/json"
    },
    credentials: 'include'
  })

  const deck = await response.json();
  return deck.deckId;
}

export async function uploadCards(cardSets: BcSet[]): Promise<{status: number}>{
  for(const set of cardSets){
    const deckId = await createDeck(set.deckName);
    console.log(deckId);
  }

  return {
    status: 500
  }
}
