import React, { useEffect } from "react";
import "./App.css";
import Sqaure from "./components/sqaure.jsx";
import { useState } from "react";
import { io } from "socket.io-client";
import Swal from "sweetalert2";

const renderFrom = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
];
// const [gameState,setGameState] = useState(renderFrom);
const App = () => {
  const [gameState, setGameState] = useState(renderFrom);
  const [currentPlayer, setCurrentPlayer] = useState("circle");
  const [finishedState, setFinishedState] = useState(false);
  const [finishedArrayState, setFinishedArrayState] = useState([]);
  const [playOnline, setPlayOnline] = useState(false);
  const [socket, setSocket] = useState(null);
  const [username, setUserName] = useState("");
  const [opponent, setOpponent] = useState(null);
  const [playingAs, setPlayingAs] = useState(null);

  const checkWinner = () => {
    for (let row = 0; row < gameState.length; row++) {
      if (
        gameState[row][0] === gameState[row][1] &&
        gameState[row][1] === gameState[row][2]
      ) {
        setFinishedArrayState([row * 3 + 0, row * 3 + 1, row * 3 + 2]);
        return gameState[row][0];
      }
    }
    for (let col = 0; col < gameState.length; col++) {
      if (
        gameState[0][col] === gameState[1][col] &&
        gameState[1][col] === gameState[2][col]
      ) {
        setFinishedArrayState([0 * 3 + col, 1 * 3 + col, 2 * 3 + col]);
        return gameState[2][col];
      }
    }
    if (
      gameState[0][0] === gameState[1][1] &&
      gameState[1][1] === gameState[2][2]
    ) {
      setFinishedArrayState([0, 4, 8]);
      return gameState[0][0];
    }

    if (
      gameState[0][2] === gameState[1][1] &&
      gameState[1][1] === gameState[2][0]
    ) {
      setFinishedArrayState([2, 4, 6]);
      return gameState[0][2];
    }

    const isdrawMatch = gameState.flat().every((e) => {
      if (e === "circle" || e === "cross") return true;
    });
    if (isdrawMatch) return "Draw";

    return null;
  };
  useEffect(() => {
    let winner = checkWinner();
    if (winner) {
      console.log(winner);
      setFinishedState(winner);
    }
  }, [gameState]);

  const inputUsername = async () => {
    const result = await Swal.fire({
      title: "Enter your UserName",
      input: "text",
      inputLabel: "Your UserName",
      // inputValue:username,
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) {
          return "you neen to write somthing";
        }
      },
    });

    return result;
  };
  socket?.on("opponentLeftMatch", () => {
    setFinishedState("opponentLeftMatch");
  });
  socket?.on("playerMoveFromServer", (data) => {
    const id = data.state.id;
    setGameState((prevState) => {
      let newState = [...prevState];
      const rowindex = Math.floor(id / 3);
      const colindex = id % 3;
      newState[rowindex][colindex] = data.state.sign;
      return newState;
    });
    setCurrentPlayer(data.state.sign === "circle" ? "cross" : "circle");
  });

  socket?.on("connect", function () {
    setPlayOnline(true);
  });
  socket?.on("OpponentNotFound", function () {
    setOpponent(false);
  });
  socket?.on("OpponentFound", function (data) {
    console.log(data.playingAs);
    setPlayingAs(data.playingAs);
    setOpponent(data.opponent);
  });

  async function playOnlineClick() {
    const result = await inputUsername();
    console.log(result);

    if (!result.isConfirmed) {
      return;
    }
    // setUserName(result.value);
    const uname = result.value;
    setUserName(uname);
    console.log(uname);
    const newsocket = io("https://continued-mel-codesmith-88c66f2d.koyeb.app/", {
      autoConnect: true,
    });
    newsocket?.emit("request_to_play", {
      username: uname,
    });
    setSocket(newsocket);
  }

  if (!playOnline) {
    return (
      <div className="main_div" onClick={playOnlineClick}>
        <button className="playonline">Play Online</button>
      </div>
    );
  }
  if (playOnline && !opponent) {
    return (
      <div className="WFO">
        <p>Wating for Opponent...</p>
      </div>
    );
  }

  return (
    <div className="main_div">
      <div className="move-detection">
        <div
          className={`left ${
            currentPlayer === playingAs ? "current-move-" + currentPlayer : ""
          }`}
        >
          {username}
        </div>
        <div
          className={`right ${
            currentPlayer !== playingAs ? "current-move-" + currentPlayer : ""
          }`}
        >
          {opponent}
        </div>
      </div>
      <div className="title">
        <h1>Tic Tac Toe</h1>
      </div>
      <div className="box">
        {renderFrom.map((arr, rowindex) =>
          arr.map((e, colindex) => {
            return (
              <Sqaure
                // setFinishedState={setFinishedState}
                playingAs={playingAs}
                gameState={gameState}
                socket={socket}
                finishedArrayState={finishedArrayState}
                finishedState={finishedState}
                currentPlayer={currentPlayer}
                setGameState={setGameState}
                setCurrentPlayer={setCurrentPlayer}
                id={colindex + rowindex * 3}
                key={colindex + rowindex * 3}
                currentElement={e}
              />
            );
          })
        )}
      </div>
      {finishedState &&
        finishedState !== "opponentLeftMatch" &&
        finishedState !== "draw" && (
          <h3 className="finished-state">
            {finishedState === playingAs ? "You" : opponent} won the game
          </h3>
        )}
      {finishedState &&
        finishedState !== "opponentLeftMatch" &&
        finishedState === "draw" && (
          <h3 className="finished-state">It's a Draw</h3>
        )}
      {!finishedState && opponent && (
        <h2>You are playing against {opponent}</h2>
      )}
      {finishedState && finishedState === "opponentLeftMatch" && (
        <h2>You won the match, Opponent has left</h2>
      )}
    </div>
  );
};

export default App;
