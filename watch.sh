#!/bin/sh
while inotifywait -e close_write main.js ; do cp -r * ../test/.obsidian/plugins/braincache-obsidian ; done
