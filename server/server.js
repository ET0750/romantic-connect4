const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();

app.use(cors({
    origin: "*"
}));

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});


const PORT =
    process.env.PORT || 3000;


/*
    ONLINE KAMERS
*/

const rooms = {};


/*
    KAMER CODE
*/

function createRoomCode() {

    const characters =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let code = "";

    for (let i = 0; i < 5; i++) {

        code +=
            characters[
                Math.floor(
                    Math.random() *
                    characters.length
                )
            ];
    }

    return code;
}


/*
    NIEUWE GAME
*/

function newGame() {

    return {

        board:
            Array(42).fill(0),

        currentPlayer: 1,

        winner: null,

        gameOver: false,

        players: {}

    };
}


/*
    WINNAAR CONTROLEREN
*/

function checkWinner(board, player) {

    const rows = 6;
    const columns = 7;


    function get(row, column) {

        if (
            row < 0 ||
            row >= rows ||
            column < 0 ||
            column >= columns
        ) {

            return 0;
        }

        return board[
            row * columns + column
        ];
    }


    for (
        let row = 0;
        row < rows;
        row++
    ) {

        for (
            let column = 0;
            column < columns;
            column++
        ) {

            if (
                get(row, column) !== player
            ) {
                continue;
            }


            /*
                horizontaal
            */

            if (
                get(row, column + 1) === player &&
                get(row, column + 2) === player &&
                get(row, column + 3) === player
            ) {

                return true;
            }


            /*
                verticaal
            */

            if (
                get(row + 1, column) === player &&
                get(row + 2, column) === player &&
                get(row + 3, column) === player
            ) {

                return true;
            }


            /*
                diagonaal rechts
            */

            if (
                get(row + 1, column + 1) === player &&
                get(row + 2, column + 2) === player &&
                get(row + 3, column + 3) === player
            ) {

                return true;
            }


            /*
                diagonaal links
            */

            if (
                get(row + 1, column - 1) === player &&
                get(row + 2, column - 2) === player &&
                get(row + 3, column - 3) === player
            ) {

                return true;
            }
        }
    }

    return false;
}


/*
    BORD VOL?
*/

function isBoardFull(board) {

    return board.every(
        cell => cell !== 0
    );
}


/*
    GAME STATE
*/

function sendGameState(roomCode) {

    const room =
        rooms[roomCode];

    if (!room) return;


    io.to(roomCode).emit(
        "gameState",
        {

            board:
                room.board,

            currentPlayer:
                room.currentPlayer,

            winner:
                room.winner,

            gameOver:
                room.gameOver,

            players:
                Object.keys(
                    room.players
                ).length
        }
    );
}


/*
    VERBINDING
*/

