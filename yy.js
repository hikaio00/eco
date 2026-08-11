// Инициализация карты
let map;
let ecoPolyline = null;
let trailCoords = [];
let isDrawingTrail = false;

// Начальные данные (если памяти браузера пока нет)
const defaultPlaces = [];
const defaultTrail = [];

// Считываем сохраненные данные или берем начальные
let places = JSON.parse(localStorage.getItem("eco_places")) || defaultPlaces;
trailCoords = JSON.parse(localStorage.getItem("eco_trail_path")) || defaultTrail;

// Проверяем, вошел ли пользователь как редактор
const isEditor = localStorage.getItem("isEditorLoggedIn") === "true";

ymaps.ready(init);

function init() {
    // Создаем карту (центр — Москва/Подмосковье, при необходимости измените координаты)
    map = new ymaps.Map("map", {
        center: [55.751244, 37.618423],
        zoom: 12,
        controls: ["zoomControl", "typeSelector"]
    });

    // Отрисовываем сохраненные метки и тропу
    renderPlaces();
    renderTrail();

    // Если зашел редактор — добавляем панель управления
    if (isEditor) {
        addEditorControls();
    }
}

// Отображение всех меток на карте
function renderPlaces() {
    places.forEach((place, index) => {
        addPlacemarkToMap(place, index);
    });
}

// Добавление одной метки на карту
function addPlacemarkToMap(place, index) {
    const placemark = new ymaps.Placemark(
        place.coords,
        {
            balloonContentHeader: `<b>${place.name}</b>`,
            balloonContentBody: `
                <p>${place.description || "Описание отсутствует."}</p>
                ${place.photo ? `<img src="${place.photo}" style="max-width:100%; height:auto; border-radius:8px;">` : ""}
                ${isEditor ? `<br><br><button onclick="deletePlace(${index})" style="background:#ff4d4d; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">🗑️ Удалить метку</button>` : ""}
            `,
            balloonContentFooter: `<i>Категория: ${place.category || "Общая"}</i>`
        },
        {
            preset: place.category === "Растения" ? "islands#greenLeafIcon" : "islands#orangeDogIcon"
        }
    );

    map.geoObjects.add(placemark);
}

// Удаление конкретной метки
window.deletePlace = function(index) {
    if (confirm("Вы уверены, что хотите удалить эту метку?")) {
        places.splice(index, 1);
        localStorage.setItem("eco_places", JSON.stringify(places));
        location.reload(); // Перерисовываем карту
    }
};

// Отрисовка линии эко-тропы
function renderTrail() {
    if (trailCoords.length > 0) {
        if (ecoPolyline) {
            map.geoObjects.remove(ecoPolyline);
        }
        ecoPolyline = new ymaps.Polyline(
            trailCoords,
            { hintContent: "Экологическая тропа" },
            { strokeColor: "#2e7d32", strokeWidth: 5, strokeOpacity: 0.8 }
        );
        map.geoObjects.add(ecoPolyline);
    }
}

// Добавление кнопок редактора
function addEditorControls() {
    const controlsDiv = document.createElement("div");
    controlsDiv.style.position = "absolute";
    controlsDiv.style.top = "10px";
    controlsDiv.style.right = "10px";
    controlsDiv.style.zIndex = "1000";
    controlsDiv.style.background = "white";
    controlsDiv.style.padding = "10px";
    controlsDiv.style.borderRadius = "8px";
    controlsDiv.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
    controlsDiv.style.display = "flex";
    controlsDiv.style.flexDirection = "column";
    controlsDiv.style.gap = "8px";

    controlsDiv.innerHTML = `
        <button id="trailBtn" onclick="toggleTrailDrawing()" style="padding:8px 12px; background:#4caf50; color:white; border:none; border-radius:4px; cursor:pointer;">✏️ Нарисовать тропу</button>
        <button onclick="removeTrail()" style="padding:8px 12px; background:#f44336; color:white; border:none; border-radius:4px; cursor:pointer;">🗑️ Удалить тропу</button>
    `;

    document.body.appendChild(controlsDiv);
}

// Включение / выключение режима рисования тропы по кликам
window.toggleTrailDrawing = function() {
    isDrawingTrail = !isDrawingTrail;
    const btn = document.getElementById("trailBtn");

    if (isDrawingTrail) {
        btn.innerText = "💾 Сохранить тропу";
        btn.style.background = "#ff9800";
        alert("Кликайте по карте в точках, где проходит тропа. По окончании нажмите 'Сохранить тропу'.");

        map.events.add("click", onMapClickDrawTrail);
    } else {
        btn.innerText = "✏️ Нарисовать тропу";
        btn.style.background = "#4caf50";
        map.events.remove("click", onMapClickDrawTrail);

        localStorage.setItem("eco_trail_path", JSON.stringify(trailCoords));
        alert("Тропа успешно сохранена!");
    }
};

function onMapClickDrawTrail(e) {
    const coords = e.get("coords");
    trailCoords.push(coords);
    renderTrail();
}

// Функция УДАЛЕНИЯ тропы отдельно от меток
window.removeTrail = function() {
    if (confirm("Вы точно хотите полностью удалить нарисованную тропу?")) {
        if (ecoPolyline) {
            map.geoObjects.remove(ecoPolyline);
            ecoPolyline = null;
        }
        trailCoords = [];
        localStorage.removeItem("eco_trail_path");
        alert("Тропа удалена!");
    }
};
