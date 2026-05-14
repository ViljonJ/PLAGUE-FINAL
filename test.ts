fetch('http://localhost:3000/api/users/MEfJkDRTA2Uiwh6E59fd5VX4qwD2')
  .then(r => r.text().then(t => console.log('STATUS:', r.status, 'BODY:', t.substring(0, 100))))
  .catch(console.error);
