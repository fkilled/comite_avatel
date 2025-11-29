// Bloquear clic derecho
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});

// Bloquear Ctrl+C, Ctrl+X, Ctrl+S y Ctrl+A
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey) {
        const key = e.key.toLowerCase();
        if (['c','x','s','a'].includes(key)) {
            e.preventDefault();
            alert('Copiar contenido no está permitido.');
        }
    }
});
