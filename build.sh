yarn --cwd './client' build
yarn --cwd './server' build
pm2 restart all
