// server.js
//node app starts

//  started  off with Express (https://expressjs.com/) and axios (https://www.npmjs.com/package/axios)

const express = require("express");
const axios = require("axios");
const PORT= process.env.PORT||3000;
const { getAccessToken } = require("./spotify/auth");
const { searchArtists, getRecommendations } = require("./spotify/actions");

const BASE_URL = "https://api.spotify.com/v1"

// initialize an express instance called 'app' 
const app = express();

// Log an error message if any of the secret values needed for this app are missing
if (!(process.env.SPOTIFY_CLIENT_ID) || !(process.env.SPOTIFY_CLIENT_SECRET)) {
  console.error("ERROR: Missing one or more critical Spotify environment variables. Check .env file");
}

// set up the app to parse JSON request bodies
app.use(express.json());

// make all the files in 'public' available
// https://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

// return the index.html file when a GET request is made to the root path "/"
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.post("/recommendations", async (req, res) => {
  if(!req.body) {
    return res.status(400).send({ message: "Bad Request - must send a JSON body with track and artist" })
  }
  
  const { artist1, artist2, artist3 } = req.body
  
  if(!artist1 || !artist2 || !artist3) {
    return res.status(400).send({ message: "Bad Request - must pass a track and artist" })
  }
  
  // 1. Get access token
  let accessToken
  try {
    accessToken = await getAccessToken()
  } catch(err) {
    console.error(err.message)
    return res.status(500).send({ message: "Something went wrong when fetching access token" })
  }
  
  // Create an instance of axios to apply access token to all request headers
  const http = axios.create({ headers: { 'Authorization': `Bearer ${accessToken}` }})
  
  // 2. get track id from search
  let artistId1, artistId2, artistId3;
  //artistId1
  
  try {
    console.log(artist1)
    const result = await searchArtists (http,   artist1 )
    const { artists } = result
    
    if(!artists || !artists.items || !artists.items.length) {
      return res.status(404).send({ message: ` ${artist1} not found.` })
    }
    artistId1= artists.items[0].id;
    }catch(err) {
      console.error(err.message)
      return res.status(500).send({message : "Error when searching for artistId1"})
      
    }
    
  //artistId2
  
  try {
    const result = await searchArtists(http,   artist2 )
    const { artists } = result
    
    if(!artists || !artists.items || !artists.items.length) {
      return res.status(404).send({ message: ` ${artist2} not found.` })
    }
    artistId2= artists.items[0].id;
    }catch(err) {
      console.error(err.message)
      return res.status(500).send({message : "Error when searching for artistId1"})
      
    }
  //artistId3
  
  try {
    const result = await searchArtists (http,   artist3 )
    const { artists } = result
    
    if(!artists || !artists.items || !artists.items.length) {
      return res.status(404).send({ message: ` ${artist3} not found.` })
    }
    artistId3= artists.items[0].id;
    }catch(err) {
      console.error(err.message)
      return res.status(500).send({message : "Error when searching for artistId1"})
      
    }
  
    // save the first search result's trackId to a variable
  
  // 3. get song recommendations
  try {
    const result = await getRecommendations(http, { artistId1, artistId2, artistId3 })
    const { tracks } = result

    // if no songs returned in search, send a 404 response
    if(!tracks || !tracks.length ) {
      return res.status(404).send({ message: "No recommendations found." })
    }
    
    // Success! Send track recommendations back to client
    return res.send({ tracks })
  } catch(err) {
    console.error(err.message)
    return res.status(500).send({ message: "Something went wrong when fetching recommendations" })
  }
});

// after our app has been set up above, start listening on a port provided by Glitch
app.listen(PORT, () => {
  console.log(`Example app listening at port ${PORT}`);
});

