IMAGE:=nudj/devops:latest
SYNC ?= false

.PHONY: build run backup migrate

build:
	@docker build -t $(IMAGE) .

run:
	@docker run -it --rm --name devops \
		-v /var/run/docker.sock:/var/run/docker.sock \
		-v $(PWD)/.ssh:/root/.ssh \
		-v $(PWD)/.zshrc:/root/.zshrc \
		-v $(PWD)/src/tasks:/usr/src/tasks \
		-v $(PWD)/../server:/usr/src/local/server \
		-v $(PWD)/../web:/usr/src/local/web \
		-v $(PWD)/../hire:/usr/src/local/hire \
		-v $(PWD)/../admin:/usr/src/local/admin \
		-v $(PWD)/../api:/usr/src/local/api \
		-v $(PWD)/../backups:/usr/src/backups \
		$(IMAGE)

backup:
	@docker run --rm --name backup \
		--env-file $(PWD)/../api/.env \
		-v /var/run/docker.sock:/var/run/docker.sock \
		-v $(PWD)/.ssh:/root/.ssh \
		-v $(PWD)/../backups:/usr/src/backups \
		$(IMAGE) \
		/bin/sh -c "./tasks/backup $(ENV)"

migrate:
	@docker run --rm --name migrate \
		--env-file $(PWD)/../api/.env \
		-v /var/run/docker.sock:/var/run/docker.sock \
		-v $(PWD)/.ssh:/root/.ssh \
		-v $(PWD)/src/tasks:/usr/src/tasks \
		-v $(PWD)/src/docker-compose.yml:/usr/src/docker-compose.yml \
		$(IMAGE) \
		/bin/sh -c "./tasks/migrate $(TARGET) $(TYPE)"

execute:
	@docker run --rm --name execute \
		--env-file $(PWD)/../api/.env \
		-v /var/run/docker.sock:/var/run/docker.sock \
		-v $(PWD)/.ssh:/root/.ssh \
		-v $(PWD)/src/tasks:/usr/src/tasks \
		-v $(PWD)/src/docker-compose.yml:/usr/src/docker-compose.yml \
		-v $(PWD)/../api/src/scripts:/usr/src/scripts \
		$(IMAGE) \
		/bin/sh -c "./tasks/execute '$(PWD)/..' $(TARGET) $(SCRIPT)"

executeRemote:
	@docker run --rm --name execute \
		--env-file $(PWD)/../api/.env \
		-v /var/run/docker.sock:/var/run/docker.sock \
		-v $(PWD)/.ssh:/root/.ssh \
		-v $(PWD)/src/tasks:/usr/src/tasks \
		-v $(PWD)/src/docker-compose.yml:/usr/src/docker-compose.yml \
		-v $(PWD)/../api/src/scripts:/usr/src/scripts \
		$(IMAGE) \
		/bin/sh -c "./tasks/executeRemote '$(PWD)/..' $(TARGET) $(SCRIPT)"
