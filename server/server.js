const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();

app.use(cors());

app.get("/", (req, res) => {
    res.send("❤️ Romantic Connect 4 server is online!");
});

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});


const rooms = new Map();


function createBoard() {

    return Array.from(
        { length: 6 },
        () => Array(7).fill(null)
    );

}


function generateRoomCode() {

    const characters =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let code = "";

    do {

        code = "";

        for (let i = 0; i < 6; i++) {

            code += characters[
                Math.floor(
                    Math.random() *
                    characters.length
                )
            ];

        }

    } while (rooms.has(code));

    return code;
}


function checkWinner(board, player) {

    const rows = 6;
    const cols = 7;


    // horizontaal

    for (
        let row = 0;
        row < rows;
        row++
    ) {

        for (
            let col = 0;
            col < cols - 3;
            col++
        ) {

            if (
                board[row][col] === player &&
                board[row][col + 1] === player &&
                board[row][col + 2] === player &&
                board[row][col + 3] === player
            ) {

                return true;

            }

        }

    }


    // verticaal

    for (
        let row = 0;
        row < rows - 3;
        row++
    ) {

        for (
            let col = 0;
            col < cols;
            col++
        ) {

            if (
                board[row][col] === player &&
                board[row + 1][col] === player &&
                board[row + 2][col] === player &&
                board[row + 3][col] === player
            ) {

                return true;

            }

        }

    }


    // diagonaal naar rechts

    for (
        let row = 0;
        row < rows - 3;
        row++
    ) {

        for (
            let col = 0;
            col < cols - 3;
            col++
        ) {

            if (
                board[row][col] === player &&
                board[row + 1][col + 1] === player &&
                board[row + 2][col + 2] === player &&
                board[row + 3][col + 3] === player
            ) {

                return true;

            }

        }

    }


    // diagonaal naar links

    for (
        let row = 0;
        row < rows - 3;
        row++
    ) {

        for (
            let col = 3;
            col < cols;
            col++
        ) {

            if (
                board[row][col] === player &&
                board[row + 1][col - 1] === player &&
                board[row + 2][col - 2] === player &&
                board[row + 3][col - 3] === player
            ) {

                return true;

            }

        }

    }


    return false;
}


function boardIsFull(board) {

    for (const row of board) {

        for (const cell of row) {

            if (!cell) {

                return false;

            }

        }

    }

    return true;
}


io.on("connection", (socket) => {

    console.log(
        "Nieuwe speler:",
        socket.id
    );


    /*
        ROOM MAKEN
    */

    socket.on(
        "createRoom",
        () => {

            const roomCode =
                generateRoomCode();

            rooms.set(
                roomCode,
                {
                    board: createBoard(),
                    currentTurn: "red",
                    players: {
                        red: socket.id,
                        yellow: null
                    }
                }
            );


            socket.join(roomCode);

            socket.data.roomCode =
                roomCode;

            socket.data.player =
                "red";


            socket.emit(
                "roomCreated",
                {
                    roomCode,
                    player: "red"
                }
            );


            console.log(
                "Room gemaakt:",
                roomCode
            );

        }
    );


    /*
        ROOM JOINEN
    */

    socket.on(
        "joinRoom",
        (roomCode) => {

            const code =
                String(roomCode)
                    .trim()
                    .toUpperCase();


            const room =
                rooms.get(code);


            if (!room) {

                socket.emit(
                    "roomError",
                    "Deze kamer bestaat niet. ❤️"
                );

                return;

            }


            if (room.players.yellow) {

                socket.emit(
                    "roomError",
                    "Deze kamer is al vol. ❤️"
                );

                return;

            }


            socket.join(code);

            socket.data.roomCode =
                code;

            socket.data.player =
                "yellow";

            room.players.yellow =
                socket.id;


            socket.emit(
                "roomJoined",
                {
                    roomCode: code,
                    player: "yellow"
                }
            );


            io.to(code).emit(
                "gameStart",
                {
                    board: room.board,
                    currentTurn:
                        room.currentTurn
                }
            );


            console.log(
                "Speler toegevoegd aan:",
                code
            );

        }
    );


    /*
        ZET MAKEN
    */

    socket.on(
        "move",
        (data) => {

            if (!data) return;


            const code =
                String(
                    data.roomCode || ""
                )
                .trim()
                .toUpperCase();


            const column =
                Number(data.column);


            const room =
                rooms.get(code);


            if (!room) return;


            const player =
                socket.data.player;


            /*
                Alleen spelers uit deze
                kamer mogen spelen.
            */

            if (
                socket.data.roomCode !== code
            ) {

                return;

            }


            /*
                Alleen tijdens de eigen beurt.
            */

            if (
                room.currentTurn !== player
            ) {

                return;

            }


            /*
                Kolom controleren.
            */

            if (
                !Number.isInteger(column) ||
                column < 0 ||
                column > 6
            ) {

                return;

            }


            /*
                Vrije rij zoeken.
            */

            let row = -1;


            for (
                let r = 5;
                r >= 0;
                r--
            ) {

                if (
                    !room.board[r][column]
                ) {

                    row = r;

                    break;

                }

            }


            if (row === -1) {

                return;

            }


            /*
                Steen plaatsen.
            */

            room.board[row][column] =
                player;


            /*
                Winnaar controleren.
            */

            if (
                checkWinner(
                    room.board,
                    player
                )
            ) {

                io.to(code).emit(
                    "gameOver",
                    {
                        board: room.board,
                        winner: player
                    }
                );

                return;

            }


            /*
                Gelijkspel controleren.
            */

            if (
                boardIsFull(
                    room.board
                )
            ) {

                io.to(code).emit(
                    "gameOver",
                    {
                        board: room.board,
                        winner: "draw"
                    }
                );

                return;

            }


            /*
                Beurt wisselen.
            */

            room.currentTurn =
                player === "red"
                    ? "yellow"
                    : "red";


            /*
                Nieuwe stand naar
                beide spelers sturen.
            */

            io.to(code).emit(
                "move",
                {
                    board: room.board,
                    currentTurn:
                        room.currentTurn
                }
            );

        }
    );


    /*
        OPNIEUW SPELEN
    */

    socket.on(
        "restartGame",
        (data) => {

            if (!data) return;


            const code =
                String(
                    data.roomCode || ""
                )
                .trim()
                .toUpperCase();


            const room =
                rooms.get(code);


            if (!room) return;


            /*
                Alleen spelers uit de
                betreffende kamer.
            */

            if (
                socket.data.roomCode !== code
            ) {

                return;

            }


            room.board =
                createBoard();

            room.currentTurn =
                "red";


            io.to(code).emit(
                "gameRestarted",
                {
                    board: room.board,
                    currentTurn:
                        room.currentTurn
                }
            );

        }
    );


    /*
        SPELER VERLAAT DE SERVER
    */

    socket.on(
        "disconnect",
        () => {

            console.log(
                "Speler weg:",
                socket.id
            );


            const code =
                socket.data.roomCode;


            if (!code) return;


            const room =
                rooms.get(code);


            if (!room) return;


            /*
                Kamer verwijderen zodra
                een speler vertrekt.
            */

            rooms.delete(code);

        }
    );

});


const PORT =
    process.env.PORT || 3000;


server.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `❤️ Server draait op poort ${PORT}`
        );

    }
);
