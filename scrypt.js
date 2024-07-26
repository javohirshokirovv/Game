let USERNAME;
let game_id;
let points = 1000;

let launch = document.querySelector('.launch');

document.getElementById('login').addEventListener('submit', function(event){
    event.preventDefault();
    auth();
});

checkLS();

function checkLS(){
    let login = localStorage.getItem('username');
    if(login){
        USERNAME = login;
        launch.classList.add('disabled');
        updateUserBalance();
    }
}

document.querySelector('header .exit').addEventListener('click', exit);

function exit(){
    localStorage.removeItem('username');
    launch.classList.remove('disabled');
}

async function auth(){
    let login = document.getElementsByName("login")[0].value;

    let response = await sendRequest("user", "GET", {
        username: login
    });
    if(response.error){
        // Такой пользователь не зарегистрирован
        let registration = await sendRequest("user", "POST", {
            username: login
        });
        if(registration.error){
            alert(registration.message);
        } else {
            // Пользователь успешно зарегистрирован
            USERNAME = login;
            launch.classList.add('disabled');
            updateUserBalance();
            localStorage.setItem('username', USERNAME);
        }
    } else {
        // Пользователь зарегистрирован
        USERNAME = login;
        launch.classList.add('disabled');
        updateUserBalance();
        localStorage.setItem('username', USERNAME);
    }
}

async function updateUserBalance(){
    let response = await sendRequest("user", "GET", {
        username: USERNAME
    });
    if(response.error){
        // Произошла ошибка
        alert(response.message);
    } else {
        let userBalance = response.balance;
        let span = document.querySelector("header span");
        span.innerHTML = `[${USERNAME}, ${userBalance}]`;
    }
}

async function sendRequest(url, method, data) {
    url = `https://tg-api.tehnikum.school/tehnikum_course/minesweeper/${url}`;
    
    if(method === "POST") {
        let response = await fetch(url, {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        response = await response.json();
        return response;
    } else if(method === "GET") {
        url = url + "?" + new URLSearchParams(data);
        let response = await fetch(url, {
            method: "GET",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        response = await response.json();
        return response;
    }
}

document.querySelectorAll('.point').forEach((btn) => {
    btn.addEventListener('click', (event) => setPoints(event));
});

function setPoints(event){
    let userBtn = event.target;
    points = +userBtn.innerHTML;

    let activeBtn = document.querySelector('.point.active');
    if(activeBtn) activeBtn.classList.remove('active');

    userBtn.classList.add('active');
}

function activateArea(){
    let cells = document.querySelectorAll(".cell");
    cells.forEach((cell, i) => {
        setTimeout(() => {
            cell.classList.add('active');
            cell.addEventListener('contextmenu', (event) => {
                event.preventDefault();
                setFlag(event);
            });

            let row = Math.trunc(i/10);
            let column = i - row*10;
            cell.setAttribute('data-row', row);
            cell.setAttribute('data-column', column);

            cell.addEventListener('click', makeStep);
        }, i * 15);
    });
}

function setFlag(event){
    let cell = event.target;
    cell.classList.toggle('flag');
}

function cleanArea(){
    let gameField = document.querySelector('.gameField');
    gameField.innerHTML = "";

    for (let i = 0; i < 80; i++){
        let cell = document.createElement('div');
        cell.classList.add('cell');
        gameField.appendChild(cell);
    }
}

let gameBtn = document.getElementById('gameBtn');
gameBtn.addEventListener('click', startOrStopGame);

function startOrStopGame(){
    let btnText = gameBtn.innerHTML;
    if(btnText == "ИГРАТЬ"){
        //НАЧАТЬ ИГРУ
        startGame();
        gameBtn.innerHTML = "ЗАКОНЧИТЬ ИГРУ";
    } else {
        //ЗАКОНЧИТЬ ИГРУ
        stopGame();
        gameBtn.innerHTML = "ИГРАТЬ";
    }
}

async function startGame(){
    let response = await sendRequest('new_game', 'POST', {
        'username': USERNAME,
        points
    });
    if(response.error){
        //Произошла ошибка
        alert(response.message);
        gameBtn.innerHTML = "ИГРАТЬ";
    } else {
        //Игра успешно началась
        updateUserBalance();
        game_id = response.game_id;
        activateArea();
        console.log(game_id);
    }
}

async function stopGame(){
    let response = await sendRequest('stop_game', 'POST', {
        'username': USERNAME,
        game_id
    });
    if(response.error){
        //Произошла ошибка
        alert(response.message);
        gameBtn.innerHTML = "ЗАКОНЧИТЬ ИГРУ";
    } else {
        //Игра закончилась успешно
        updateUserBalance();
        cleanArea();
    }
}

async function makeStep(event){
    let cell = event.target;
    let row = +cell.getAttribute('data-row');
    let column = +cell.getAttribute('data-column');

    console.log(row, column);

    let response = await sendRequest('game_step', 'POST', {
        game_id, row, column
    });

    if(response.error){
        alert(response.message);
    } else{
        //Успешный ход
        updateArea(response.table);
        if(response.status == "Ok"){
            //Играем дальше
        } else if(response.status == "Failed"){
            //Напоролся на бомбу 
            alert('Вы проиграли');
            gameBtn.classList.add('disabled-button');
            gameBtn.innerHTML = "ИГРАТЬ";

            setTimeout( () =>{
                cleanArea();
                gameBtn.classList.remove('disabled-button');
            }, 3000);
        } else if(response.status == "Won"){
            //Выиграл игру
            alert('Вы выиграли');
            updateUserBalance();

            gameBtn.classList.add('disabled-button');
            gameBtn.innerHTML = "ИГРАТЬ";

            setTimeout( () =>{
                cleanArea();
                gameBtn.classList.remove('disabled-button');
            }, 3000);
        }
    }
}

function updateArea(table){
    //Какие могут быть значения у ячейки (переменная value)
    //BOMB
    //0
    // 12345678
    let cells = document.querySelectorAll(".cell");

    let a = 0; //Номер ячейки 
    for(let i = 0; i < table.length; i++){
        //проходимся по рядам 
        let row = table[i];
        for(let j = 0; j < row.length; j++){
            //Проходимся по ячейкам в ряде
            let value = row[j];
            let cell = cells[a];
            if(value === "BOMB"){
                cell.classList.remove('active');
                cell.classList.add('bomb');
            } else if(value ===""){
                // do nothing
            } else if(value === 0){
                cell.classList.remove('active');
            } else if(value > 0){
                cell.classList.remove('active');
                cell.innerHTML = value;
            }
            a++;
        }
    }
}
