echo $ENV
if [ ${ENV} = "DEV" ]; then 
    npm run dev
else
    node dist/main.js
fi