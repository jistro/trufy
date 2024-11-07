fetch('/api/issue', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    field1: '123456789', //example 1
    field2: '987654321' //example2
  })
})
  .then(response => response.json())
  .then(data => {
    console.log('Respuesta del servidor:', data);
  })
  .catch(error => {
    console.error('Error al llamar a la API:', error);
  });

