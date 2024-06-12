// import { createServer } from "http";
// import { Server } from "socket.io";
const { Socket } = require("dgram");
const { createServer } = require("http");
const { Server } = require('socket.io');
const { CLIENT_RENEG_LIMIT } = require("tls");


const httpServer = createServer();
const io = new Server(httpServer, {
  cors: "https://6669f7f0ac27de226c11da3b--multittt.netlify.app/",
});


const allUsers = {};
const allRooms = [];

io.on("connection", (socket) => {

  

  allUsers[socket.id] = {
    socket: socket,
    online: true,
    playingnow:false,
  }


  socket.on("request_to_play", (data) => {
    console.log(data);
    const currentUser = allUsers[socket.id];
    currentUser.userName = data.username;
    let opponent;

    for (const key in allUsers) {
      const user = allUsers[key];
      if (user.online &&   socket.id !== key && !user.playingnow) {
        opponent = user;
        opponent.playingnow=true;
        currentUser.playingnow=true;
        break;
      }
    }
    if (opponent) {

      allRooms.push({
        player1: opponent,
        player2:currentUser
      })
      opponent.socket.emit("OpponentFound", {
        opponent: currentUser.userName ,
        playingAs : "circle",
      });

      currentUser.socket.emit("OpponentFound", {
        opponent: opponent.userName,
        playingAs:"cross"
      })
      currentUser.socket.on("playerMoveFromClient",(data)=>{
        opponent.socket.emit("playerMoveFromServer",{
          ...data
        })
        
      });
      opponent.socket.on("playerMoveFromClient",(data)=>{
         currentUser.socket.emit("playerMoveFromServer",{
         ...data
         })
        
      });

    }
    else {
      currentUser.socket.emit("OpponentNotFound");
    }
  })
  socket.on("disconnect", function () {
    const currentUser = allUsers[socket.id];
    currentUser.online = false;
    currentUser.playing=false;

    for (let index = 0; index < allRooms.length; index++) {
       const{player1,player2}= allRooms[index];

       if(player1.socket.id === socket.id){
         player2.socket.emit("opponentLeftMatch");
         
         break;
       }
       if (player2.socket.id === socket.id) {
        player1.socket.emit("opponentLeftMatch");
        break;
      }
      
    }
  })
});

httpServer.listen(4000);