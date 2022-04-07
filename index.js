const MAX_USERS_ROOM = 2;

// use an API , fill on load
// add Game Time as well
wordBank = {
    easy: ["abet",
        "accoll",
        "accolle",
        "car",
        "card",
        "care"
    ],

    medium: ["abetments",
        "abfarad",
        "abhenry", "center",
        "central",
        "century",
        "certain",
        "certainly",
        "chair",
        "career",
        "carry"
    ],

    hard: ["abettor",
        "abettors",
        "abevacuation",
        "guy",
        "agammaglobulinemia",
        "agammaglobulinemic",
        "agamobia",
        "agamobium",
        "agamogenesis",
        "agamogenetic",
        "agamogenetically",
        "hard"
    ],


    pro: ["aberroscope",
        "aberuncate",
        "aberuncator",
        "abesse",
        "abessive",
        "Aalto",
        "AAM",
        "AAMSI",
        "Aandahl",
        "A - and - R",
        "Aani",
        "AAO",
        "AAP",
        "AAPSS",
        "Aaqbiye",
        "Aar",
        "Aara",
        "Aarau"
    ]
}





//Initialize the express 'app' object
let express = require('express');
let app = express();
app.use('/', express.static('public'));

//Initialize the actual HTTP server
let http = require('http');
let server = http.createServer(app);

//Initialize socket.io
let io = require('socket.io');
io = new io.Server(server);

//create a variable to store ALL messages since server started
let messages = []; // TODO : remember that since we have rooms now, this variable is not the best idea. Either we should add the room data too, or creatae multiple arrays within
let rooms = {}; // key value pair - 'roomname' : number of people in room
let users = {}; // key value pair - 'username' : userid
let roomNames = {}; // key value pair - roomname: names
let roomScore = {}; // key value pair - roomname: score
let roomCorrectWords = {}; // key value pair - roomname:[words]




//when client tries to connect to server
io.sockets.on('connect', (socket) => {
    console.log('new socket connection ,', socket.id);


    //get user data
    socket.on('userData', (data) => {
        //save user name in an array
        socket.name = data.name;
        users[socket.name] = socket.id;

        console.log(users);

        // MODIFIED POST CLASS - limiting number of people in room
        if (rooms[data.room]) { //is the room already there?
            if (rooms[data.room] < MAX_USERS_ROOM) {
                //let the socket join room of choice
                socket.roomName = data.room; // we will add this data to the socket only after we can verify that there is space
                socket.join(socket.roomName);
                rooms[socket.roomName]++;

                // add second roomate name
                roomNames[socket.roomName] += `& ${socket.name}`;
                //add score
                roomScore[socket.roomName] = 0;

                // initiate room words
                roomCorrectWords[socket.roomName] = [];

            } else {
                socket.emit('maxUsersReached');
            }
        } else {
            socket.roomName = data.room;
            socket.join(socket.roomName);
            rooms[socket.roomName] = 1;

            //add first roommate and score
            roomNames[socket.roomName] = `${socket.name}`;
        }

        console.log(rooms);

    })


    //send old messages
    let data = { oldMessages: messages };
    socket.emit('pastMessages', data);
    //on disconnection
    socket.on('disconnect', () => {
        console.log('connection ended, ', socket.id);
        rooms[socket.roomName]--;

        //delete the room data since it's a collaboration game -to keep users on show
        delete roomNames[socket.roomName]
        delete roomScore[socket.roomName]
        delete roomCorrectWords[socket.roomName]
        delete users[socket.name];
    })

    //on receiving word input
    socket.on('wordInput', (data) => {

        let word = data.word;
        let name = data.name;

        let progressData = {
            'name': name
        };

        // if word in word bank and has not already been marked as correct

        if (wordBank[socket.roomName].includes(word) && !(roomCorrectWords[socket.roomName].includes(word))) {

            //increase score
            roomScore[socket.roomName] += 1;

            let score = roomScore[socket.roomName];
            let data = word + " " + "+1";
            let color = 'green';

            roomCorrectWords[socket.roomName].push(word);

            progressData['data'] = data;
            progressData['score'] = score;
            progressData['color'] = color;


            // if word is a duplicate, do nothing
        } else if (roomCorrectWords[socket.roomName].includes(word)) {

            let score = roomScore[socket.roomName];
            let data = word + "  " + "already written";
            let color = 'orange';

            console.log(score, data);


            progressData['data'] = data;
            progressData['score'] = score;
            progressData['color'] = color;


        } else {

            if (roomScore[socket.roomName] > 0) {
                roomScore[socket.roomName] -= 1;
            }

            let score = roomScore[socket.roomName];
            let data = word + " " + "-1";
            let color = 'red';
            console.log(score, data);


            progressData['data'] = data;
            progressData['score'] = score;
            progressData['color'] = color;

        }


        //emit the data to clients in THAT room
        io.to(socket.roomName).emit('currentScore', progressData);
    })


    // receives game start and initiate game
    socket.on('gameStart', () => {
        let roomName = socket.roomName;

        data = {
            roomName: wordBank[roomName]
        }
        io.to(socket.roomName).emit('gameBegins', data);
    })






    //on rec someone is typing
    socket.on('userTyping', () => {
        console.log('user is typing')
        io.to(socket.roomName).emit('userTyping');
    })
})


//run the createServer
let port = process.env.PORT || 9000;
server.listen(port, () => {
    console.log("Server listening at port: " + port);
});