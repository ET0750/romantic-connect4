const SERVER_URL =
    "https://romantic-connect4.onrender.com";


/* =========================
   SOCKET.IO
========================= */

const socket = io(SERVER_URL);


/* =========================
   ELEMENTEN
========================= */

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

const connectionMessage =
    document.getElementById(
        "connectionMessage"
    );

const boardElement =
    document.getElementById("board");

const roomCodeElement =
    document.getElementById("roomCode");

const statusElement =
    document.getElementById("status");

const turnText =
    document.getElementById("turnText");

const loveMessage =
    document.getElementById("loveMessage");

const gameEnd =
    document.getElementById("gameEnd");

const winnerText =
    document.getElementById(
        "winnerText"
    );

const winnerMessage =
    document.getElementById(
        "winnerMessage"
    );

const winnerEmoji =
    document.getElementById(
        "winnerEmoji"
    );

const surpriseButton =
    document.getElementById(
        "surpriseButton"
    );

const restartButton =
    document.getElementById(
        "restartButton"
    );

const videoModal =
    document.getElementById(
        "videoModal"
    );

const closeModal =
    document.getElementById(
        "closeModal"
    );

const surpriseVideo =
    document.getElementById(
        "surpriseVideo"
    );


/* =========================
   SPELVARIABELEN
========================= */

let roomCode = "";

let myPlayer = null;

let board = [];

let currentTurn = "red";

let gameOver = false;


/* =========================
   ROMANTISCHE TURKSE BERICHTEN
========================= */

const loveMessages = [

    "Seni çok seviyorum aşkım. ❤️",

    "Sen benim en güzel tesadüfümsün. 💕",

    "Kalbimin en güzel yerinde sen varsın. 💗",

    "Seninle geçen her saniye çok değerli. 🥰",

    "İyi ki hayatımdasın sevgilim. ❤️",

    "Sen benim en güzel hikâyemsin. 💖",

    "Seni düşündüğümde yüzümde gülümseme oluşuyor. 😊❤️",

    "Mesafeler önemli değil, kalbim hep seninle. 💕",

    "Sen benim mutluluğumsun. ❤️",

    "Sonsuza kadar seninle olmak istiyorum. 💗"

];


/* =========================
   VERBINDING
========================= */

socket.on(
    "connect",
    () => {

        connectionMessage.textContent =
            "❤️ Bağlantı hazır!";

    }
);


socket.on(
    "connect_error",
    () => {

        connectionMessage.textContent =
            "Bağlantı kuruluyor... ❤️";

    }
);


/* =========================
   ROOM MAKEN
========================= */

createButton.addEventListener(
    "click",
    () => {

        socket.emit(
            "createRoom"
        );

    }
);


/* =========================
   ROOM JOINEN
========================= */

joinButton.addEventListener(
    "click",
    () => {

        const code =
            roomInput.value
                .trim()
                .toUpperCase();

        if (!code) {

            connectionMessage.textContent =
                "Lütfen oda kodunu yaz. ❤️";

            return;
        }

        socket.emit(
            "joinRoom",
            code
        );

    }
);


/* =========================
   ROOM GEMAAKT
========================= */

socket.on(
    "roomCreated",
    (data) => {

        roomCode =
            data.roomCode;

        myPlayer =
            data.player || "red";

        enterGame();

        statusElement.textContent =
            "Sevgilini bekliyorsun... 💕";

    }
);


/* =========================
   ROOM GEJOINED
========================= */

socket.on(
    "roomJoined",
    (data) => {

        roomCode =
            data.roomCode;

        myPlayer =
            data.player || "yellow";

        enterGame();

    }
);


/* =========================
   ROOM FOUT
========================= */

socket.on(
    "roomError",
    (message) => {

        connectionMessage.textContent =
            message ||
            "Odaya katılamadı. ❤️";

    }
);


/* =========================
   SPEL START
========================= */

