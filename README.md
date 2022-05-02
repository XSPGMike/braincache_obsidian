## braincache-obsidian plugin

create your braincache flashcards directly from obsidian

### what is this?

this is a companion plugin for [braincache](https://braincache.co)

### installation

you can install this plugin from the community section in Obsidian.
alternatively, you can clone this repository into your vault's plugin folder, which is located at `your-vault/.obsidian/plugins`

after having installed the plugin you should login:
1. press the braincache ribbon button
2. go to [braincache settings](https://braincache.co/settings) and copy your obsidian token
3. paste your token, you are good to go!

### how does it work?

you can define cards in any of your markdown files with the following syntax:

```md

  #deck deckname

  q:

  this is a question?

  a:

  this is an answer

```

pressing the ribbon button or using the "sync" command will synchronize the local cards with your braincache account.
