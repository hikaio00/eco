ymaps.ready(init);

// Пароль редактора
const ADMIN_PASSWORD = "123";

let map;
let isBuildingTrail = false;
let selectedTrailPoints = [];

// Загружаем данные из хранилища
let places = JSON.parse(localStorage.getItem("eco_places")) || [];
let savedTrail = JSON.parse(localStorage.getItem("eco_trail_path")) || [];

function init() {
    map = new ymaps.Map("map", {
        center: [55.751244, 37.618423],
        zoom: 14,
        controls: ['zoomControl', 'fullscreenControl']
    });

    checkAdminStatus();
    renderMap();
}

function renderMap() {
    map.geoObjects.removeAll();

    // 1. Отрисовываем существующую тропу
    if (savedTrail.length > 1) {
        const polyline = new ymaps.Polyline(savedTrail, {}, {
            strokeColor: "#2d5a27",
            strokeWidth: 5,
            strokeOpacity: 0.8
        });
        map.geoObjects.add(polyline);
    }

    // 2. Загружаем персональные голоса текущего пользователя
    const userVotes = JSON.parse(localStorage.getItem("eco_user_votes")) || {};
    const isAdmin = localStorage.getItem("is_admin") === "true";

    // 3. Отрисовываем метки
    places.forEach((item, index) => {
        const myVote = userVotes[index]; // 'yes', 'no' или undefined

        // Выделяем активную кнопку визуально
        const yesStyle = myVote === 'yes'
            ? 'background:#2d5a27; color:white; border:2px solid #1b3e18; font-weight:bold;'
            : 'background:#e8f5e9; color:#2d5a27; border:1px solid #c8e6c9;';

        const noStyle = myVote === 'no'
            ? 'background:#c62828; color:white; border:2px solid #8e0000; font-weight:bold;'
            : 'background:#ffebee; color:#c62828; border:1px solid #ffcdd2;';

        const placemark = new ymaps.Placemark([item.lat, item.lng], {
            balloonContentHeader: `<b>${item.title}</b>`,
            balloonContentBody: `
                <p>${item.description}</p>
                ${item.image ? `<img src="${item.image}" style="width:100%; max-width:200px; border-radius:8px; display:block; margin-bottom:10px;">` : ''}

                <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee;">
                    <p style="margin:0 0 6px 0; font-size:12px; color:#555;">Встречали этот вид на тропе?</p>
                    <button onclick="votePlace(${index}, 'yes')" style="${yesStyle} padding:5px 10px; border-radius:6px; cursor:pointer; margin-right:6px; transition:0.2s;">
                        👍 Да (${item.votesYes || 0})
                    </button>
                    <button onclick="votePlace(${index}, 'no')" style="${noStyle} padding:5px 10px; border-radius:6px; cursor:pointer; transition:0.2s;">
                        👎 Нет (${item.votesNo || 0})
                    </button>
                </div>

                ${isAdmin ? `
                    <div style="margin-top:12px; padding-top:8px; border-top:1px dashed #ccc;">
                        <button onclick="deletePlace(${index})" style="background:#d32f2f; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; font-size:12px;">❌ Удалить метку</button>
                    </div>
                ` : ''}
            `
        });

        placemark.events.add('click', function (e) {
            if (isBuildingTrail) {
                e.preventDefault();
                selectedTrailPoints.push([item.lat, item.lng]);
                drawTempTrail();
            }
        });

        map.geoObjects.add(placemark);
    });
}

// Логика умного голосования
window.votePlace = function(index, type) {
    let userVotes = JSON.parse(localStorage.getItem("eco_user_votes")) || {};
    const currentVote = userVotes[index]; // Предыдущий голос пользователя ('yes', 'no' или undefined)

    if (!places[index].votesYes) places[index].votesYes = 0;
    if (!places[index].votesNo) places[index].votesNo = 0;

    if (currentVote === type) {
        // 1. Повторное нажатие на ту же кнопку -> Убираем голос
        if (type === 'yes') places[index].votesYes--;
        if (type === 'no') places[index].votesNo--;
        delete userVotes[index];
    } else if (currentVote) {
        // 2. Смена решения (было Да, стало Нет или наоборот)
        if (type === 'yes') {
            places[index].votesYes++;
            places[index].votesNo--;
        } else {
            places[index].votesNo++;
            places[index].votesYes--;
        }
        userVotes[index] = type;
    } else {
        // 3. Первое голосование
        if (type === 'yes') places[index].votesYes++;
        if (type === 'no') places[index].votesNo++;
        userVotes[index] = type;
    }

    // Сохраняем изменения
    localStorage.setItem("eco_places", JSON.stringify(places));
    localStorage.setItem("eco_user_votes", JSON.stringify(userVotes));

    renderMap();
};

window.toggleAdminLogin = function() {
    const isAdmin = localStorage.getItem("is_admin") === "true";

    if (isAdmin) {
        localStorage.setItem("is_admin", "false");
        alert("Вы вышли из режима редактора.");
    } else {
        const password = prompt("Введите пароль редактора:");
        if (password === ADMIN_PASSWORD) {
            localStorage.setItem("is_admin", "true");
            alert("Режим редактора включен!");
        } else if (password !== null) {
            alert("Неверный пароль!");
        }
    }
    checkAdminStatus();
    renderMap();
};

function checkAdminStatus() {
    const isAdmin = localStorage.getItem("is_admin") === "true";
    document.getElementById("admin-panel").style.display = isAdmin ? "flex" : "none";
    document.getElementById("login-btn").innerText = isAdmin ? "🚪 Выйти из редактора" : "🔑 Вход для редактора";
}

window.deletePlace = function(index) {
    if (confirm("Удалить эту метку?")) {
        places.splice(index, 1);

        // Удаляем голос для удаленной метки
        let userVotes = JSON.parse(localStorage.getItem("eco_user_votes")) || {};
        delete userVotes[index];
        localStorage.setItem("eco_user_votes", JSON.stringify(userVotes));

        localStorage.setItem("eco_places", JSON.stringify(places));
        renderMap();
    }
};

window.toggleTrailBuilder = function() {
    const btn = document.getElementById("toggle-trail-btn");
    const hint = document.getElementById("trail-hint");

    if (!isBuildingTrail) {
        isBuildingTrail = true;
        selectedTrailPoints = [];
        btn.innerText = "✅ Завершить и сохранить тропу";
        hint.style.display = "block";
    } else {
        isBuildingTrail = false;
        btn.innerText = "✏️ Соединить метки в тропу";
        hint.style.display = "none";

        if (selectedTrailPoints.length > 1) {
            savedTrail = selectedTrailPoints;
            localStorage.setItem("eco_trail_path", JSON.stringify(savedTrail));
            alert("Тропа успешно сохранена!");
        } else {
            alert("Для создания тропы нужно выбрать хотя бы 2 метки.");
        }
        renderMap();
    }
};

function drawTempTrail() {
    renderMap();
    if (selectedTrailPoints.length > 1) {
        const polyline = new ymaps.Polyline(selectedTrailPoints, {}, {
            strokeColor: "#ff9800",
            strokeWidth: 5
        });
        map.geoObjects.add(polyline);
    }
}
