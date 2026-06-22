const jwt = require('jsonwebtoken');

// Usamos el secreto general para generar un token válido
const token = jwt.sign(
  { id: 'usr-123', email: 'test@test.com', rol: 'CLIENTE' },
  's3mOQsAQ0LR8zRi5sCxl+S3kVDEahqAU6va53v9JHrooNCsh20gajHs2NmYfQC00CW643twrxkxl13+h+F9tQA==',
  { expiresIn: '1h' }
);

async function test() {
  console.log("Token: " + token);
  try {
    const res = await fetch('http://localhost/api/v1/reservas/34658a05-f43f-4cdb-a729-54d07ec77d71/cancelar', {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log("Status confirmar:", res.status);
    console.log("Response:", await res.text());
  } catch(e) { console.error(e); }
}

test();
