import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function testImport() {
  try {
    // Читаем JSON файл
    const jsonData = JSON.parse(fs.readFileSync(path.join(__dirname, '../../paimon-moe-local-data.json'), 'utf8'));

    // Извлекаем pulls из wish-counter-character-event
    const pulls = jsonData['wish-counter-character-event'].pulls;

    console.log(`Found ${pulls.length} pulls to import`);

    // Отправляем запрос на сервер
    const response = await fetch('http://localhost:3001/api/genshin/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid: '2', // Используем UID 2 как в логах
        data: pulls
      })
    });

    const result = await response.json();
    console.log('Import result:', result);

  } catch (error) {
    console.error('Error:', error);
  }
}

testImport();
