document.addEventListener('DOMContentLoaded', function() {
    var form = document.getElementById('add-form');

    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();

            var newPlace = {
                category: document.getElementById('category').value,
                title: document.getElementById('title').value,
                speciesLatin: document.getElementById('speciesLatin').value || '',
                description: document.getElementById('description').value,
                image: document.getElementById('image').value,
                lat: parseFloat(document.getElementById('lat').value),
                lng: parseFloat(document.getElementById('lng').value),
                coords: [parseFloat(document.getElementById('lat').value), parseFloat(document.getElementById('lng').value)],
                // Новые спец-поля
                pharma: {
                    rawMaterial: document.getElementById('rawMaterial').value || '',
                    activeCompounds: document.getElementById('activeCompounds').value || ''
                },
                hydro: {
                    ph: document.getElementById('ph').value || '',
                    gh: document.getElementById('gh').value || '',
                    fe: document.getElementById('fe').value || ''
                }
            };

            var savedPlaces = JSON.parse(localStorage.getItem('eco_places')) || [];
            savedPlaces.push(newPlace);

            localStorage.setItem('eco_places', JSON.stringify(savedPlaces));
            alert('Новый экологический пункт успешно добавлен!');
            window.location.href = 'index.html';
        });
    }
});
