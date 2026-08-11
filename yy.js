var myMap;
var currentPolyline = null;
var trailPoints = [];
var isDrawingTrail = false;

ymaps.ready(init);

function init() {
    // 1. Проверяем статус редактора (показываем/скрываем кнопки)
    checkAdminStatus();

    // 2. Загружаем сохраненные данные
    var savedPlaces = JSON.parse(localStorage.getItem('eco_places')) || [];
    var savedPath = JSON.parse(localStorage.getItem('eco_trail_path')) || [];

    // Центрирование карты
    var defaultCenter = [55.751244, 37.618423];
    if (savedPlaces.length > 0 && savedPlaces[0].coords) {
        defaultCenter = savedPlaces[0].coords;
    } else if (savedPlaces.length > 0 && savedPlaces[0].lat && savedPlaces[0].lng) {
        defaultCenter = [parseFloat(savedPlaces[0].lat), parseFloat(savedPlaces[0].lng)];
    } else if (savedPath.length > 0) {
        defaultCenter = savedPath[0];
    }

    myMap = new ymaps.Map("map", {
        center: defaultCenter,
        zoom: 13,
        controls: ['zoomControl', 'typeSelector', 'fullscreenControl']
    });

    var isEditor = localStorage.getItem('isEditorLoggedIn') === 'true';

    // 3. Отображение меток
    savedPlaces.forEach(function(place, index) {
        var coords = place.coords || [parseFloat(place.lat), parseFloat(place.lng)];
        
        var deleteBtn = isEditor 
            ? '<br><br><button onclick="deleteSinglePlace(' + index + ')" style="background:#e74c3c; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">🗑️ Удалить метку</button>'
            : '';

        var placemark = new ymaps.Placemark(coords, {
            balloonContentHeader: '<h3>' + (place.title || place.name || '') + '</h3>',
            balloonContentBody: '<p>' + (place.description || '') + '</p>' +
                (place.image || place.photo ? '<img src="' + (place.image || place.photo) + '" style="max-width:100%; height:auto; border-radius:4px;">' : '') +
                deleteBtn,
            balloonContentFooter: '<small>Категория: ' + (place.category || 'Не указана') + '</small>'
        }, {
            preset: place.category === 'Растения' ? 'islands#greenLeafIcon' : 'islands#orangeCircleIcon'
        });

        // Если включен режим рисования тропы — клик по метке добавляет её в тропу
        placemark.events.add('click', function () {
            if (isDrawingTrail) {
                addPointToTrail(coords);
            }
        });

        myMap.geoObjects.add(placemark);
    });

    // 4. Отображение сохраненной тропы
    if (savedPath.length > 0) {
        trailPoints = savedPath;
        drawPolyline(savedPath);
    }

    // Клик по свободной точке карты во время рисования тропы
    myMap.events.add('click', function (e) {
        if (isDrawingTrail) {
            var coords = e.get('coords');
            addPointToTrail(coords);
        }
    });
}

// Отрисовка линии
function drawPolyline(coordsArray) {
    if (currentPolyline) {
        myMap.geoObjects.remove(currentPolyline);
    }
    currentPolyline = new ymaps.Polyline(coordsArray, {
        hintContent: "Экологическая тропа"
    }, {
        strokeColor: "#27ae60",
        strokeWidth: 5,
        strokeOpacity: 0.8
    });
    myMap.geoObjects.add(currentPolyline);
}

// Добавление точки к тропе
function addPointToTrail(coords) {
    trailPoints.push(coords);
    drawPolyline(trailPoints);
}

// Проверка входа редактора и показ/скрытие панели
function checkAdminStatus() {
    var isEditor = localStorage.getItem('isEditorLoggedIn') === 'true';
    var adminPanel = document.getElementById('admin-panel');
    var loginBtn = document.getElementById('login-btn');

    if (adminPanel) {
        adminPanel.style.display = isEditor ? 'flex' : 'none';
    }
    if (loginBtn) {
        loginBtn.innerText = isEditor ? '🚪 Выход' : '🔑 Вход для редактора';
    }

    // Автоматически добавляем кнопку удаления тропы в панель редактора
    if (isEditor && adminPanel && !document.getElementById('delete-trail-btn')) {
        var delBtn = document.createElement('button');
        delBtn.id = 'delete-trail-btn';
        delBtn.className = 'nav-btn secondary';
        delBtn.style.background = '#e74c3c';
        delBtn.style.color = 'white';
        delBtn.innerText = '🗑️ Удалить тропу';
        delBtn.onclick = deleteTrailOnly;
        adminPanel.appendChild(delBtn);
    }
}

// Функция входа/выхода (вызывается по кнопке "🔑 Вход для редактора")
function toggleAdminLogin() {
    var isEditor = localStorage.getItem('isEditorLoggedIn') === 'true';

    if (isEditor) {
        localStorage.setItem('isEditorLoggedIn', 'false');
        alert("Вы вышли из режима редактора.");
        location.reload();
    } else {
        var password = prompt("Введите пароль редактора:");
        if (password === "admin" || password === "1234") { // Задайте свой пароль тут
            localStorage.setItem('isEditorLoggedIn', 'true');
            alert("Вы успешно вошли!");
            location.reload();
        } else if (password !== null) {
            alert("Неверный пароль!");
        }
    }
}

// Функция построения тропы (вызывается по кнопке "✏️ Соединить метки в тропу")
function toggleTrailBuilder() {
    isDrawingTrail = !isDrawingTrail;
    var btn = document.getElementById('toggle-trail-btn');
    var hint = document.getElementById('trail-hint');

    if (isDrawingTrail) {
        trailPoints = JSON.parse(localStorage.getItem('eco_trail_path')) || [];
        if (btn) {
            btn.innerText = "💾 Завершить и сохранить тропу";
            btn.style.background = "#f39c12";
        }
        if (hint) {
            hint.style.display = "block";
        }
    } else {
        if (btn) {
            btn.innerText = "✏️ Соединить метки в тропу";
            btn.style.background = "";
        }
        if (hint) {
            hint.style.display = "none";
        }
        localStorage.setItem('eco_trail_path', JSON.stringify(trailPoints));
        alert("Тропа успешно сохранена!");
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

// Функция УДАЛЕНИЯ ТРОПЫ отдельно от меток
function deleteTrailOnly() {
    if (confirm("Вы уверены, что хотите полностью удалить тропу? Метки останутся.")) {
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
