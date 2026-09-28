/*
    ⚠️ VERVANG DIT DOOR JOUW SERVER-URL

    Bijvoorbeeld:

    const SERVER_URL =
        "https://romantic-connect4.onrender.com";
*/

const SERVER_URL =
    "https://YOUR-SERVER-URL.onrender.com";


const socket =
    io(SERVER_URL);


/*
    ELEMENTEN
*/

const lobby =
    document.getElementById("lobby");

const game =
    document.getElementById("game");

const createButton =
    document.getElementById("createButton");

const joinButton =
    document.getElementById("joinButton");

const roomInput =
    document.getElementById("roomInput");

const roomCodeElement =
    document.getElementById("roomCode");

const playerInfo =
    document.getElementById("playerInfo");

const statusElement =
    document.getElementById("status");

const boardElement =
    document.getElementById("board");

const loveMessage =
    document.getElementById("loveMessage");

const gameEnd =
    document.getElementById("gameEnd");

const winnerEmoji =
    document.getElementById("winnerEmoji");

const winnerText =
    document.getElementById("winnerText");

const winnerMessage =
    document.getElementById("winnerMessage");

const surpriseButton =
    document.getElementById("surpriseButton");

const restartButton =
    document.getElementById("restartButton");


/*
    GAME DATA
*/

let myPlayer = 0;

let roomCode = "";

let currentPlayer = 1;


/*
    ODA OLUŞTUR
*/

createButton.addEventListener(
    "click",
    () => {

        socket.emit(
            "createRoom"
        );
    }
);


/*
    ODAYA KATIL
*/

joinButton.addEventListener(
    "click",
    () => {

        const code =
            roomInput.value
                .trim()
                .toUpperCase();


        if (
            code.length !== 5
        ) {

            alert(
                "Lütfen 5 haneli oda kodunu gir. ❤️"
            );

            return;
        }


        socket.emit(
            "joinRoom",
            code
        );
    }
);


/*
    ODA OLUŞTURULDU
*/

socket.on(
    "roomCreated",
    data => {

        myPlayer =
            data.player;

        roomCode =
            data.roomCode;

        openGame();
    }
);


/*
    ODAYA KATILDI
*/

socket.on(
    "roomJoined",
    data => {

        myPlayer =
            data.player;

        roomCode =
            data.roomCode;

        openGame();
    }
);


/*
    GAME OPEN
*/

function openGame() {

    lobby.classList.add(
        "hidden"
    );

    game.classList.remove(
        "hidden"
    );


    roomCodeElement.textContent =
        roomCode;


    if (
        myPlayer === 1
    ) {

        playerInfo.textContent =
            "Sen ❤️";

    } else {

        playerInfo.textContent =
            "Sen 🧡";
    }
}


/*
    GAME STATE
*/

socket.on(
    "gameState",
    data => {

        currentPlayer =
            data.currentPlayer;


        renderBoard(
            data.board
        );


        /*
            Wachten
        */

        if (
            data.players < 2
        ) {

            statusElement.textContent =
                "💕 Sevgilinin oyuna katılması bekleniyor...";

            return;
        }


        /*
            Game over
        */

        if (
            data.gameOver
        ) {

            showWinner(
                data.winner
            );

            return;
        }


        /*
            Beurt
        */

        if (
            currentPlayer ===
            myPlayer
        ) {

            statusElement.textContent =
                "❤️ Sıra sende aşkım!";

        } else {

            statusElement.textContent =
                "💕 Şimdi sevgilinin sırası...";
        }
    }
);


/*
    BORD
*/

function renderBoard(board) {

    boardElement.innerHTML =
        "";


    for (
        let row = 0;
        row < 6;
        row++
    ) {

        for (
            let column = 0;
            column < 7;
            column++
        ) {

            const cell =
                document.createElement(
                    "button"
                );


            cell.className =
                "cell";


            cell.type =
                "button";


            const value =
                board[
                    row * 7 + column
                ];


            if (
                value === 1
            ) {

                cell.classList.add(
                    "player1"
                );
            }


            if (
                value === 2
            ) {

                cell.classList.add(
                    "player2"
                );
            }


            cell.addEventListener(
                "click",
                () => {

                    if (
                        currentPlayer !==
                        myPlayer
                    ) {

                        return;
                    }


                    socket.emit(
                        "dropPiece",
                        column
                    );
                }
            );


            boardElement.appendChild(
                cell
            );
        }
    }
}


/*
    ROMANTISCH BERICHT
*/

socket.on(
    "loveMessage",
    message => {

        loveMessage.textContent =
            message;
    }
);


/*
    WINNAAR
*/

function showWinner(winner) {

    gameEnd.classList.remove(
        "hidden"
    );


    /*
        Gelijkspel
    */

    if (
        winner === 0
    ) {

        winnerEmoji.textContent =
            "💕";

        winnerText.textContent =
            "Berabere! 💕";

        winnerMessage.textContent =
            "Ama gerçek kazanan aşkınız. ❤️";

        return;
    }


    /*
        Jij gewonnen
    */

    if (
        winner === myPlayer
    ) {

        winnerEmoji.textContent =
            "🏆❤️";

        winnerText.textContent =
            "Tebrikler aşkım! 🥰";

        winnerMessage.textContent =
            "Bugün oyunu kazandın ama benim kalbimi zaten çoktan kazandın. Seni çok seviyorum! ❤️";

    }

    /*
        De ander gewonnen
    */

    else {

        winnerEmoji.textContent =
            "💖";

        winnerText.textContent =
            "Tebrikler sevgilim! 🥰";

        winnerMessage.textContent =
            "Bu oyunu sen kazandın ama benim kalbimi her gün yeniden kazanıyorsun. Seni çok seviyorum! ❤️";
    }
}


/*
    🎁 SURPRISE
*/

surpriseButton.addEventListener(
    "click",
    () => {

        const link =
            document.createElement(
                "a"
            );


        link.href =
            "./surprise.mp4";


        link.download =
            "Sana_Ozel_Surprizim.mp4";


        document.body.appendChild(
            link
        );


        link.click();


        document.body.removeChild(
            link
        );
    }
);


/*
    YENIDEN OYNA
*/

restartButton.addEventListener(
    "click",
    () => {

        gameEnd.classList.add(
            "hidden"
        );


        socket.emit(
            "restartGame"
        );
    }
);


/*
    ERROR
*/

socket.on(
    "errorMessage",
    message => {

        alert(message);
    }
);


/*
    SEVGİLİ AYRILDI
*/

socket.on(
    "opponentLeft",
    () => {

        statusElement.textContent =
            "💕 Sevgilin oyundan ayrıldı.";

        loveMessage.textContent =
            "Merak etme, aşkınız oyundan daha güçlü. ❤️";
    }
);


/*
    SERVER CONNECTION
*/

socket.on(
    "connect",
    () => {

        console.log(
            "❤️ Online server bağlantısı başarılı."
        );
    }
);


socket.on(
    "connect_error",
    () => {

        console.log(
            "Server bağlantısı kurulamadı."
        );
    }
);
