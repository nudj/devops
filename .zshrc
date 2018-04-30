source /root/.zsh/zsh-autosuggestions/zsh-autosuggestions.zsh

PROMPT='devops» '

alias backup="zsh /usr/src/scripts/backup"
alias deploy="zsh /usr/src/scripts/deploy"
alias execute="zsh /usr/src/scripts/execute"
alias migrate="zsh /usr/src/scripts/migrate"
alias restore="zsh /usr/src/scripts/restore"

alias ll="ls -la"
alias d="docker"
alias dm="docker-machine"
alias ds="docker-swarm"
alias dco="docker-compose -p nudj -f ./local/server/docker-compose.yml -f ./local/web/docker-compose.yml -f ./local/hire/docker-compose.yml -f ./local/admin/docker-compose.yml -f ./local/api/docker-compose.yml"

# changes hex 0x15 to delete everything to the left of the cursor,
# rather than the whole line
bindkey "^U" backward-kill-line

# binds hex 0x18 0x7f with deleting everything to the left of the cursor
bindkey "^X\\x7f" backward-kill-line

# adds redo
bindkey "^X^_" redo

# history substring search
zle -N history-substring-search-up
zle -N history-substring-search-down
bindkey "^[OA" history-substring-search-up
bindkey "^[OB" history-substring-search-down

source /root/.zsh/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh
source /root/.zsh/zsh-history-substring-search/zsh-history-substring-search.zsh

setopt aliases
chmod 0600 ~/.ssh/id_nudj_staging ~/.ssh/id_nudj_demo
