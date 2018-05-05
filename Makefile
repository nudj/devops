IMAGE:=nudj/devops:latest
CWD=$(shell pwd)
SYNC ?= false

.PHONY: build run backup migrate

build:
	@docker build -t $(IMAGE) .

run:
	@docker run -it --rm --name devops \
		-v /var/run/docker.sock:/var/run/docker.sock \
		-v $(CWD)/.ssh:/root/.ssh \
		-v $(CWD)/.zshrc:/root/.zshrc \
		-v $(CWD)/src/scripts:/usr/src/scripts \
		-v $(CWD)/../server:/usr/src/local/server \
		-v $(CWD)/../web:/usr/src/local/web \
		-v $(CWD)/../hire:/usr/src/local/hire \
		-v $(CWD)/../admin:/usr/src/local/admin \
		-v $(CWD)/../api:/usr/src/local/api \
		-v $(CWD)/../backups:/usr/src/backups \
		$(IMAGE)

backup:
	@docker run --rm --name backup \
		--env-file $(CWD)/../api/.env \
		-v /var/run/docker.sock:/var/run/docker.sock \
		-v $(CWD)/.ssh:/root/.ssh \
		-v $(CWD)/../backups:/usr/src/backups \
		$(IMAGE) \
		/bin/sh -c "./scripts/backup $(ENV)"

migrate:
	@docker run --rm --name migrate \
		--env-file $(CWD)/../api/.env \
		-v /var/run/docker.sock:/var/run/docker.sock \
		-v $(CWD)/.ssh:/root/.ssh \
		$(IMAGE) \
		/bin/sh -c "./scripts/migrate $(ENV) $(TYPE)"
