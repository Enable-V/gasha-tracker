#!/usr/bin/env tsx

/**
 * Скрипт для создания админского аккаунта
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function createAdminUser() {
  console.log('🔧 Создание админского аккаунта...')
  
  try {
    // Проверяем, существует ли уже админ
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (existingAdmin) {
      console.log('⚠️ Админский аккаунт уже существует:', existingAdmin.username)
      return
    }

    // Создаем админский аккаунт
    const hashedPassword = await bcrypt.hash('admin123', 10)
    
    const admin = await prisma.user.create({
      data: {
        uid: 'admin',
        username: 'admin',
        email: 'admin@hsr-gacha.local',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true
      }
    })

    console.log('✅ Админский аккаунт создан успешно!')
    console.log(`👤 Логин: admin`)
    console.log(`🔑 Пароль: admin123`)
    console.log(`📧 Email: admin@hsr-gacha.local`)
    console.log(`🆔 ID: ${admin.id}`)
    
  } catch (error) {
    console.error('❌ Ошибка создания админского аккаунта:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdminUser()
