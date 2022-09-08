install:
	rm -rf package-lock.json node_modules
	git pull
	npm i
	npm run build
	pm2 start "npm run start:prod" --name be

build:
	rm -rf package-lock.json
	git pull
	npm i
	npm run build
	pm2 restart be
