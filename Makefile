up:
	ENV=DEV JWTSECRET=secret docker-compose up
up-prod:
	ENV=PROD JWTSECRET=secret docker-compose up
down:
	docker-compose down
build:
	docker-compose build --no-cache
clean:
	docker image prune
