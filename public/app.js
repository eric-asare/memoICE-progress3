// client connects to the server
let socket = io();

//confirm that the client is connected
socket.on('connect', () => {
    console.log('connected to the server');
    // now that client has connected to server, emit name and room information
    let data = {
        'name': sessionStorage.getItem('name'),
        'room': sessionStorage.getItem('room')
    }
    socket.emit('userData', data);
})


// limiting number of people in room to 2
socket.on('maxUsersReached', () => {
    alert('This room is full. Please go back and try to join another room');

    document.getElementById("game-form").innerHTML = ""

})

// receive game data from server
socket.on('gameBegins', (gameData) => {
    gameData = gameData.roomName;

    let gameWindow = document.getElementById('game-box-msgs');

    for (let i = 0; i < gameData.length; i++) {
        console.log(gameData[i]);

        let word = document.createElement('p');
        word.innerText = gameData[i];
        gameWindow.appendChild(word);
    }

    // side the start button
    document.getElementById('start-button').style.visibility = 'hidden';

    // timeSeconds needed for each level to be included in gameData 
    let timeSecond = 3;
    let timeH = document.getElementById("game-timer");

    displayTime(timeSecond);

    let countDown = setInterval(() => {
        timeSecond--;
        displayTime(timeSecond);
        if (timeSecond == 0 || timeSecond < 1) {
            endCount();
            clearInterval(countDown);
        }
    }, 1000);

    // Timer Function

    function displayTime(second) {
        let min = Math.floor(second / 60);
        let sec = Math.floor(second % 60);
        timeH.innerHTML = `
${min < 10 ? "0" : ""}${min}:${sec < 10 ? "0" : ""}${sec}
`;
    }

    function endCount() {
        timeH.innerHTML = "Time Out: Enter Words You Remember Below";

        gameWindow.innerHTML = " ";

        // Show Words Input and Send Button
        let msgInput = document.getElementById('word-input');
        msgInput.style.visibility = 'visible';


        let sendButton = document.getElementById('send-button');
        sendButton.style.visibility = 'visible';
    }

})

// get progress data and show on game window
socket.on('currentScore', (progressData) => {
    console.log(progressData);

    let gameWindow = document.getElementById('game-box-msgs');
    let word = document.createElement('p');
    word.style.color = progressData.color;
    word.innerText = progressData.name + ":" + progressData.data;
    gameWindow.appendChild(word);


    // add data to window screen and score to total score
    let gameScore = document.getElementById('game-score');
    gameScore.innerHTML = progressData.score;



})

//receive old messages
socket.on('pastMessages', (data) => {
    console.log(data);
})

socket.on('userTyping', () => {
    console.log("user Typing");
})


//2) get the input from the user, on click event we get the information (c)

window.addEventListener('load', () => {

    let userName = document.getElementById('user-name');
    userName.innerHTML = "Name:" + sessionStorage.getItem('name');

    let gameLevel = document.getElementById('game-header-msg')
    gameLevel.innerHTML = "Level: " + sessionStorage.getItem('room').toUpperCase();



    let gameForm = document.getElementById('game-form');

    // Hide Words Input and Send Button
    let msgInput = document.getElementById('word-input');
    msgInput.style.visibility = 'hidden';


    let sendButton = document.getElementById('send-button');
    sendButton.style.visibility = 'hidden';

    // listen for start button and emit data
    let startButton = document.getElementById('start-button');
    startButton.addEventListener('click', () => {
        socket.emit('gameStart');
    })


    // send words that you remember

    gameForm.addEventListener('submit', (e) => {
        e.preventDefault();
        let name = sessionStorage.getItem('name');
        let word = document.getElementById('word-input').value;
        // console.log(name, word);

        //emit the information to the server
        wordObject = {
            'name': name,
            'word': word
        }

        console.log(wordObject);
        socket.emit('wordInput', wordObject);
    })

    //code to see if any user is typing
    let messageInput = document.getElementById('word-input');
    messageInput.onkeypress = () => {
        console.log('typing')
        socket.emit('userTyping');
    }

})