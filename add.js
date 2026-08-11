const form = document.getElementById('add-form');

form.addEventListener('submit', function(event) {
    event.preventDefault();

    // Забираем данные из полей
    const newPlace = {
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        image: document.getElementById('image').value,
        lat: parseFloat(document.getElementById('lat').value),
        lng: parseFloat(document.getElementById('lng').value)
    };

    // Сохраняем в памяти браузера
    let places = JSON.parse(localStorage.getItem("eco_places")) || [];
    places.push(newPlace);
    localStorage.setItem("eco_places", JSON.stringify(places));

    // Переходим обратно на главную страницу с картой
    window.location.href = "index.html";
});