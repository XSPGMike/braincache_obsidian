## braincache-obsidian plugin
<img src="https://braincache.co/android-chrome-192x192.baef1f58.png" width=100/>

Create braincache flashcards directly from Obsidian.

### what is this?

This is a companion plugin for [braincache](https://braincache.co)

### installation

You can install this plugin from the community section in Obsidian.

Alternatively, you can download the latest release and put it into your vault's plugins folder at:

`your-vault/.obsidian/plugins`

after having installed the plugin you should login:
1. press the braincache ribbon button
2. go to [braincache settings](https://braincache.co/settings) and copy your obsidian token
3. paste your token, you are good to go!

### how does it work?

Cards can be defined in any of your markdown files with the following syntax:

```md

  	#deck deckname

  	q:

  	this is a question?

  	a:
	
	this is an answer.

```

images can also be included, they will be uploaded to braincache's server

```md
	
	#deck deckname
	
	q:
	
	this is a question with an image?
	![[image.png]]
	
	a:
	
	this is an answer.

```

Pressing the ribbon button or using the "sync" command will synchronize the local cards with your braincache account.

The plugin is currently in an extremely early stage of development, you **will** encounter bugs, when you do please file an issue.