io.on(
    "connection",
    socket => {

        console.log(
            "Nieuwe speler:",
            socket.id
        );


        /*
            KAMER MAKEN
        */

        socket.on(
            "createRoom",
            () => {

                let roomCode;

                do {

                    roomCode =
                        createRoomCode();

                } while (
                    rooms[roomCode]
                );


                rooms[roomCode] =
                    newGame();


                rooms[roomCode]
                    .players[
                        socket.id
                    ] = 1;


                socket.join(
                    roomCode
                );


                socket.roomCode =
                    roomCode;

                socket.playerNumber =
                    1;


                socket.emit(
                    "roomCreated",
                    {
                        roomCode:
                            roomCode,

                        player:
                            1
                    }
                );


                sendGameState(
                    roomCode
                );
            }
        );


        /*
            KAMER JOINEN
        */

        socket.on(
            "joinRoom",
            code => {

                const roomCode =
                    String(code)
                        .trim()
                        .toUpperCase();


                const room =
                    rooms[roomCode];


                if (!room) {

                    socket.emit(
                        "errorMessage",
                        "Bu oda bulunamadı. ❤️"
                    );

                    return;
                }


                const playerCount =
                    Object.keys(
                        room.players
                    ).length;


                if (
                    playerCount >= 2
                ) {

                    socket.emit(
                        "errorMessage",
                        "Bu oda zaten dolu. ❤️"
                    );

                    return;
                }


                room.players[
                    socket.id
                ] = 2;


                socket.join(
                    roomCode
                );


                socket.roomCode =
                    roomCode;

                socket.playerNumber =
                    2;


                socket.emit(
                    "roomJoined",
                    {
                        roomCode:
                            roomCode,

                        player:
                            2
                    }
                );


                io.to(roomCode).emit(
                    "loveMessage",
                    "💕 Artık ikiniz de buradasınız. Aşk dolu bir oyun başlasın! ❤️"
                );


                sendGameState(
                    roomCode
                );
            }
        );


        /*
            STEEN PLAATSEN
        */

        socket.on(
            "dropPiece",
            column => {

                const roomCode =
                    socket.roomCode;


                const room =
                    rooms[roomCode];


                if (!room) return;


                if (
                    room.gameOver
                ) return;


                /*
                    Tweede speler moet
                    aanwezig zijn.
                */

                if (
                    Object.keys(
                        room.players
                    ).length !== 2
                ) {

                    socket.emit(
                        "errorMessage",
                        "Sevgilinin oyuna katılmasını bekle. ❤️"
                    );

                    return;
                }


                /*
                    Juiste speler?
                */

                if (
                    socket.playerNumber !==
                    room.currentPlayer
                ) {

                    socket.emit(
                        "errorMessage",
                        "Şimdi sıra sende değil aşkım. 💕"
                    );

                    return;
                }


                column =
                    Number(column);


                if (
                    !Number.isInteger(
                        column
                    ) ||
                    column < 0 ||
                    column > 6
                ) {

                    return;
                }


                /*
                    Vrije rij zoeken
                */

                let row = -1;


                for (
                    let r = 5;
                    r >= 0;
                    r--
                ) {

                    if (
                        room.board[
                            r * 7 + column
                        ] === 0
                    ) {

                        row = r;

                        break;
                    }
                }


                /*
                    Kolom vol
                */

                if (
                    row === -1
                ) {

                    socket.emit(
                        "errorMessage",
                        "Bu sütun dolu aşkım. ❤️"
                    );

                    return;
                }


                /*
                    Steen
                */

                room.board[
                    row * 7 + column
                ] =
                    room.currentPlayer;


                /*
                    Winnaar
                */

                if (
                    checkWinner(
                        room.board,
                        room.currentPlayer
                    )
                ) {

                    room.winner =
                        room.currentPlayer;

                    room.gameOver =
                        true;

                }

                else if (
                    isBoardFull(
                        room.board
                    )
                ) {

                    room.winner =
                        0;

                    room.gameOver =
                        true;

                }

                else {

                    room.currentPlayer =
                        room.currentPlayer === 1
                            ? 2
                            : 1;
                }


                sendGameState(
                    roomCode
                );


                /*
                    Winbericht
                */

                if (
                    room.gameOver
                ) {

                    if (
                        room.winner === 1
                    ) {

                        io.to(roomCode).emit(
                            "loveMessage",
                            "🏆❤️ Tebrikler aşkım! Bugün oyunu kazandın ama benim kalbimi zaten çoktan kazandın. Seni çok seviyorum! 💕"
                        );

                    }

                    else if (
                        room.winner === 2
                    ) {

                        io.to(roomCode).emit(
                            "loveMessage",
                            "🏆❤️ Tebrikler aşkım! Sen benim kalbimin gerçek şampiyonusun. Seni sonsuza kadar seveceğim. 💕"
                        );

                    }

                    else {

                        io.to(roomCode).emit(
                            "loveMessage",
                            "💕 Berabere kaldınız! Ama gerçek kazanan aşkınız. ❤️"
                        );
                    }
                }
            }
        );


        /*
            YENİDEN OYNA
        */

        socket.on(
            "restartGame",
            () => {

                const roomCode =
                    socket.roomCode;


                const room =
                    rooms[roomCode];


                if (!room) return;


                if (
                    Object.keys(
                        room.players
                    ).length !== 2
                ) {

                    return;
                }


                room.board =
                    Array(42).fill(0);

                room.currentPlayer =
                    1;

                room.winner =
                    null;

                room.gameOver =
                    false;


                io.to(roomCode).emit(
                    "loveMessage",
                    "💕 Yeni oyun başladı! Aşkımız gibi bu oyun da hiç bitmesin. ❤️"
                );


                sendGameState(
                    roomCode
                );
            }
        );


        /*
            VERBINDING VERBROKEN
        */

        socket.on(
            "disconnect",
            () => {

                const roomCode =
                    socket.roomCode;


                if (!roomCode) {
                    return;
                }


                const room =
                    rooms[roomCode];


                if (!room) {
                    return;
                }


                delete room.players[
                    socket.id
                ];


                socket.to(roomCode).emit(
                    "opponentLeft"
                );


                /*
                    Kamer leeg?
                */

                if (
                    Object.keys(
                        room.players
                    ).length === 0
                ) {

                    delete rooms[
                        roomCode
                    ];
                }
            }
        );

    }
);


app.get(
    "/",
    (req, res) => {

        res.send(
            "❤️ Romantic Connect 4 server is online!"
        );
    }
);


server.listen(
    PORT,
    () => {

        console.log(
            `Server draait op poort ${PORT}`
        );
    }
);
