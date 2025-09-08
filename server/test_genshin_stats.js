import axios from 'axios';

// Тестируем API статистики Genshin
async function testGenshinStats() {
  try {
    console.log('Testing Genshin stats API...');
    
    // Получаем статистику напрямую через внутренний порт без аутентификации
    const response = await axios.get('http://localhost:3001/api/gacha/stats/11111111111?game=GENSHIN', {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Проверяем recentFiveStars
    if (response.data.recentFiveStars) {
      console.log('\nRecent 5-stars found:', response.data.recentFiveStars.length);
      response.data.recentFiveStars.slice(0, 3).forEach((pull, i) => {
        console.log(`${i + 1}. ${pull.itemName} (${pull.itemType}) from ${pull.banner?.bannerName}`);
      });
    } else {
      console.log('\nNo recentFiveStars found');
    }
    
  } catch (error) {
    console.error('Error testing Genshin stats:', error.response?.data || error.message);
  }
}

testGenshinStats();
