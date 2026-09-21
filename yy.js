var myMap;
var currentPolyline = null;
var trailPoints = [];
var isDrawingTrail = false;

ymaps.ready(init);

function init() {
    checkAdminStatus();

    var savedPlaces = JSON.parse(localStorage.getItem('eco_places')) || [];
    var savedPath = JSON.parse(localStorage.getItem('eco_trail_path')) || [];

    var defaultCenter = [55.751244, 37.618423];
    if (savedPlaces.length > 0) {
        var p = savedPlaces[0];
        defaultCenter = p.coords || [parseFloat(p.lat), parseFloat(p.lng)];
    } else if (savedPath.length > 0) {
        defaultCenter = savedPath[0];
    }

    myMap = new ymaps.Map("map", {
        center: defaultCenter,
        zoom: 12,
        controls: ['zoomControl', 'typeSelector', 'fullscreenControl']
    });

    var isEditor = localStorage.getItem('isEditorLoggedIn') === 'true';

    // Отображение всех меток
    savedPlaces.forEach(function(place, index) {
        var coords = place.coords || [parseFloat(place.lat), parseFloat(place.lng)];
        var category = place.category || 'Растения';
        
        // Формирование содержимого балуна
        var bodyContent = '<p>' + (place.description || '') + '</p>';
        
        // Фарм-блок в балуне
        if (place.pharma && (place.pharma.rawMaterial || place.pharma.activeCompounds)) {
            bodyContent += '<div style="background:#f1f8e9; padding:8px; border-radius:5px; margin:8px 0;">' +
                '<b>🌱 Сырье:</b> ' + (place.pharma.rawMaterial || '—') + '<br>' +
                '<b>🧪 БАВ:</b> ' + (place.pharma.activeCompounds || '—') +
                '</div>';
        }

        // Гидрохимический блок в балуне
        if (place.hydro && (place.hydro.ph || place.hydro.fe)) {
            bodyContent += '<div style="background:#e1f5fe; padding:8px; border-radius:5px; margin:8px 0;">' +
                '<b>💧 Гидрохимия:</b><br>' +
                'pH: ' + (place.hydro.ph || '—') + ' | gH: ' + (place.hydro.gh || '—') + '<br>' +
                '<b>Fe (Железо):</b> <span style="color:' + (parseFloat(place.hydro.fe) > 0.3 ? 'red' : 'green') + '">' + (place.hydro.fe || '—') + ' мг/л</span>' +
                '</div>';
        }

        if (place.image || place.photo) {
            bodyContent += '<img src="' + (place.image || place.photo) + '" style="max-width:100%; height:auto; border-radius:4px;">';
        }

        var deleteBtn = isEditor 
            ? '<br><br><button onclick="deleteSinglePlace(' + index + ')" style="background:#e74c3c; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">🗑️ Удалить метку</button>'
            : '';

        // Выбор иконки
        var iconPreset = 'islands#greenLeafIcon';
        if (category === 'Гидрохимия') iconPreset = 'islands#blueWaterIcon';
        if (category === 'Лишайники') iconPreset = 'islands#yellowSunIcon';

        var placemark = new ymaps.Placemark(coords, {
            balloonContentHeader: '<h3>' + (place.title || '') + (place.speciesLatin ? ' <i>(' + place.speciesLatin + ')</i>' : '') + '</h3>',
            balloonContentBody: bodyContent + deleteBtn,
            balloonContentFooter: '<small>Категория: ' + category + '</small>'
        }, {
            preset: iconPreset
        });

        placemark.events.add('click', function () {
            if (isDrawingTrail) {
                addPointToTrail(coords);
            }
        });

        myMap.geoObjects.add(placemark);
    });

    if (savedPath.length > 0) {
        trailPoints = savedPath;
        drawPolyline(savedPath);
    }

    myMap.events.add('click', function (e) {
        if (isDrawingTrail) {
            var coords = e.get('coords');
            addPointToTrail(coords);
        }
    });
}

function drawPolyline(coordsArray) {
    if (currentPolyline) {
        myMap.geoObjects.remove(currentPolyline);
        currentPolyline = null;
    }
    
    if (!coordsArray || coordsArray.length < 2) return;

    currentPolyline = new ymaps.Polyline(coordsArray, {
        hintContent: "Экологическая тропа"
    }, {
        strokeColor: "#27ae60",
        strokeWidth: 5,
        strokeOpacity: 0.8
    });
    myMap.geoObjects.add(currentPolyline);
}

function addPointToTrail(coords) {
    trailPoints.push(coords);
    drawPolyline(trailPoints);
}

function checkAdminStatus() {
    var isEditor = localStorage.getItem('isEditorLoggedIn') === 'true';
    var adminPanel = document.getElementById('admin-panel');
    var loginBtn = document.getElementById('login-btn');

    if (adminPanel) adminPanel.style.display = isEditor ? 'flex' : 'none';
    if (loginBtn) loginBtn.innerText = isEditor ? '🚪 Выход' : '🔑 Вход для редактора';

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

function toggleAdminLogin() {
    var isEditor = localStorage.getItem('isEditorLoggedIn') === 'true';

    if (isEditor) {
        localStorage.setItem('isEditorLoggedIn', 'false');
        alert("Вы вышли из режима редактора.");
        location.reload();
    } else {
        var password = prompt("Введите пароль редактора:");
        if (password === "admin" || password === "1234") {
            localStorage.setItem('isEditorLoggedIn', 'true');
            alert("Вы успешно вошли!");
            location.reload();
        } else if (password !== null) {
            alert("Неверный пароль!");
        }
    }
}

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
        if (hint) hint.style.display = "block";
    } else {
        if (btn) {
            btn.innerText = "✏️ Соединить метки в тропу";
            btn.style.background = "";
        }
        if (hint) hint.style.display = "none";
        localStorage.setItem('eco_trail_path', JSON.stringify(trailPoints));
        alert("Тропа успешно сохранена!");
    }
}

function deleteSinglePlace(index) {
    if (confirm("Удалить эту метку?")) {
        var savedPlaces = JSON.parse(localStorage.getItem('eco_places')) || [];
        savedPlaces.splice(index, 1);
        localStorage.setItem('eco_places', JSON.stringify(savedPlaces));
        location.reload();
    }
}

function deleteTrailOnly() {
    if (confirm("Вы уверены, что хотите полностью удалить тропу? Метки останутся.")) {
        localStorage.removeItem('eco_trail_path');
        trailPoints = [];
        if (currentPolyline) {
            myMap.geoObjects.remove(currentPolyline);
            currentPolyline = null;
        }
        alert("Тропа удалена!");
        location.reload();
    }
}
