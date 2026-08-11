ymaps.ready(init);

var myMap;
var currentPolyline = null;
var trailPoints = [];
var isDrawingTrail = false;

function init() {
    var savedPlaces = [];
    var savedPath = [];

    try {
        savedPlaces = JSON.parse(localStorage.getItem('eco_places')) || [];
        savedPath = JSON.parse(localStorage.getItem('eco_trail_path')) || [];
    } catch (e) {
        console.error("Ошибка чтения данных:", e);
    }

    var defaultCenter = [55.751244, 37.618423];
    if (savedPlaces.length > 0 && savedPlaces[0].coords) {
        defaultCenter = savedPlaces[0].coords;
    } else if (savedPath.length > 0) {
        defaultCenter = savedPath[0];
    }

    myMap = new ymaps.Map("map", {
        center: defaultCenter,
        zoom: 13,
        controls: ['zoomControl', 'typeSelector', 'fullscreenControl']
    });

    var isEditor = localStorage.getItem('isEditorLoggedIn') === 'true';

    // Отрисовка всех сохраненных меток
    savedPlaces.forEach(function(place, index) {
        var deleteBtn = isEditor 
            ? '<br><br><button onclick="deleteSinglePlace(' + index + ')" style="background:#e74c3c; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">🗑️ Удалить метку</button>'
            : '';

        var placemarkContent = {
            balloonContentHeader: '<h3>' + (place.name || '') + '</h3>',
            balloonContentBody: '<p>' + (place.description || '') + '</p>' +
                (place.photo ? '<img src="' + place.photo + '" style="max-width:100%; height:auto; border-radius:4px;">' : '') +
                deleteBtn,
            balloonContentFooter: '<small>Категория: ' + (place.category || 'Не указана') + '</small>'
        };

        var placemarkOptions = {
            preset: place.category === 'Растения' ? 'islands#greenLeafIcon' : 'islands#orangeCircleIcon'
        };

        var placemark = new ymaps.Placemark(place.coords, placemarkContent, placemarkOptions);
        myMap.geoObjects.add(placemark);
    });

    // Отрисовка линии тропы
    if (savedPath.length > 0) {
        currentPolyline = new ymaps.Polyline(savedPath, {
            hintContent: "Экологическая тропа"
        }, {
            strokeColor: "#27ae60",
            strokeWidth: 5,
            strokeOpacity: 0.8
        });
        myMap.geoObjects.add(currentPolyline);
    }

    // Событие клика для рисования тропы
    myMap.events.add('click', function (e) {
        if (!isDrawingTrail) return;

        var coords = e.get('coords');
        trailPoints.push(coords);

        if (currentPolyline) {
            myMap.geoObjects.remove(currentPolyline);
        }

        currentPolyline = new ymaps.Polyline(trailPoints, {}, {
            strokeColor: "#27ae60",
            strokeWidth: 5,
            strokeOpacity: 0.8
        });

        myMap.geoObjects.add(currentPolyline);
    });
}

// ФУНКЦИЯ ВХОДА / ВЫХОДА РЕДАКТОРА (исправляет ошибку со скриншота)
function toggleAdminLogin() {
    var isEditor = localStorage.getItem('isEditorLoggedIn') === 'true';

    if (isEditor) {
        localStorage.setItem('isEditorLoggedIn', 'false');
        alert("Вы вышли из режима редактора.");
        location.reload();
    } else {
        var password = prompt("Введите пароль редактора:");
        if (password === "admin" || password === "1234") { // При необходимости укажите свой пароль
            localStorage.setItem('isEditorLoggedIn', 'true');
            alert("Вы успешно вошли как редактор!");
            location.reload();
        } else if (password !== null) {
            alert("Неверный пароль!");
        }
    }
}

// Функция удаления конкретной метки
function deleteSinglePlace(index) {
    if (confirm("Удалить эту метку?")) {
        var savedPlaces = JSON.parse(localStorage.getItem('eco_places')) || [];
        savedPlaces.splice(index, 1);
        localStorage.setItem('eco_places', JSON.stringify(savedPlaces));
        location.reload();
    }
}

// Включение / выключение режима рисования тропы
function toggleTrailMode() {
    isDrawingTrail = !isDrawingTrail;
    var btn = document.getElementById('drawTrailBtn');

    if (isDrawingTrail) {
        trailPoints = JSON.parse(localStorage.getItem('eco_trail_path')) || [];
        if (btn) {
            btn.innerText = "💾 Сохранить тропу";
            btn.style.background = "#f39c12";
        }
        alert("Режим рисования включен! Кликайте по карте, чтобы строить тропу.");
    } else {
        if (btn) {
            btn.innerText = "✏️ Нарисовать тропу";
            btn.style.background = "#27ae60";
        }
        localStorage.setItem('eco_trail_path', JSON.stringify(trailPoints));
        alert("Тропа успешно сохранена!");
    }
}

// Функция удаления только тропы
function deleteTrailOnly() {
    if (confirm("Вы уверены, что хотите удалить только тропу? Метки останутся.")) {
        localStorage.removeItem('eco_trail_path');
        if (currentPolyline) {
            myMap.geoObjects.remove(currentPolyline);
            currentPolyline = null;
        }
        trailPoints = [];
        alert("Тропа удалена!");
        location.reload();
    }
}
