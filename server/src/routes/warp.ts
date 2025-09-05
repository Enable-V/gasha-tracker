import express from 'express'
import axios from 'axios'
import { logger } from '../middleware/logger.js'

const router = express.Router()

// Прокси-эндпоинт для HSR API (как в pom-moe)
router.post('/warp', async (req, res) => {
  try {
    const { url } = req.body
    
    if (!url) {
      return res.status(400).json({
        retcode: -1,
        message: 'URL is required',
        data: null
      })
    }

    logger.info(`Making proxy request to HSR API: ${url.substring(0, 100)}...`)

    // Делаем запрос к HSR API через прокси
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://webstatic-sea.mihoyo.com/',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site'
      }
    })

    const data = response.data
    
    logger.info(`HSR API response: retcode=${data.retcode}, items=${data.data?.list?.length || 0}`)

    // Возвращаем данные в том же формате, что и HSR API
    res.json(data)

  } catch (error: any) {
    logger.error('Proxy error:', error.message)
    
    if (error.response) {
      // Если есть ответ от HSR API, передаем его
      res.status(error.response.status).json(error.response.data)
    } else {
      // Если ошибка сети или таймаут
      res.status(500).json({
        retcode: -1,
        message: error.message || 'Network error',
        data: null
      })
    }
  }
})

export default router
