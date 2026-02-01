
GREEN  := $(shell tput -Txterm setaf 2)
YELLOW := $(shell tput -Txterm setaf 3)
RESET  := $(shell tput -Txterm sgr0)

.DEFAULT_GOAL := help

.PHONY: help setup start stop restart logs clean shell-back shell-front



help: ## 💡 Displays available commands
	@echo ""
	@echo "${GREEN}🎯 SmartSelect Health Manager${RESET}"
	@echo "------------------------------------------------"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*? ## / {printf "${GREEN}%-15s${RESET} %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""


setup: ## 🔧 Initial setup (creating .env)
	@echo "${YELLOW}🔧 Environment configuration...${RESET}"
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "${GREEN}✅ The .env file has been created (fill it with your keys!)${RESET}"; \
	else \
		echo "${GREEN}✅ The .env file already exists${RESET}"; \
	fi


start: ## 🚀 Start the application (rebuild if changes)
	@echo "${YELLOW}🚀 Starting the system...${RESET}"
	@# Check if the .env file exists, if not, create it
	@if [ ! -f .env ]; then cp .env.example .env; fi
	
	@# --build: Rebuild the images if the Dockerfile or requirements have changed
	@# -d: Run in the background (detached)
	@# --remove-orphans: Remove old containers that are no longer in docker-compose
	DOCKER_BUILDKIT=1 COMPOSE_DOCKER_CLI_BUILD=1 docker compose up -d --build --remove-orphans	
	
	@echo ""
	@echo "${GREEN}✅ System ready!${RESET}"
	@echo "   🖥️  Frontend Web:  http://localhost:3000"


stop:  ## 🛑 Stop the application
	@echo "${YELLOW}🛑 Stopping containers...${RESET}"
	docker compose down


restart:  ## 🔄 Restart the entire environment
	stop start 


clean: ## 🧹 Full cleanup (containers, images, cache)
	@echo "${YELLOW}🧹 Cleaning up the environment...${RESET}"
	docker compose down -v --rmi local
	@echo "${GREEN}✅ Cleaned up.${RESET}"