socket.on(
    "gameStart",
    (data) => {

        board =
            data?.board ||
            createEmptyBoard();

        currentTurn =
            data?.currentTurn ||
            "red";

        gameOver = false;

        gameEnd.classList.add(
            "hidden"
        );

        // Surprise opnieuw verbergen
        surpriseButton.classList.add(
            "hidden"
        );

        drawBoard();

        updateTurn();

        showRandomLoveMessage();

    }
);


/* =========================
   ZET VAN ANDERE SPELER
========================= */

socket.on(
    "move",
    (data) => {

        if (!data) return;

        board =
            data.board ||
            board;

        currentTurn =
            data.currentTurn ||
            currentTurn;

        drawBoard();

        updateTurn();

        showRandomLoveMessage();

    }
);


/* =========================
   SPEL EINDE
========================= */

socket.on(
    "gameOver",
    (data) => {

        if (!data) return;

        board =
            data.board ||
            board;

        drawBoard();

        gameOver = true;

        showGameEnd(
            data.winner
        );

    }
);


/* =========================
   OPNIEUW SPELEN
========================= */

socket.on(
    "gameRestarted",
    (data) => {

        board =
            data.board ||
            createEmptyBoard();

        currentTurn =
            data.currentTurn ||
            "red";

        gameOver = false;

        gameEnd.classList.add(
            "hidden"
        );

        // Surprise opnieuw verbergen
        surpriseButton.classList.add(
            "hidden"
        );

        drawBoard();

        updateTurn();

        showRandomLoveMessage();

    }
);


/* =========================
   GAME BINNENGAAN
========================= */

function enterGame() {

    lobby.classList.add(
        "hidden"
    );

    game.classList.remove(
        "hidden"
    );

    roomCodeElement.textContent =
        roomCode;

    board =
        createEmptyBoard();

    drawBoard();

}


/* =========================
   LEEG BOARD
========================= */

function createEmptyBoard() {

    return Array.from(
        {
            length: 6
        },
        () =>
            Array(7).fill(null)
    );

}


/* =========================
   BOARD TEKENEN
========================= */

function drawBoard() {

    boardElement.innerHTML = "";

    for (
        let row = 0;
        row < 6;
        row++
    ) {

        for (
            let col = 0;
            col < 7;
            col++
        ) {

            const cell =
                document.createElement(
                    "button"
                );

            cell.type = "button";

            cell.className =
                "cell";

            cell.dataset.column =
                col;

            const value =
                board[row]?.[col];

            if (
                value === "red"
            ) {

                cell.classList.add(
                    "red-piece"
                );

            }

            if (
                value === "yellow"
            ) {

                cell.classList.add(
                    "yellow-piece"
                );

            }


            /* Touch + muis */

            cell.addEventListener(
                "click",
                () => {

                    playColumn(
                        col
                    );

                }
            );


            boardElement.appendChild(
                cell
            );

        }

    }

}


/* =========================
   STEEN PLAATSEN
========================= */

function playColumn(
    column
) {

    if (gameOver) return;

    if (
        currentTurn !==
        myPlayer
    ) {

        return;
    }


    const row =
        findAvailableRow(
            column
        );

    if (row === -1) {

        loveMessage.textContent =
            "Bu sütun dolu aşkım. Başka bir sütun seç. ❤️";

        return;
    }


    socket.emit(
        "move",
        {
            roomCode,
            column
        }
    );

}


/* =========================
   VRIJE RIJ VINDEN
========================= */

function findAvailableRow(
    column
) {

    for (
        let row = 5;
        row >= 0;
        row--
    ) {

        if (
            !board[row] ||
            !board[row][column]
        ) {

            return row;
        }

    }

    return -1;

}


/* =========================
   BEURT UPDATE
========================= */

