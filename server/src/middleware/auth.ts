import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'

export interface AuthRequest extends Request {
  user?: {
    id: number
    uid: string
    username: string
    email?: string
    role?: string
  }
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'Access token required',
      message: 'Требуется токен доступа' 
    })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    // Проверяем, существует ли пользователь и активен ли он
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        uid: true,
        username: true,
        email: true,
        isActive: true
      }
    })

    if (!user || !user.isActive) {
      return res.status(403).json({ 
        error: 'User not found or inactive',
        message: 'Пользователь не найден или неактивен' 
      })
    }

    // Получаем полные данные пользователя включая role
    const fullUser = await prisma.user.findUnique({
      where: { id: decoded.id }
    }) as any

    req.user = {
      id: user.id,
      uid: user.uid,
      username: user.username,
      email: user.email || undefined,
      role: fullUser?.role || 'USER'
    }
    next()
  } catch (error) {
    return res.status(403).json({ 
      error: 'Invalid token',
      message: 'Недействительный токен' 
    })
  }
}

export const authenticateOptional = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return next() // Продолжаем без аутентификации
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        uid: true,
        username: true,
        email: true,
        isActive: true
      }
    })

    if (user && user.isActive) {
      // Получаем полные данные пользователя включая role
      const fullUser = await prisma.user.findUnique({
        where: { id: decoded.id }
      }) as any

      req.user = {
        id: user.id,
        uid: user.uid,
        username: user.username,
        email: user.email || undefined,
        role: fullUser?.role || 'USER'
      }
    }
  } catch (error) {
    // Игнорируем ошибки токена при опциональной аутентификации
  }

  next()
}

export const requireOwnership = (req: AuthRequest, res: Response, next: NextFunction) => {
  const { userId } = req.params

  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Требуется аутентификация'
    })
  }

  // Пользователь может получать доступ только к своим данным
  if (req.user.id !== parseInt(userId)) {
    return res.status(403).json({
      error: 'Access denied',
      message: 'Доступ запрещен. Вы можете просматривать только свои данные.'
    })
  }

  next()
}

// Middleware для проверки админских прав
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Требуется аутентификация'
    })
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      error: 'Admin access required',
      message: 'Требуются права администратора'
    })
  }

  next()
}
