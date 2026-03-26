let IS_PROD = false;
const server = IS_PROD ?
    "https://apnavideocallbackend-y3mg.onrender.com" :

    "http://localhost:8000"


export default server;