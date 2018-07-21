FROM node:8
ARG NPM_TOKEN
RUN mkdir -p /usr/src && apt-get update && apt-get install -y zsh make git openssh-client docker python3 python3-pip rsync curl && mkdir /root/.zsh && git clone https://github.com/zsh-users/zsh-history-substring-search /root/.zsh/zsh-history-substring-search && git clone https://github.com/zsh-users/zsh-autosuggestions /root/.zsh/zsh-autosuggestions && git clone https://github.com/zsh-users/zsh-syntax-highlighting /root/.zsh/zsh-syntax-highlighting && pip3 install docker-compose awscli
RUN curl -s https://raw.githubusercontent.com/envkey/envkey-source/master/install.sh | bash
WORKDIR /usr/src
COPY src /usr/src
RUN yarn
CMD ["/bin/zsh"]