function updateTurn() {

    if (gameOver) return;

    if (
        currentTurn ===
        myPlayer
    ) {

        statusElement.textContent =
            "Sıra sende aşkım ❤️";

        turnText.textContent =
            "💗 Senin sıran";

    } else {

        statusElement.textContent =
            "Sevgilinin sırası... 💕";

        turnText.textContent =
            "💕 Onun sırası";

    }

}


/* =========================
   ROMANTISCH BERICHT
========================= */

function showRandomLoveMessage() {

    const index =
        Math.floor(
            Math.random() *
            loveMessages.length
        );

    loveMessage.textContent =
        loveMessages[index];

}


/* =========================
   EINDE SPEL
   ALLEEN WINNAAR KRIJGT
   DE SURPRISE
========================= */

function showGameEnd(
    winner
) {

    gameEnd.classList.remove(
        "hidden"
    );


    /*
        WINNAAR
    */

    if (
        winner === myPlayer
    ) {

        winnerEmoji.textContent =
            "💖";

        winnerText.textContent =
            "Kazandın aşkım! ❤️";

        winnerMessage.textContent =
            "Ama asıl kazandığım şey senin sevgini bilmek. Seni çok seviyorum. 💕";


        /*
            ALLEEN DE WINNAAR
            KRIJGT DE SURPRISE-KNOP
        */

        surpriseButton.classList.remove(
            "hidden"
        );

    }


    /*
        VERLIEZER
    */

    else if (
        winner !== "draw"
    ) {

        winnerEmoji.textContent =
            "💗";

        winnerText.textContent =
            "Bu sefer sevgilin kazandı! 🥰";

        winnerMessage.textContent =
            "Kaybetmek bile seninle güzel. Seni çok seviyorum. ❤️";


        /*
            VERLIEZER KRIJGT GEEN SURPRISE
        */

        surpriseButton.classList.add(
            "hidden"
        );

    }


    /*
        GELIJKSPEL
    */

    else {

        winnerEmoji.textContent =
            "💕";

        winnerText.textContent =
            "Berabere! ❤️";

        winnerMessage.textContent =
            "İkiniz de kazandınız çünkü birlikte oynadınız. 🥰";


        /*
            BIJ GELIJKSPEL GEEN SURPRISE
        */

        surpriseButton.classList.add(
            "hidden"
        );

    }

}


/* =========================
   OPNIEUW SPELEN
========================= */

restartButton.addEventListener(
    "click",
    () => {

        socket.emit(
            "restartGame",
            {
                roomCode
            }
        );

    }
);


/* =========================
   SURPRISE OPENEN
========================= */

surpriseButton.addEventListener(
    "click",
    () => {

        /*
            Extra controle:
            alleen de winnaar mag
            de video openen.
        */

        if (!gameOver) return;

        videoModal.classList.remove(
            "hidden"
        );

        surpriseVideo.currentTime =
            0;

        surpriseVideo.play()
            .catch(
                () => {
                    /*
                        Op sommige telefoons
                        moet de gebruiker zelf
                        op Play drukken.
                    */
                }
            );

    }
);


/* =========================
   VIDEO SLUITEN
========================= */

closeModal.addEventListener(
    "click",
    closeVideo
);


videoModal.addEventListener(
    "click",
    (event) => {

        if (
            event.target ===
            videoModal
        ) {

            closeVideo();

        }

    }
);


function closeVideo() {

    videoModal.classList.add(
        "hidden"
    );

    surpriseVideo.pause();

}


/* =========================
   TOUCH / GSM
========================= */

document.addEventListener(
    "contextmenu",
    (event) => {

        if (
            event.target.closest(
                ".board"
            )
        ) {

            event.preventDefault();

        }

    }
);


/* =========================
   ROOM CODE
========================= */

roomInput.addEventListener(
    "input",
    () => {

        roomInput.value =
            roomInput.value
                .toUpperCase()
                .replace(
                    /[^A-Z0-9]/g,
                    ""
                );

    }
);
