document.addEventListener('DOMContentLoaded', function() {
    var form = document.getElementById('add-form');

    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();

            var category = document.getElementById('category').value;
            var title = document.getElementById('title').value;
            var description = document.getElementById('description').value;
            var image = document.getElementById('image').value;
            var lat = parseFloat(document.getElementById('lat').value);
            var lng = parseFloat(document.getElementById('lng').value);

            var savedPlaces = JSON.parse(localStorage.getItem('eco_places')) || [];

            savedPlaces.push({
                category: category,
                title: title,
                description: description,
                image: image,
                lat: lat,
                lng: lng,
                coords: [lat, lng]
            });

            localStorage.setItem('eco_places', JSON.stringify(savedPlaces));
            alert('Новый вид успешно добавлен!');
            window.location.href = 'index.html';
        });
    }
});
