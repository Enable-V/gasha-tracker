import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import { authenticateToken, AuthRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'

// Регистрация пользователя
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body

    // Валидация входных данных
    if (!username || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Имя пользователя и пароль обязательны'
      })
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password too short',
        message: 'Пароль должен содержать минимум 6 символов'
      })
    }

    // Проверяем, существует ли пользователь
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email: email || undefined }
        ].filter(Boolean)
      }
    })

    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'Пользователь с таким именем или email уже существует'
      })
    }

    // Генерируем уникальный UID для обратной совместимости (не более 20 символов)
    let uid: string
    let attempts = 0
    do {
      uid = `u${Date.now().toString().slice(-6)}${Math.random().toString(36).substr(2, 6)}`
      attempts++
      if (attempts > 10) {
        // Fallback на более простой UID если не можем сгенерировать уникальный
        uid = `u${Date.now().toString().slice(-8)}`
        break
      }
    } while (await prisma.user.findUnique({ where: { uid } }))

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10)

    // Создаем пользователя
    const user = await prisma.user.create({
      data: {
        uid,
        username,
        email: email || null,
        password: hashedPassword
      },
      select: {
        id: true,
        uid: true,
        username: true,
        email: true,
        createdAt: true
      }
    })

    // Создаем JWT токен
    const token = jwt.sign(
      { id: user.id, uid: user.uid },
      JWT_SECRET,
      { expiresIn: '30d' }
    )

    res.status(201).json({
      message: 'User registered successfully',
      user,
      token
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({
      error: 'Registration failed',
      message: 'Ошибка при регистрации пользователя'
    })
  }
})

// Вход пользователя
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        message: 'Имя пользователя и пароль обязательны'
      })
    }

    // Находим пользователя по username или email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email: username } // Позволяем вход по email тоже
        ]
      }
    })

    if (!user || !user.password) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Неверное имя пользователя/email или пароль'
      })
    }

    if (!user.isActive) {
      return res.status(403).json({
        error: 'Account disabled',
        message: 'Аккаунт отключен'
      })
    }

    // Проверяем пароль
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Неверное имя пользователя/email или пароль'
      })
    }

    // Создаем JWT токен
    const token = jwt.sign(
      { id: user.id, uid: user.uid },
      JWT_SECRET,
      { expiresIn: '30d' }
    )

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        uid: user.uid,
        username: user.username,
        email: user.email
      },
      token
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      error: 'Login failed',
      message: 'Ошибка при входе в систему'
    })
  }
})

// Получение информации о текущем пользователе
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        uid: true,
        username: true,
        email: true,
        createdAt: true,
        _count: {
          select: {
            gachaPulls: true
          }
        }
      }
    })

    res.json({ user })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({
      error: 'Failed to get user info',
      message: 'Ошибка получения информации о пользователе'
    })
  }
})

// Обновление профиля пользователя
router.put('/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { username, email } = req.body

    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(username && { username }),
        ...(email && { email })
      },
      select: {
        id: true,
        uid: true,
        username: true,
        email: true,
        updatedAt: true
      }
    })

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({
      error: 'Failed to update profile',
      message: 'Ошибка обновления профиля'
    })
  }
})

// Смена пароля
router.put('/change-password', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Missing passwords',
        message: 'Текущий и новый пароль обязательны'
      })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'Password too short',
        message: 'Новый пароль должен содержать минимум 6 символов'
      })
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    })

    if (!user || !user.password) {
      return res.status(404).json({
        error: 'User not found',
        message: 'Пользователь не найден'
      })
    }

    // Проверяем текущий пароль
    const isValidPassword = await bcrypt.compare(currentPassword, user.password)
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid current password',
        message: 'Неверный текущий пароль'
      })
    }

    // Хешируем новый пароль
    const hashedNewPassword = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { id: req.user!.id },
      data: { password: hashedNewPassword }
    })

    res.json({
      message: 'Password changed successfully'
    })
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({
      error: 'Failed to change password',
      message: 'Ошибка смены пароля'
    })
  }
})

export default router
