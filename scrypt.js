let USERNAME
let launch = document.querySelector('.launch')

document.getElementById('login').addEventListener('submit', function(event){
    event.preventDefault();
    auth()
});

checkLS()

function checkLS(){
    let login = localStorage.getItem('username')
    if(login){
        USERNAME = login
        launch.classList.add('disabled')
        updateUserBalance()
    }
}

document.querySelector('header .exit').addEventListener('click', exit)

function exit(){
    localStorage.removeItem('username')
    launch.classList.remove('disabled')
}

async function auth(){
    let login = document.getElementsByName("login")[0].value

    let response = await sendRequest("user", "GET", {
        username: login
    })
    if(response.error){
        //Такой пользователь не зарегистрирован
        let registration = await sendRequest("user", "POST", {
            username: login
        })
        if(registration.error){
            alert(registration.message)
        } else {
            //Пользователь успешно зарегистрирован
            USERNAME = login
            launch.classList.add('disabled')
            updateUserBalance()
            localStorage.setItem('username', USERNAME)
        }
    } else {
        //Пользователь зарегистрирован
        USERNAME = login
        launch.classLis.addt('disabled')
        updateUserBalance()
        localStorage.setItem('username', USERNAME)
    }
}


async function updateUserBalance(){
    let response = await sendRequest("user", "GET", {
        username: USERNAME
    })
    if(response.error){
        //Произошла ошибка
        alert(response.message)
    } else {
        let userBalance = response.balance
        let span = document.querySelector("header span")
        span.innerHTML = `[${USERNAME}, ${userBalance}]`

    }

}


async function sendRequest(url, method, data) {
    url = `https://tg-api.tehnikum.school/tehnikum_course/minesweeper/${url}`
    
    if(method == "POST") {
        let response = await fetch(url, {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
    
        response = await response.json()
        return response
    } else if(method == "GET") {
        url = url+"?"+ new URLSearchParams(data)
        let response = await fetch(url, {
            method: "GET",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
        response = await response.json()
        return response
    }
}