import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import BannerImage from '../components/BannerImage'
import { 
  CloudArrowUpIcon, 
  PhotoIcon, 
  FolderIcon, 
  TrashIcon,
  PencilIcon,
  ChartBarIcon,
  UserGroupIcon,
  CogIcon,
  ShieldCheckIcon,
  PlusIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ChevronDownIcon
} from '@heroicons/react/24/solid'

interface AdminStats {
  users: number
  admins: number
  banners: number
  pulls: number
  mappings: number
  games: {
    HSR: number
    GENSHIN: number
  }
}

interface ImageFile {
  type: 'file' | 'folder'
  name: string
  path: string
  size?: number
  modified?: string
  children?: ImageFile[]
}

interface User {
  id: number
  uid: string
  username: string
  email: string | null
  role?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count: {
    gachaPulls: number
  }
}

interface UserStats {
  user: User
  stats: {
    pullStats: Array<{rankType: number, game: string, _count: number}>
    bannerStats: Array<{itemType: string, game: string, _count: number}>
  }
}

interface Mapping {
  id: number
  englishName: string
  russianName: string
  game: string
  itemType: string
  rarity: number
  imagePath?: string
}

interface Banner {
  id: number
  bannerId: string
  bannerName: string
  bannerNameRu?: string
  bannerType: string
  game: string
  imagePath?: string
  startTime?: string
  endTime?: string
  createdAt: string
  _count: {
    gachaPulls: number
  }
}

interface ImageItem {
  id: string
  name: string
  path: string
  folder: string
  size: number
  modified: string
  type: string
}

// Сброс клиентского кеша изображений (localStorage + in-memory через window.debugImageCache)
const clearImageMappingsCache = () => {
  localStorage.removeItem('hsr_image_mappings')
  localStorage.removeItem('genshin_image_mappings')
  if (typeof window !== 'undefined' && (window as any).debugImageCache?.clearCache) {
    (window as any).debugImageCache.clearCache()
  }
  console.log('🗑️ Client image mappings cache cleared')
}

const AdminPanel: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [activeTab, setActiveTab] = useState<'overview' | 'images' | 'users' | 'translations' | 'banners' | 'cache'>('overview')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [_images, setImages] = useState<ImageFile[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [mappings, setMappings] = useState<Mapping[]>([])
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  // const [uploadModal] = useState(false)
  
  // Состояние для управления переводами
  const [showMappingForm, setShowMappingForm] = useState(false)
  const [editingMapping, setEditingMapping] = useState<Mapping | null>(null)
  const [mappingForm, setMappingForm] = useState({
    englishName: '',
    russianName: '',
    game: 'HSR',
    itemType: 'CHARACTER',
    rarity: 5
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Состояние для управления пользователями
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  
  // Состояние для управления изображениями и баннерами
  const [banners, setBanners] = useState<Banner[]>([])
  const [imageItems, setImageItems] = useState<ImageItem[]>([])
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null)
  const [selectedMapping, setSelectedMapping] = useState<Mapping | null>(null)
  const [showImageModal, setShowImageModal] = useState(false)
  const [imageSearchTerm, setImageSearchTerm] = useState('')
  const [bannerPage, setBannerPage] = useState(1)
  const [bannerTotalPages, setBannerTotalPages] = useState(1)
  
  // Пагинация для изображений
  const [imagePage, setImagePage] = useState(1)
  const [imageTotalPages, setImageTotalPages] = useState(1)
  const [imageFilterFolder, setImageFilterFolder] = useState('')
  const IMAGES_PER_PAGE = 20
  
  // Состояние для drag & drop
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({})
  const [selectedFolder, setSelectedFolder] = useState<string>('/')
  const [folderStructure, setFolderStructure] = useState<{[key: string]: string[]}>({})
  
  // Состояние для форм баннеров  
  const [showBannerForm, setShowBannerForm] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)
  const [bannerForm, setBannerForm] = useState({
    bannerId: '',
    bannerName: '',
    bannerNameRu: '',
    bannerType: 'CHARACTER_EVENT',
    game: 'HSR',
    imagePath: '',
    startTime: '',
    endTime: ''
  })
  
  // Состояние для выпадающих списков
  const [dropdowns, setDropdowns] = useState({
    game: false,
    itemType: false,
    rarity: false,
    imageFolder: false,
    uploadFolder: false
  })

  // Состояние для загрузки изображений в модалке
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [uploadFolder, setUploadFolder] = useState('characters')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [showUploadSection, setShowUploadSection] = useState(false)

  // Состояние для модалки уведомлений
  const [notification, setNotification] = useState<{
    show: boolean
    type: 'success' | 'error' | 'info'
    title: string
    message: string
  }>({
    show: false,
    type: 'info',
    title: '',
    message: ''
  })

  // Состояние для статистики Redis
  const [redisStats, setRedisStats] = useState({
    keys: 0,
    memory: '0 MB',
    connections: 0,
    hits: 0,
    misses: 0,
    uptime: '0 дней',
    version: '',
    topKeys: [] as Array<{key: string, type: string, ttl: number}>
  })

  // Состояние для управления кешем
  const [cacheSettings, setCacheSettings] = useState({
    enabled: true,
    ttl: 3600
  })
  const [cacheLoading, setCacheLoading] = useState(false)
  const [cacheSubTab, setCacheSubTab] = useState<'settings' | 'stats' | 'metrics' | 'system'>('settings')

  // Состояние для детальной информации о кеше и сервере
  const [detailedInfo, setDetailedInfo] = useState<any>(null)
  const [cacheMetrics, setCacheMetrics] = useState<any>(null)
  const [systemHealth, setSystemHealth] = useState<any>(null)
  const [infoLoading, setInfoLoading] = useState(false)

  // Состояние для лоадера при привязке изображений
  const [isBindingImage, setIsBindingImage] = useState(false)

  // Проверяем права доступа
  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    
    // Проверяем роль пользователя (временно закомментировано)
    // if (user.role !== 'ADMIN') {
    //   navigate('/dashboard')
    //   return
    // }
    
    loadAdminData()
  }, [user, navigate])

  // Загружаем переводы при смене вкладки
  useEffect(() => {
    if (activeTab === 'translations') {
      loadMappings(currentPage, searchTerm)
    } else if (activeTab === 'banners') {
      loadBanners(bannerPage, imageSearchTerm)
    } else if (activeTab === 'images') {
      loadImageItems()
      loadFolderStructure()
    }
  }, [activeTab])

  // Перезагружаем переводы при изменении поиска или страницы
  useEffect(() => {
    if (activeTab === 'translations') {
      loadMappings(currentPage, searchTerm)
    }
  }, [currentPage, searchTerm])

  // Перезагружаем баннеры при изменении поиска или страницы
  useEffect(() => {
    if (activeTab === 'banners') {
      loadBanners(bannerPage, imageSearchTerm)
    }
  }, [bannerPage, imageSearchTerm])

  // Перезагружаем изображения при изменении фильтров
  useEffect(() => {
    if (activeTab === 'images') {
      const timeoutId = setTimeout(() => {
        loadImageItems()
      }, 300) // Дебаунс для поиска
      
      return () => clearTimeout(timeoutId)
    }
  }, [imageSearchTerm, imageFilterFolder])

  // Сброс страницы при изменении фильтров
  useEffect(() => {
    setImagePage(1)
  }, [imageSearchTerm, imageFilterFolder])

  // Закрываем выпадающие списки при клике вне
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.custom-dropdown')) {
        closeAllDropdowns()
      }
    }

    if (showMappingForm) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMappingForm])

  // Загружаем настройки кеша при смене вкладки
  useEffect(() => {
    if (activeTab === 'cache') {
      loadCacheSettings()
      loadRedisStats()
      loadDetailedCacheInfo()
      loadCacheMetrics()
      loadSystemHealth()
    }
  }, [activeTab])

  const loadCacheSettings = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('/api/admin/cache/settings', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setCacheSettings(response.data)
    } catch (error) {
      console.error('Failed to load cache settings:', error)
    }
  }

  const loadDetailedCacheInfo = async () => {
    try {
      setInfoLoading(true)
      const token = localStorage.getItem('token')
      const response = await axios.get('/api/admin/cache/detailed-info', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setDetailedInfo(response.data)
    } catch (error) {
      console.error('Failed to load detailed cache info:', error)
    } finally {
      setInfoLoading(false)
    }
  }

  const loadCacheMetrics = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('/api/admin/cache/metrics', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setCacheMetrics(response.data.metrics)
    } catch (error) {
      console.error('Failed to load cache metrics:', error)
    }
  }

  const loadSystemHealth = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('/api/admin/system/health', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSystemHealth(response.data.health)
    } catch (error) {
      console.error('Failed to load system health:', error)
    }
  }

  const loadAdminData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }

      const [statsRes, imagesRes, usersRes] = await Promise.all([
        axios.get('/api/admin/stats', { headers }),
        axios.get('/api/admin/images', { headers }),
        axios.get('/api/admin/users', { headers })
      ])

      setStats(statsRes.data.stats)
      setImages(imagesRes.data.images)
      setUsers(usersRes.data.users)
      
      // Загружаем переводы, если выбрана соответствующая вкладка
      if (activeTab === 'translations') {
        loadMappings()
      }
    } catch (error: any) {
      console.error('Error loading admin data:', error)
      if (error.response?.status === 403) {
        navigate('/dashboard')
      }
    } finally {
      setLoading(false)
    }
  }

  // Функция для загрузки статистики Redis
  const loadRedisStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('/api/admin/cache/redis-stats', {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.data.success) {
        setRedisStats(response.data.stats)
      }
    } catch (error) {
      console.error('Failed to load Redis stats:', error)
    }
  }

  // Утилитарные функции для форматирования данных
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (days > 0) return `${days}д ${hours}ч ${minutes}м`
    if (hours > 0) return `${hours}ч ${minutes}м`
    return `${minutes}м`
  }

  const formatTimestamp = (date: Date | string): string => {
    const d = new Date(date)
    return d.toLocaleString('ru-RU')
  }

  // Функция для показа уведомлений
  const showNotification = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setNotification({
      show: true,
      type,
      title,
      message
    })
    
    // Автоматически скрываем уведомление через 5 секунд
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }))
    }, 5000)
  }

  // Функция для загрузки изображений в модалку
  const uploadImageInModal = async (file: File, folder: string) => {
    if (!file) {
      showNotification('error', 'Ошибка!', 'Выберите файл для загрузки')
      return
    }

    setIsUploadingImage(true)
    try {
      const token = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('image', file)
      formData.append('folder', folder)

      const response = await axios.post('/api/admin/images/upload', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data.success) {
        // После успешной загрузки автоматически привязываем изображение
        const imagePath = response.data.imagePath
        if (selectedMapping) {
          await updateMappingImage(selectedMapping.id, imagePath)
        } else if (selectedBanner) {
          await updateBannerImage(selectedBanner.id, imagePath)
        }
        
        // Обновляем список изображений
        loadImageItems()
        setSelectedFile(null)
        
        showNotification('success', 'Успешно!', 'Изображение загружено и привязано')
      }
    } catch (error: any) {
      console.error('Error uploading image:', error)
      showNotification('error', 'Ошибка!', error.response?.data?.error || 'Не удалось загрузить изображение')
    } finally {
      setIsUploadingImage(false)
    }
  }

  // Функция для загрузки изображений
  const uploadImages = async () => {
    if (selectedFiles.length === 0) {
      showNotification('error', 'Ошибка!', 'Выберите файлы для загрузки')
      return
    }

    setIsUploadingImage(true)
    try {
      const token = localStorage.getItem('token')
      const formData = new FormData()
      
      selectedFiles.forEach(file => {
        formData.append('images', file)
      })
      formData.append('folder', uploadFolder)

      const response = await axios.post('/api/admin/images/upload-multiple', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data.success) {
        showNotification('success', 'Успешно!', `Загружено ${selectedFiles.length} изображений`)
        setSelectedFiles([])
        loadImageItems() // Перезагружаем список изображений
      }
    } catch (error: any) {
      console.error('Error uploading images:', error)
      showNotification('error', 'Ошибка!', error.response?.data?.error || 'Не удалось загрузить изображения')
    } finally {
      setIsUploadingImage(false)
    }
  }

  // Функции для работы с переводами
  const loadMappings = async (page = 1, search = '') => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`/api/admin/mappings?page=${page}&search=${search}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      setMappings(response.data.mappings)
      setTotalPages(response.data.pagination.pages)
    } catch (error) {
      console.error('Error loading mappings:', error)
    }
  }

  // Загрузка пользователей
  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.data.success) {
        setUsers(response.data.users)
      }
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const saveMapping = async () => {
    try {
      const token = localStorage.getItem('token')
      const url = editingMapping 
        ? `/api/admin/mappings/${editingMapping.id}`
        : '/api/admin/mappings'
      
      const response = await axios({
        method: editingMapping ? 'PUT' : 'POST',
        url,
        headers: { Authorization: `Bearer ${token}` },
        data: mappingForm
      })
      
      if (response.data.success) {
        clearImageMappingsCache()
        setShowMappingForm(false)
        setEditingMapping(null)
        setMappingForm({
          englishName: '',
          russianName: '',
          game: 'HSR',
          itemType: 'CHARACTER',
          rarity: 5
        })
        closeAllDropdowns()
        loadMappings(currentPage, searchTerm)
      }
    } catch (error: any) {
      console.error('Error saving mapping:', error)
      alert(`Ошибка: ${error.response?.data?.error || 'Неизвестная ошибка'}`)
    }
  }

  const saveBanner = async () => {
    try {
      const token = localStorage.getItem('token')
      const url = editingBanner 
        ? `/api/admin/banners/${editingBanner.id}`
        : '/api/admin/banners'
      
      const response = await axios({
        method: editingBanner ? 'PUT' : 'POST',
        url,
        headers: { Authorization: `Bearer ${token}` },
        data: bannerForm
      })
      
      if (response.data.success) {
        setShowBannerForm(false)
        setEditingBanner(null)
        setBannerForm({
          bannerId: '',
          bannerName: '',
          bannerNameRu: '',
          bannerType: 'CHARACTER_EVENT',
          game: 'HSR',
          imagePath: '',
          startTime: '',
          endTime: ''
        })
        loadBanners()
      }
    } catch (error: any) {
      console.error('Error saving banner:', error)
      alert(`Ошибка: ${error.response?.data?.error || 'Неизвестная ошибка'}`)
    }
  }

  const deleteMapping = async (id: number) => {
    if (!confirm('Удалить этот перевод?')) return
    
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`/api/admin/mappings/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      clearImageMappingsCache()
      loadMappings(currentPage, searchTerm)
    } catch (error) {
      console.error('Error deleting mapping:', error)
    }
  }

  const startEdit = (mapping: Mapping) => {
    setEditingMapping(mapping)
    setMappingForm({
      englishName: mapping.englishName,
      russianName: mapping.russianName,
      game: mapping.game,
      itemType: mapping.itemType,
      rarity: mapping.rarity
    })
    closeAllDropdowns()
    setShowMappingForm(true)
  }

  const getRarityColor = (rarity: number) => {
    switch (rarity) {
      case 5: return 'text-yellow-400'
      case 4: return 'text-purple-400'  
      case 3: return 'text-blue-400'
      default: return 'text-gray-400'
    }
  }

  const getRarityStars = (rarity: number) => {
    return '★'.repeat(rarity)
  }

  // Функции для управления пользователями
  const changeUserPassword = async (userId: number, password: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.put(`/api/admin/users/${userId}/password`, 
        { newPassword: password },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      if (response.data.success) {
        setShowPasswordModal(false)
        setNewPassword('')
        alert('Пароль успешно изменен')
      }
    } catch (error: any) {
      console.error('Error changing password:', error)
      alert(`Ошибка: ${error.response?.data?.error || 'Не удалось изменить пароль'}`)
    }
  }

  const changeUserRole = async (userId: number, role: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.put(`/api/admin/users/${userId}/role`, 
        { role },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      if (response.data.success) {
        loadUsers()
        alert('Роль успешно изменена')
      }
    } catch (error: any) {
      console.error('Error changing role:', error)
      alert(`Ошибка: ${error.response?.data?.error || 'Не удалось изменить роль'}`)
    }
  }

  const toggleUserStatus = async (userId: number, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.put(`/api/admin/users/${userId}/status`, 
        { isActive: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      if (response.data.success) {
        loadUsers()
        alert(`Пользователь ${!currentStatus ? 'активирован' : 'заблокирован'}`)
      }
    } catch (error: any) {
      console.error('Error changing status:', error)
      alert(`Ошибка: ${error.response?.data?.error || 'Не удалось изменить статус'}`)
    }
  }

  const deleteUser = async (userId: number, username: string) => {
    if (!confirm(`Удалить пользователя ${username}? Все данные будут безвозвратно потеряны!`)) return
    
    try {
      const token = localStorage.getItem('token')
      const response = await axios.delete(`/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.data.success) {
        loadUsers()
        alert('Пользователь удален')
      }
    } catch (error: any) {
      console.error('Error deleting user:', error)
      alert(`Ошибка: ${error.response?.data?.error || 'Не удалось удалить пользователя'}`)
    }
  }

  const loadUserStats = async (userId: number) => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`/api/admin/users/${userId}/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.data.success) {
        setUserStats(response.data)
        setShowUserModal(true)
      }
    } catch (error) {
      console.error('Error loading user stats:', error)
    }
  }

  // Функции для работы с изображениями и баннерами
  const loadBanners = async (page = 1, search = '', game = 'all') => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`/api/admin/banners?page=${page}&search=${search}&game=${game}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.data.success) {
        setBanners(response.data.banners)
        setBannerTotalPages(response.data.pagination.pages)
      }
    } catch (error) {
      console.error('Error loading banners:', error)
    }
  }

  const loadImageItems = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('/api/admin/images/table', {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      console.log('Image items response:', response.data)
      
      if (response.data.success) {
        setImageItems(response.data.images)
        console.log('Loaded images:', response.data.images.length)
      }
    } catch (error) {
      console.error('Error loading image items:', error)
    }
  }

  const updateMappingImage = async (mappingId: number, imagePath: string) => {
    if (isBindingImage) return // Предотвращаем множественные вызовы
    
    setIsBindingImage(true)
    try {
      const token = localStorage.getItem('token')
      const response = await axios.put(`/api/admin/mappings/${mappingId}/image`, 
        { imagePath },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      if (response.data.success) {
        clearImageMappingsCache()
        loadMappings(currentPage, searchTerm)
        setShowImageModal(false)
        setSelectedMapping(null)
        showNotification('success', 'Успешно!', 'Изображение успешно привязано к предмету')
      }
    } catch (error: any) {
      console.error('Error updating mapping image:', error)
      showNotification('error', 'Ошибка!', error.response?.data?.error || 'Не удалось обновить изображение')
    } finally {
      setIsBindingImage(false)
    }
  }

  const updateBannerImage = async (bannerId: number, imagePath: string) => {
    if (isBindingImage) return // Предотвращаем множественные вызовы
    
    setIsBindingImage(true)
    try {
      const token = localStorage.getItem('token')
      const response = await axios.put(`/api/admin/banners/${bannerId}/image`, 
        { imagePath },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      if (response.data.success) {
        clearImageMappingsCache()
        loadBanners(bannerPage, imageSearchTerm)
        setShowImageModal(false)
        setSelectedBanner(null)
        showNotification('success', 'Успешно!', 'Изображение успешно привязано к баннеру')
      }
    } catch (error: any) {
      console.error('Error updating banner image:', error)
      showNotification('error', 'Ошибка!', error.response?.data?.error || 'Не удалось обновить изображение')
    } finally {
      setIsBindingImage(false)
    }
  }

  // Функции отвязки изображений
  const removeMappingImage = async (mappingId: number) => {
    if (!confirm('Отвязать изображение от этого предмета?')) return
    
    try {
      const token = localStorage.getItem('token')
      const response = await axios.delete(`/api/admin/mappings/${mappingId}/image`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.data.success) {
        clearImageMappingsCache()
        loadMappings(currentPage, searchTerm)
        alert('Изображение успешно отвязано от предмета')
      }
    } catch (error: any) {
      console.error('Error removing mapping image:', error)
      alert(`Ошибка: ${error.response?.data?.error || 'Не удалось отвязать изображение'}`)
    }
  }

  const removeBannerImage = async (bannerId: number) => {
    if (!confirm('Отвязать изображение от этого баннера?')) return
    
    try {
      const token = localStorage.getItem('token')
      const response = await axios.delete(`/api/admin/banners/${bannerId}/image`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.data.success) {
        clearImageMappingsCache()
        loadBanners(bannerPage, imageSearchTerm)
        alert('Изображение успешно отвязано от баннера')
      }
    } catch (error: any) {
      console.error('Error removing banner image:', error)
      alert(`Ошибка: ${error.response?.data?.error || 'Не удалось отвязать изображение'}`)
    }
  }

  // Функции управления баннерами
  const startBannerEdit = (banner: Banner) => {
    setEditingBanner(banner)
    setBannerForm({
      bannerId: banner.bannerId,
      bannerName: banner.bannerName,
      bannerNameRu: (banner as any).bannerNameRu || '',
      bannerType: banner.bannerType,
      game: banner.game,
      imagePath: banner.imagePath || '',
      startTime: banner.startTime ? new Date(banner.startTime).toISOString().split('T')[0] : '',
      endTime: banner.endTime ? new Date(banner.endTime).toISOString().split('T')[0] : ''
    })
    setShowBannerForm(true)
  }

  const deleteBanner = async (bannerId: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот баннер?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await axios.delete(`/api/admin/banners/${bannerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success) {
        loadBanners(bannerPage)
        alert('Баннер успешно удален')
      }
    } catch (error: any) {
      console.error('Error deleting banner:', error)
      alert(`Ошибка: ${error.response?.data?.error || 'Не удалось удалить баннер'}`)
    }
  }

  const openImageSelector = (type: 'mapping' | 'banner', item: Mapping | Banner) => {
    if (type === 'mapping') {
      setSelectedMapping(item as Mapping)
      setSelectedBanner(null)
    } else {
      setSelectedBanner(item as Banner)
      setSelectedMapping(null)
    }
    loadImageItems()
    setShowImageModal(true)
  }

  // Функции для drag & drop и загрузки файлов
  const loadFolderStructure = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('/api/admin/images/folders', {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.data.success) {
        setFolderStructure(response.data.folders)
      }
    } catch (error) {
      console.error('Error loading folder structure:', error)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    const imageFiles = files.filter(file => file.type.startsWith('image/'))

    if (imageFiles.length === 0) {
      alert('Пожалуйста, загрузите только изображения')
      return
    }

    await uploadFiles(imageFiles)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    await uploadFiles(files)
  }

  const uploadFiles = async (files: File[]) => {
    const token = localStorage.getItem('token')
    
    for (const file of files) {
      const formData = new FormData()
      formData.append('image', file)
      formData.append('folder', selectedFolder)

      try {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }))

        const response = await axios.post('/api/admin/images/upload', formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
              setUploadProgress(prev => ({ ...prev, [file.name]: progress }))
            }
          }
        })

        if (response.data.success) {
          setUploadProgress(prev => {
            const newProgress = { ...prev }
            delete newProgress[file.name]
            return newProgress
          })
          
          // Обновляем список изображений
          loadImageItems()
          alert(`Файл ${file.name} успешно загружен`)
        }
      } catch (error: any) {
        console.error('Error uploading file:', error)
        alert(`Ошибка загрузки ${file.name}: ${error.response?.data?.error || 'Неизвестная ошибка'}`)
        
        setUploadProgress(prev => {
          const newProgress = { ...prev }
          delete newProgress[file.name]
          return newProgress
        })
      }
    }
  }

  const deleteImage = async (imagePath: string) => {
    if (!confirm('Вы уверены, что хотите удалить это изображение?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await axios.delete(`/api/admin/images/${encodeURIComponent(imagePath)}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success) {
        loadImageItems()
        alert('Изображение успешно удалено')
      }
    } catch (error: any) {
      console.error('Error deleting image:', error)
      alert(`Ошибка: ${error.response?.data?.error || 'Не удалось удалить изображение'}`)
    }
  }

  // Функции для выпадающих списков
  const toggleDropdown = (type: keyof typeof dropdowns) => {
    setDropdowns(prev => ({
      ...prev,
      [type]: !prev[type]
    }))
  }

  const closeAllDropdowns = () => {
    setDropdowns({
      game: false,
      itemType: false,
      rarity: false,
      imageFolder: false,
      uploadFolder: false
    })
  }

  const selectOption = (type: keyof typeof dropdowns, value: string | number) => {
    if (type === 'game') {
      setMappingForm({...mappingForm, game: value as string})
    } else if (type === 'itemType') {
      setMappingForm({...mappingForm, itemType: value as string})
    } else if (type === 'rarity') {
      setMappingForm({...mappingForm, rarity: value as number})
    }
    closeAllDropdowns()
  }

  const getOptionLabel = (type: keyof typeof dropdowns, value: string | number) => {
    if (type === 'game') {
      return value === 'HSR' ? 'Honkai Star Rail' : 'Genshin Impact'
    } else if (type === 'itemType') {
      switch (value) {
        case 'CHARACTER': return 'Персонаж'
        case 'LIGHT_CONE': return 'Световой конус'
        case 'WEAPON': return 'Оружие'
        default: return value
      }
    } else if (type === 'rarity') {
      return `${value}★`
    }
    return value
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Фильтрация и пагинация изображений
  const getFilteredImages = () => {
    return imageItems.filter(img => {
      const matchesSearch = img.name.toLowerCase().includes(imageSearchTerm.toLowerCase())
      const matchesFolder = !imageFilterFolder || 
        img.folder === imageFilterFolder || 
        img.folder.includes(imageFilterFolder) ||
        (imageFilterFolder === '/' && (img.folder === '' || img.folder === '/'))
      return matchesSearch && matchesFolder
    })
  }

  const getPaginatedImages = () => {
    const filtered = getFilteredImages()
    const totalPages = Math.ceil(filtered.length / IMAGES_PER_PAGE)
    
    // Обновляем общие страницы только если значение изменилось
    if (totalPages !== imageTotalPages) {
      setTimeout(() => setImageTotalPages(totalPages), 0)
    }
    
    const startIndex = (imagePage - 1) * IMAGES_PER_PAGE
    const endIndex = startIndex + IMAGES_PER_PAGE
    
    return filtered.slice(startIndex, endIndex)
  }

  const renderFileTree = (files: ImageFile[], depth = 0) => {
    return files.map((file, index) => (
      <div key={`${file.path}-${index}`} className="mb-2">
        <div 
          className={`flex items-center p-2 rounded-lg hover:bg-white/5 cursor-pointer ${
            selectedImages.includes(file.path) ? 'bg-star-purple/10' : ''
          }`}
          style={{ paddingLeft: `${depth * 20 + 8}px` }}
          onClick={() => {
            if (file.type === 'file') {
              setSelectedImages(prev => 
                prev.includes(file.path) 
                  ? prev.filter(p => p !== file.path)
                  : [...prev, file.path]
              )
            }
          }}
        >
          {file.type === 'folder' ? (
            <FolderIcon className="w-5 h-5 text-blue-400 mr-2" />
          ) : (
            <PhotoIcon className="w-5 h-5 text-accent-cyan mr-2" />
          )}
          <div className="flex-1">
            <div className="text-white font-medium">{file.name}</div>
            {file.type === 'file' && (
              <div className="text-xs text-gray-400">
                {file.size && formatFileSize(file.size)} • {file.modified && formatDate(file.modified)}
              </div>
            )}
          </div>
          {selectedImages.includes(file.path) && (
            <div className="flex space-x-2">
              <button className="text-gray-400 hover:text-white">
                <PencilIcon className="w-4 h-4" />
              </button>
              <button className="text-red-400 hover:text-red-300">
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        {file.children && file.children.length > 0 && (
          <div>
            {renderFileTree(file.children, depth + 1)}
          </div>
        )}
      </div>
    ))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-cyan"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
        {/* Заголовок */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ShieldCheckIcon className="w-8 h-8 text-accent-cyan" />
            <h1 className="text-3xl font-bold text-gradient-gold">Админская панель</h1>
          </div>
          <p className="text-gray-400">Управление системой</p>
        </div>

        {/* Навигация */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center space-x-2 px-5 py-3 rounded-xl font-medium transition-all duration-200 border ${
              activeTab === 'overview'
                ? 'bg-accent-cyan/15 text-accent-cyan border-accent-cyan/30'
                : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/8 hover:text-white'
            }`}
          >
            <ChartBarIcon className="w-5 h-5" />
            <span>Обзор</span>
          </button>
          <button
            onClick={() => setActiveTab('images')}
            className={`flex items-center space-x-2 px-5 py-3 rounded-xl font-medium transition-all duration-200 border ${
              activeTab === 'images'
                ? 'bg-accent-cyan/15 text-accent-cyan border-accent-cyan/30'
                : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/8 hover:text-white'
            }`}
          >
            <PhotoIcon className="w-5 h-5" />
            <span>Изображения</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center space-x-2 px-5 py-3 rounded-xl font-medium transition-all duration-200 border ${
              activeTab === 'users'
                ? 'bg-accent-cyan/15 text-accent-cyan border-accent-cyan/30'
                : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/8 hover:text-white'
            }`}
          >
            <UserGroupIcon className="w-5 h-5" />
            <span>Пользователи</span>
          </button>
          <button
            onClick={() => setActiveTab('translations')}
            className={`flex items-center space-x-2 px-5 py-3 rounded-xl font-medium transition-all duration-200 border ${
              activeTab === 'translations'
                ? 'bg-accent-cyan/15 text-accent-cyan border-accent-cyan/30'
                : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/8 hover:text-white'
            }`}
          >
            <DocumentTextIcon className="w-5 h-5" />
            <span>Переводы</span>
          </button>
          <button
            onClick={() => setActiveTab('banners')}
            className={`flex items-center space-x-2 px-5 py-3 rounded-xl font-medium transition-all duration-200 border ${
              activeTab === 'banners'
                ? 'bg-accent-cyan/15 text-accent-cyan border-accent-cyan/30'
                : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/8 hover:text-white'
            }`}
          >
            <PhotoIcon className="w-5 h-5" />
            <span>Баннеры</span>
          </button>
          <button
            onClick={() => setActiveTab('cache')}
            className={`flex items-center space-x-2 px-5 py-3 rounded-xl font-medium transition-all duration-200 border ${
              activeTab === 'cache'
                ? 'bg-accent-cyan/15 text-accent-cyan border-accent-cyan/30'
                : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/8 hover:text-white'
            }`}
          >
            <CogIcon className="w-5 h-5" />
            <span>Кеш</span>
          </button>
        </div>

        {/* Обзор */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="card text-center hover:scale-105 transition-transform">
                <UserGroupIcon className="w-8 h-8 text-accent-cyan mx-auto mb-2" />
                <p className="text-3xl font-bold text-blue-400">{stats.users}</p>
                <p className="text-gray-400 text-sm mt-1">Пользователи</p>
              </div>
              
              <div className="card text-center hover:scale-105 transition-transform">
                <CogIcon className="w-8 h-8 text-accent-cyan mx-auto mb-2" />
                <p className="text-3xl font-bold text-blue-400">{stats.banners}</p>
                <p className="text-gray-400 text-sm mt-1">Баннеры</p>
              </div>
              
              <div className="card text-center hover:scale-105 transition-transform">
                <ChartBarIcon className="w-8 h-8 text-star-purple-light mx-auto mb-2" />
                <p className="text-3xl font-bold text-blue-400">{stats.pulls.toLocaleString()}</p>
                <p className="text-gray-400 text-sm mt-1">Всего круток</p>
              </div>
              
              <div className="card text-center hover:scale-105 transition-transform">
                <DocumentTextIcon className="w-8 h-8 text-accent-cyan mx-auto mb-2" />
                <p className="text-3xl font-bold text-blue-400">{stats.mappings}</p>
                <p className="text-gray-400 text-sm mt-1">Переводы</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="text-xl font-bold text-white mb-4">Статистика по играм</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Honkai Star Rail</span>
                    <span className="text-white font-bold">{stats.games.HSR.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Genshin Impact</span>
                    <span className="text-white font-bold">{stats.games.GENSHIN.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="card">
                <h3 className="text-xl font-bold text-white mb-4">Быстрые действия</h3>
                <div className="space-y-3">
                  <button 
                    onClick={() => setActiveTab('images')}
                    className="w-full px-4 py-2 bg-star-purple/15 border border-star-purple/25 hover:bg-star-purple/25 text-star-purple-light rounded-xl transition-all flex items-center space-x-2"
                  >
                    <PhotoIcon className="w-4 h-4" />
                    <span>Управление изображениями</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('users')}
                    className="w-full px-4 py-2 bg-star-blue/15 border border-star-blue/25 hover:bg-star-blue/25 text-star-blue-light rounded-xl transition-all flex items-center space-x-2"
                  >
                    <UserGroupIcon className="w-4 h-4" />
                    <span>Управление пользователями</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Управление изображениями */}
        {activeTab === 'images' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Управление изображениями</h2>
              <div className="flex space-x-3">
                <button 
                  onClick={() => setActiveTab('translations')}
                  className="px-4 py-2 bg-accent-cyan/15 border border-accent-cyan/25 hover:bg-accent-cyan/25 text-accent-cyan rounded-lg transition-colors flex items-center space-x-2"
                >
                  <DocumentTextIcon className="w-4 h-4" />
                  <span>Привязать к предметам</span>
                </button>
                <button 
                  onClick={loadImageItems}
                  className="px-4 py-2 bg-star-purple/15 border border-star-purple/25 hover:bg-star-purple/25 text-star-purple-light rounded-lg transition-colors flex items-center space-x-2"
                >
                  <PhotoIcon className="w-4 h-4" />
                  <span>Обновить список</span>
                </button>
              </div>
            </div>

            {/* Drag & Drop зона для загрузки */}
            <div className="bg-gradient-to-r from-white/3 to-white/3 rounded-xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Загрузка изображений</h3>
              
              {/* Выбор папки */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">Папка для загрузки</label>
                <div className="relative custom-dropdown">
                  <div
                    onClick={() => toggleDropdown('uploadFolder')}
                    className="w-full bg-white/10 border border-white/10 text-white px-3 py-2 rounded-lg focus:ring-2 focus:ring-accent-cyan cursor-pointer flex items-center justify-between hover:bg-white/15 transition-colors"
                  >
                    <span>{selectedFolder === '/' ? 'Корень' : selectedFolder === 'characters' ? 'characters (персонажи)' : selectedFolder === 'weapons' ? 'weapons (оружие)' : selectedFolder === 'artifacts' ? 'artifacts (артефакты)' : selectedFolder === 'items' ? 'items (предметы)' : selectedFolder === 'elements' ? 'elements (элементы)' : selectedFolder === 'banners' ? 'banners (баннеры)' : selectedFolder === 'events' ? 'events (события)' : selectedFolder === 'skills' ? 'skills (навыки)' : selectedFolder === 'monsters' ? 'monsters (монстры)' : selectedFolder === 'tcg' ? 'tcg (карточная игра)' : selectedFolder === 'home' ? 'home (дом)' : selectedFolder === 'fishing' ? 'fishing (рыбалка)' : selectedFolder === 'furnishing' ? 'furnishing (мебель)' : selectedFolder === 'daily' ? 'daily (ежедневные)' : selectedFolder === 'donation' ? 'donation (пожертвования)' : selectedFolder}</span>
                    <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${dropdowns.uploadFolder ? 'rotate-180' : ''}`} />
                  </div>
                  {dropdowns.uploadFolder && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-[#0f0f1e]/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.4)] z-10 overflow-hidden max-h-60 overflow-y-auto">
                      <div
                        onClick={() => {
                          setSelectedFolder('/')
                          toggleDropdown('uploadFolder')
                        }}
                        className="px-3 py-2 text-white hover:bg-white/10 cursor-pointer transition-colors"
                      >
                        Корень
                      </div>
                      <div
                        onClick={() => {
                          setSelectedFolder('characters')
                          toggleDropdown('uploadFolder')
                        }}
                        className="px-3 py-2 text-white hover:bg-white/10 cursor-pointer transition-colors"
                      >
                        characters (персонажи)
                      </div>
                      <div
                        onClick={() => {
                          setSelectedFolder('weapons')
                          toggleDropdown('uploadFolder')
                        }}
                        className="px-3 py-2 text-white hover:bg-white/10 cursor-pointer transition-colors"
                      >
                        weapons (оружие)
                      </div>
                      <div
                        onClick={() => {
                          setSelectedFolder('artifacts')
                          toggleDropdown('uploadFolder')
                        }}
                        className="px-3 py-2 text-white hover:bg-white/10 cursor-pointer transition-colors"
                      >
                        artifacts (артефакты)
                      </div>
                      <div
                        onClick={() => {
                          setSelectedFolder('items')
                          toggleDropdown('uploadFolder')
                        }}
                        className="px-3 py-2 text-white hover:bg-white/10 cursor-pointer transition-colors"
                      >
                        items (предметы)
                      </div>
                      <div
                        onClick={() => {
                          setSelectedFolder('elements')
                          toggleDropdown('uploadFolder')
                        }}
                        className="px-3 py-2 text-white hover:bg-white/10 cursor-pointer transition-colors"
                      >
                        elements (элементы)
                      </div>
                      <div
                        onClick={() => {
                          setSelectedFolder('banners')
                          toggleDropdown('uploadFolder')
                        }}
                        className="px-3 py-2 text-white hover:bg-white/10 cursor-pointer transition-colors"
                      >
                        banners (баннеры)
                      </div>
                      <div
                        onClick={() => {
                          setSelectedFolder('events')
                          toggleDropdown('uploadFolder')
                        }}
                        className="px-3 py-2 text-white hover:bg-white/10 cursor-pointer transition-colors"
                      >
                        events (события)
                      </div>
                      <div
                        onClick={() => {
                          setSelectedFolder('skills')
                          toggleDropdown('uploadFolder')
                        }}
                        className="px-3 py-2 text-white hover:bg-white/10 cursor-pointer transition-colors"
                      >
                        skills (навыки)
                      </div>
                      <div
                        onClick={() => {
                          setSelectedFolder('monsters')
                          toggleDropdown('uploadFolder')
                        }}
                        className="px-3 py-2 text-white hover:bg-white/10 cursor-pointer transition-colors"
                      >
                        monsters (монстры)
                      </div>
                      <div
                        onClick={() => {
                          setSelectedFolder('tcg')
                          toggleDropdown('uploadFolder')
                        }}
                        className="px-3 py-2 text-white hover:bg-white/10 cursor-pointer transition-colors"
                      >
                        tcg (карточная игра)
                      </div>
                      <div
                        onClick={() => {
                          setSelectedFolder('home')
                          toggleDropdown('uploadFolder')
                        }}
                        className="px-3 py-2 text-white hover:bg-white/10 cursor-pointer transition-colors"
                      >
                        home (дом)
                      </div>
                      <div
                        onClick={() => {
                          setSelectedFolder('fishing')
                          toggleDropdown('uploadFolder')
                        }}
                        className="px-3 py-2 text-white hover:bg-white/10 cursor-pointer transition-colors"
                      >
                        fishing (рыбалка)
                      </div>
                      <div
                        onClick={() => {
                          setSelectedFolder('furnishing')
                          toggleDropdown('uploadFolder')
                        }}
                        className="px-3 py-2 text-white hover:bg-white/10 cursor-pointer transition-colors"
                      >
                        furnishing (мебель)
                      </div>
                      <div
                        onClick={() => {
                          setSelectedFolder('daily')
                          toggleDropdown('uploadFolder')
                        }}
                        className="px-3 py-2 text-white hover:bg-white/10 cursor-pointer transition-colors"
                      >
                        daily (ежедневные)
                      </div>
                      <div
                        onClick={() => {
                          setSelectedFolder('donation')
                          toggleDropdown('uploadFolder')
                        }}
                        className="px-3 py-2 text-white hover:bg-white/10 cursor-pointer transition-colors"
                      >
                        donation (пожертвования)
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Drag & Drop область */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-accent-cyan bg-accent-cyan/10' 
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <CloudArrowUpIcon className={`w-12 h-12 mx-auto mb-4 ${
                  dragActive ? 'text-accent-cyan' : 'text-gray-400'
                }`} />
                <p className="text-white font-medium mb-2">
                  Перетащите изображения сюда или нажмите для выбора
                </p>
                <p className="text-gray-400 text-sm mb-4">
                  Поддерживаются форматы: JPG, PNG, WebP, GIF (макс. 5MB)
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="bg-star-purple/15 border border-star-purple/25 hover:bg-star-purple/25 text-star-purple-light px-6 py-2 rounded-lg cursor-pointer transition-colors inline-flex items-center space-x-2"
                >
                  <PhotoIcon className="w-5 h-5" />
                  <span>Выбрать файлы</span>
                </label>
              </div>

              {/* Прогресс загрузки */}
              {Object.keys(uploadProgress).length > 0 && (
                <div className="mt-4">
                  <h4 className="text-white font-medium mb-2">Загрузка файлов:</h4>
                  {Object.entries(uploadProgress).map(([filename, progress]) => (
                    <div key={filename} className="mb-2">
                      <div className="flex justify-between text-sm text-gray-400 mb-1">
                        <span>{filename}</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div
                          className="bg-accent-cyan h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Поиск и фильтрация изображений */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Поиск изображений..."
                  value={imageSearchTerm}
                  onChange={(e) => setImageSearchTerm(e.target.value)}
                  className="w-full bg-white/10 border border-white/10 text-white placeholder-gray-500 px-4 py-3 pr-10 rounded-lg focus:ring-2 focus:ring-accent-cyan focus:border-transparent"
                />
                <MagnifyingGlassIcon className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
              </div>
              
              {/* Фильтр по папкам */}
              <div className="relative custom-dropdown">
                <div
                  onClick={() => toggleDropdown('imageFolder')}
                  className="w-full bg-white/10 border border-white/10 text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-accent-cyan cursor-pointer flex items-center justify-between hover:bg-white/15 transition-colors"
                >
                  <span>{imageFilterFolder || 'Все папки'}</span>
                  <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${dropdowns.imageFolder ? 'rotate-180' : ''}`} />
                </div>
                {dropdowns.imageFolder && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#0f0f1e]/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.4)] z-10 overflow-hidden max-h-60 overflow-y-auto">
                    <div
                      onClick={() => {
                        setImageFilterFolder('')
                        closeAllDropdowns()
                      }}
                      className="px-4 py-2 text-white hover:bg-white/10 cursor-pointer transition-colors"
                    >
                      Все папки
                    </div>
                    <div
                      onClick={() => {
                        setImageFilterFolder('/')
                        closeAllDropdowns()
                      }}
                      className="px-4 py-2 text-white hover:bg-white/10 cursor-pointer transition-colors"
                    >
                      / (корень)
                    </div>
                    <div
                      onClick={() => {
                        setImageFilterFolder('characters')
                        closeAllDropdowns()
                      }}
                      className="px-4 py-2 text-white hover:bg-white/10 cursor-pointer transition-colors"
                    >
                      characters (персонажи)
                    </div>
                    <div
                      onClick={() => {
                        setImageFilterFolder('weapons')
                        closeAllDropdowns()
                      }}
                      className="px-4 py-2 text-white hover:bg-white/10 cursor-pointer transition-colors"
                    >
                      weapons (оружие)
                    </div>
                    <div
                      onClick={() => {
                        setImageFilterFolder('artifacts')
                        closeAllDropdowns()
                      }}
                      className="px-4 py-2 text-white hover:bg-white/10 cursor-pointer transition-colors"
                    >
                      artifacts (артефакты)
                    </div>
                    <div
                      onClick={() => {
                        setImageFilterFolder('items')
                        closeAllDropdowns()
                      }}
                      className="px-4 py-2 text-white hover:bg-white/10 cursor-pointer transition-colors"
                    >
                      items (предметы)
                    </div>
                    <div
                      onClick={() => {
                        setImageFilterFolder('elements')
                        closeAllDropdowns()
                      }}
                      className="px-4 py-2 text-white hover:bg-white/10 cursor-pointer transition-colors"
                    >
                      elements (элементы)
                    </div>
                    <div
                      onClick={() => {
                        setImageFilterFolder('banners')
                        closeAllDropdowns()
                      }}
                      className="px-4 py-2 text-white hover:bg-white/10 cursor-pointer transition-colors"
                    >
                      banners (баннеры)
                    </div>
                    <div
                      onClick={() => {
                        setImageFilterFolder('events')
                        closeAllDropdowns()
                      }}
                      className="px-4 py-2 text-white hover:bg-white/10 cursor-pointer transition-colors"
                    >
                      events (события)
                    </div>
                    <div
                      onClick={() => {
                        setImageFilterFolder('skills')
                        closeAllDropdowns()
                      }}
                      className="px-4 py-2 text-white hover:bg-white/10 cursor-pointer transition-colors"
                    >
                      skills (навыки)
                    </div>
                    <div
                      onClick={() => {
                        setImageFilterFolder('monsters')
                        closeAllDropdowns()
                      }}
                      className="px-4 py-2 text-white hover:bg-white/10 cursor-pointer transition-colors"
                    >
                      monsters (монстры)
                    </div>
                    <div
                      onClick={() => {
                        setImageFilterFolder('tcg')
                        closeAllDropdowns()
                      }}
                      className="px-4 py-2 text-white hover:bg-white/10 cursor-pointer transition-colors"
                    >
                      tcg (карточная игра)
                    </div>
                    <div
                      onClick={() => {
                        setImageFilterFolder('home')
                        closeAllDropdowns()
                      }}
                      className="px-4 py-2 text-white hover:bg-white/10 cursor-pointer transition-colors"
                    >
                      home (дом)
                    </div>
                    <div
                      onClick={() => {
                        setImageFilterFolder('fishing')
                        closeAllDropdowns()
                      }}
                      className="px-4 py-2 text-white hover:bg-white/10 cursor-pointer transition-colors"
                    >
                      fishing (рыбалка)
                    </div>
                    <div
                      onClick={() => {
                        setImageFilterFolder('furnishing')
                        closeAllDropdowns()
                      }}
                      className="px-4 py-2 text-white hover:bg-white/10 cursor-pointer transition-colors"
                    >
                      furnishing (мебель)
                    </div>
                    <div
                      onClick={() => {
                        setImageFilterFolder('daily')
                        closeAllDropdowns()
                      }}
                      className="px-4 py-2 text-white hover:bg-white/10 cursor-pointer transition-colors"
                    >
                      daily (ежедневные)
                    </div>
                    <div
                      onClick={() => {
                        setImageFilterFolder('donation')
                        closeAllDropdowns()
                      }}
                      className="px-4 py-2 text-white hover:bg-white/10 cursor-pointer transition-colors"
                    >
                      donation (пожертвования)
                    </div>
                  </div>
                )}
              </div>
              
              {/* Кнопка сброса фильтров */}
              <div className="flex items-center">
                <button
                  onClick={() => {
                    setImageSearchTerm('')
                    setImageFilterFolder('')
                    setImagePage(1)
                    closeAllDropdowns()
                  }}
                  className="w-full px-4 py-3 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <XMarkIcon className="w-4 h-4" />
                  <span>Сбросить фильтры</span>
                </button>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-white/3 to-white/3 rounded-xl border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">Превью</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">Название</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">Папка</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">Размер</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">Изменен</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {imageItems && imageItems.length > 0 ? getPaginatedImages().map((image) => (
                      <tr key={image.id} className="hover:bg-white/5">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <img
                            src={`/images/static/${image.path}`}
                            alt={image.name}
                            className="w-12 h-12 object-cover rounded border cursor-pointer hover:scale-110 transition-transform"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/images/placeholder.svg'
                            }}
                            onClick={() => {
                              // Открываем изображение в новой вкладке для полного просмотра
                              window.open(`/images/static/${image.path}`, '_blank')
                            }}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">{image.name}</div>
                          <div className="text-sm text-gray-400">{image.path}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-400">{image.folder || '/'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white">{formatFileSize(image.size)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {formatDate(image.modified)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(`/images/static/${image.path}`)
                                alert('Путь скопирован в буфер обмена')
                              }}
                              className="text-gray-400 hover:text-white p-1 rounded"
                              title="Копировать путь"
                            >
                              <DocumentTextIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteImage(image.path)}
                              className="text-red-400 hover:text-red-300 p-1 rounded"
                              title="Удалить изображение"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center">
                          <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-400">
                            {getFilteredImages().length === 0 && imageItems.length > 0
                              ? 'Изображения не найдены по текущим фильтрам'
                              : 'Загружаем изображения...'
                            }
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Информация о результатах и пагинация */}
              <div className="px-6 py-4 border-t border-white/10 flex justify-between items-center">
                <div className="text-sm text-gray-400">
                  Показано {getPaginatedImages().length} из {getFilteredImages().length} изображений
                  {imageFilterFolder && ` в папке "${imageFilterFolder}"`}
                </div>
                
                {imageTotalPages > 1 && (
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setImagePage(prev => Math.max(1, prev - 1))}
                      disabled={imagePage === 1}
                      className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
                    >
                      <ChevronDownIcon className="w-4 h-4 rotate-90" />
                      <span>Предыдущая</span>
                    </button>
                    <span className="text-gray-400">
                      Страница {imagePage} из {imageTotalPages}
                    </span>
                    <button
                      onClick={() => setImagePage(prev => Math.min(imageTotalPages, prev + 1))}
                      disabled={imagePage === imageTotalPages}
                      className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
                    >
                      <span>Следующая</span>
                      <ChevronDownIcon className="w-4 h-4 -rotate-90" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Управление кешем */}
        {activeTab === 'cache' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Управление кешем</h2>
              <button
                onClick={() => {
                  loadCacheSettings()
                  loadRedisStats()
                  loadDetailedCacheInfo()
                  loadCacheMetrics()
                  loadSystemHealth()
                }}
                disabled={infoLoading}
                className="bg-star-blue/15 border border-star-blue/25 hover:bg-star-blue/25 text-star-blue-light disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <svg className={`w-4 h-4 ${infoLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{infoLoading ? 'Обновление...' : 'Обновить информацию'}</span>
              </button>
            </div>

            {/* Единый блок управления кешем */}
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
              {/* Заголовок с вкладками */}
              <div className="border-b border-white/10">
                <div className="flex space-x-1 p-6">
                  <button
                    onClick={() => setCacheSubTab('settings')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      cacheSubTab === 'settings'
                        ? 'bg-accent-cyan/15 text-accent-cyan border-accent-cyan/30'
                        : 'text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    Настройки
                  </button>
                  <button
                    onClick={() => setCacheSubTab('stats')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      cacheSubTab === 'stats'
                        ? 'bg-accent-cyan/15 text-accent-cyan border-accent-cyan/30'
                        : 'text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    Статистика
                  </button>
                  <button
                    onClick={() => setCacheSubTab('metrics')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      cacheSubTab === 'metrics'
                        ? 'bg-accent-cyan/15 text-accent-cyan border-accent-cyan/30'
                        : 'text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    Метрики
                  </button>
                  <button
                    onClick={() => setCacheSubTab('system')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      cacheSubTab === 'system'
                        ? 'bg-accent-cyan/15 text-accent-cyan border-accent-cyan/30'
                        : 'text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    Система
                  </button>
                </div>
              </div>

              {/* Содержимое вкладок */}
              <div className="p-6">
                {/* Настройки кеширования */}
                {cacheSubTab === 'settings' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Настройки кеширования</h3>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-white font-medium">Включить кеширование</label>
                            <p className="text-gray-400 text-sm">Автоматическое кеширование ответов API</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={cacheSettings.enabled}
                              onChange={(e) => setCacheSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent-cyan/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-cyan"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-white font-medium">Время жизни кеша (секунды)</label>
                            <p className="text-gray-400 text-sm">Как долго хранить данные в кеше</p>
                          </div>
                          <input
                            type="number"
                            value={cacheSettings.ttl}
                            onChange={(e) => setCacheSettings(prev => ({ ...prev, ttl: parseInt(e.target.value) }))}
                            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white w-24"
                            min="60"
                            max="86400"
                          />
                        </div>

                        <div className="flex space-x-3 pt-4">
                          <button
                            onClick={async () => {
                              setCacheLoading(true)
                              try {
                                const token = localStorage.getItem('token')
                                await axios.put('/api/admin/cache/settings', cacheSettings, {
                                  headers: { Authorization: `Bearer ${token}` }
                                })
                                setNotification({
                                  show: true,
                                  type: 'success',
                                  title: 'Успешно',
                                  message: 'Настройки кеша обновлены'
                                })
                              } catch (error) {
                                setNotification({
                                  show: true,
                                  type: 'error',
                                  title: 'Ошибка',
                                  message: 'Не удалось обновить настройки кеша'
                                })
                              } finally {
                                setCacheLoading(false)
                              }
                            }}
                            disabled={cacheLoading}
                            className="bg-accent-cyan/15 border border-accent-cyan/25 hover:bg-accent-cyan/25 disabled:opacity-50 text-accent-cyan px-4 py-2 rounded-xl font-medium transition-all"
                          >
                            {cacheLoading ? 'Сохранение...' : 'Сохранить настройки'}
                          </button>

                          <button
                            onClick={async () => {
                              if (!confirm('Вы уверены, что хотите очистить весь кеш?')) return

                              setCacheLoading(true)
                              try {
                                const token = localStorage.getItem('token')
                                await axios.post('/api/admin/cache/clear', {}, {
                                  headers: { Authorization: `Bearer ${token}` }
                                })
                                setNotification({
                                  show: true,
                                  type: 'success',
                                  title: 'Успешно',
                                  message: 'Весь кеш очищен'
                                })
                                // Обновляем всю информацию после очистки
                                loadCacheSettings()
                                loadRedisStats()
                                loadCacheMetrics()
                                loadRedisStats()
                                loadCacheMetrics()
                              } catch (error) {
                                setNotification({
                                  show: true,
                                  type: 'error',
                                  title: 'Ошибка',
                                  message: 'Не удалось очистить кеш'
                                })
                              } finally {
                                setCacheLoading(false)
                              }
                            }}
                            disabled={cacheLoading}
                            className="bg-red-500/15 border border-red-500/25 hover:bg-red-500/25 text-red-400 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                          >
                            Очистить весь кеш
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Краткая информация о статусе */}
                    <div className="border-t border-white/10 pt-6">
                      <h4 className="text-white font-medium mb-3">Текущий статус</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white/5 rounded-lg p-4">
                          <h5 className="text-white font-medium mb-2">Статус кеширования</h5>
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${cacheSettings.enabled ? 'bg-accent-cyan' : 'bg-red-400'}`}></div>
                            <span className="text-gray-300">{cacheSettings.enabled ? 'Включен' : 'Отключен'}</span>
                          </div>
                        </div>

                        <div className="bg-white/5 rounded-lg p-4">
                          <h5 className="text-white font-medium mb-2">TTL</h5>
                          <p className="text-gray-300">{Math.floor(cacheSettings.ttl / 60)} мин {cacheSettings.ttl % 60} сек</p>
                        </div>

                        <div className="bg-white/5 rounded-lg p-4">
                          <h5 className="text-white font-medium mb-2">Ключей в Redis</h5>
                          <p className="text-gray-300">{redisStats.keys?.toLocaleString() || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Как работает кеширование */}
                    <div className="border-t border-white/10 pt-6">
                      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                        <h4 className="text-gray-400 font-medium mb-2">Как работает кеширование</h4>
                        <ul className="text-gray-300 text-sm space-y-1">
                          <li>• Автоматически кешируются ответы API при первом запросе</li>
                          <li>• Кеш обновляется при загрузке новых данных</li>
                          <li>• Кеш инвалидируется по паттернам при изменениях</li>
                          <li>• Используется Redis для хранения кеша</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Статистика Redis */}
                {cacheSubTab === 'stats' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Статистика Redis</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <div className="bg-white/5 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-400 text-sm">Всего ключей</p>
                            <p className="text-2xl font-bold text-white">{redisStats.keys.toLocaleString()}</p>
                          </div>
                          <ChartBarIcon className="w-8 h-8 text-accent-cyan" />
                        </div>
                      </div>

                      <div className="bg-white/5 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-400 text-sm">Использование памяти</p>
                            <p className="text-2xl font-bold text-white">{redisStats.memory}</p>
                          </div>
                          <CogIcon className="w-8 h-8 text-accent-cyan" />
                        </div>
                      </div>

                      <div className="bg-white/5 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-400 text-sm">Подключения</p>
                            <p className="text-2xl font-bold text-white">{redisStats.connections}</p>
                          </div>
                          <UserGroupIcon className="w-8 h-8 text-accent-cyan" />
                        </div>
                      </div>

                      <div className="bg-white/5 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-400 text-sm">Время работы</p>
                            <p className="text-2xl font-bold text-white">{redisStats.uptime}</p>
                          </div>
                          <ShieldCheckIcon className="w-8 h-8 text-accent-cyan" />
                        </div>
                      </div>
                    </div>

                    {/* Производительность кеша */}
                    <div>
                      <h4 className="text-white font-medium mb-3">Производительность кеша</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-gray-400 text-sm">Хиты (попадания)</p>
                              <p className="text-2xl font-bold text-accent-cyan">{redisStats.hits.toLocaleString()}</p>
                            </div>
                            <div className="text-accent-cyan">
                              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-red-300 text-sm">Миссы (промахи)</p>
                              <p className="text-2xl font-bold text-red-400">{redisStats.misses.toLocaleString()}</p>
                            </div>
                            <div className="text-red-400">
                              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Топ ключей */}
                    <div>
                      <h4 className="text-white font-medium mb-3">Топ ключей по активности</h4>
                      <div className="space-y-2">
                        {redisStats.topKeys && redisStats.topKeys.length > 0 ? redisStats.topKeys.map((keyInfo, index) => (
                          <div key={index} className="bg-white/5 rounded-lg p-3 flex justify-between items-center">
                            <div className="flex-1">
                              <p className="text-white text-sm font-mono truncate">{keyInfo.key}</p>
                              <p className="text-gray-400 text-xs">Тип: {keyInfo.type} | TTL: {keyInfo.ttl} сек</p>
                            </div>
                            <div className="text-right">
                              <span className="text-accent-cyan text-sm">#{index + 1}</span>
                            </div>
                          </div>
                        )) : (
                          <div className="bg-white/5 rounded-lg p-4 text-center">
                            <p className="text-gray-400">Нет активных ключей</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Детальные метрики кеша */}
                {cacheSubTab === 'metrics' && cacheMetrics && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Детальные метрики кеша</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <div className="bg-white/5 rounded-lg p-4">
                        <p className="text-gray-400 text-sm">Всего попаданий</p>
                        <p className="text-2xl font-bold text-white">{cacheMetrics.totalHits.toLocaleString()}</p>
                      </div>

                      <div className="bg-white/5 rounded-lg p-4">
                        <p className="text-red-300 text-sm">Всего промахов</p>
                        <p className="text-2xl font-bold text-white">{cacheMetrics.totalMisses.toLocaleString()}</p>
                      </div>

                      <div className="bg-white/5 rounded-lg p-4">
                        <p className="text-gray-400 text-sm">Операций записи</p>
                        <p className="text-2xl font-bold text-white">{cacheMetrics.totalSets.toLocaleString()}</p>
                      </div>

                      <div className="bg-white/5 rounded-lg p-4">
                        <p className="text-gray-400 text-sm">Операций удаления</p>
                        <p className="text-2xl font-bold text-white">{cacheMetrics.totalDeletes.toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Эффективность кеша */}
                    <div className="bg-white/5 rounded-lg p-4 mb-4">
                      <h4 className="text-white font-medium mb-3">Эффективность кеша</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-gray-400 text-sm">Hit Ratio</p>
                          <p className="text-xl font-bold text-accent-cyan">
                            {cacheMetrics.totalHits + cacheMetrics.totalMisses > 0
                              ? ((cacheMetrics.totalHits / (cacheMetrics.totalHits + cacheMetrics.totalMisses)) * 100).toFixed(1)
                              : 0}%
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Всего ошибок</p>
                          <p className="text-xl font-bold text-red-400">{cacheMetrics.totalErrors}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Время работы</p>
                          <p className="text-xl font-bold text-accent-cyan">
                            {cacheMetrics.startTime ? formatUptime((Date.now() - new Date(cacheMetrics.startTime).getTime()) / 1000) : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Последние ошибки */}
                    {cacheMetrics.lastError && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                        <h4 className="text-red-300 font-medium mb-2">Последняя ошибка</h4>
                        <p className="text-red-200 text-sm font-mono">{cacheMetrics.lastError}</p>
                        <p className="text-red-300 text-xs mt-1">
                          {cacheMetrics.lastErrorTime ? formatTimestamp(cacheMetrics.lastErrorTime) : 'Время неизвестно'}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Система и здоровье */}
                {cacheSubTab === 'system' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Система и здоровье</h3>

                    {/* Системное здоровье */}
                    {systemHealth && (
                      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                        <h4 className="text-white font-medium mb-4">Системное здоровье</h4>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-white/5 rounded-lg p-4">
                            <h5 className="text-gray-400 font-medium mb-2">Время последней проверки</h5>
                            <p className="text-white text-sm">{formatTimestamp(systemHealth.timestamp)}</p>
                          </div>

                          <div className="bg-white/5 rounded-lg p-4">
                            <h5 className="text-gray-400 font-medium mb-2">Память</h5>
                            <div className="text-sm space-y-1">
                              <div className="flex justify-between text-gray-300">
                                <span>Использовано:</span>
                                <span>{systemHealth.memory?.used} MB</span>
                              </div>
                              <div className="flex justify-between text-gray-300">
                                <span>Свободно:</span>
                                <span>{systemHealth.memory?.free} MB</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-white/5 rounded-lg p-4">
                            <h5 className="text-gray-400 font-medium mb-2">Кеш</h5>
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${systemHealth.cache?.enabled ? 'bg-accent-cyan' : 'bg-red-400'}`}></div>
                                <span className="text-gray-300 text-sm">{systemHealth.cache?.enabled ? 'Включен' : 'Отключен'}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${systemHealth.cache?.connected ? 'bg-accent-cyan' : 'bg-red-400'}`}></div>
                                <span className="text-gray-300 text-sm">{systemHealth.cache?.connected ? 'Подключен' : 'Не подключен'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Информация о сервере и Redis */}
                    {detailedInfo && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Информация о сервере */}
                        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                          <h4 className="text-white font-medium mb-4">Сервер Node.js</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Версия Node.js:</span>
                              <span className="text-white font-mono">{detailedInfo.server?.nodeVersion}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Платформа:</span>
                              <span className="text-white">{detailedInfo.server?.platform} {detailedInfo.server?.arch}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">PID:</span>
                              <span className="text-white font-mono">{detailedInfo.server?.pid}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Среда:</span>
                              <span className="text-white">{detailedInfo.server?.environment}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Время работы:</span>
                              <span className="text-white">{detailedInfo.server ? formatUptime(detailedInfo.server.uptime) : 'N/A'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Информация о памяти */}
                        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                          <h4 className="text-white font-medium mb-4">Использование памяти</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Heap Used:</span>
                              <span className="text-white">{detailedInfo.server ? formatBytes(detailedInfo.server.memoryUsage.heapUsed) : 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Heap Total:</span>
                              <span className="text-white">{detailedInfo.server ? formatBytes(detailedInfo.server.memoryUsage.heapTotal) : 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">RSS:</span>
                              <span className="text-white">{detailedInfo.server ? formatBytes(detailedInfo.server.memoryUsage.rss) : 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">External:</span>
                              <span className="text-white">{detailedInfo.server ? formatBytes(detailedInfo.server.memoryUsage.external) : 'N/A'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Информация о Redis */}
                        {detailedInfo.cache?.redis && (
                          <div className="lg:col-span-2 bg-white/5 rounded-xl p-6 border border-white/10">
                            <h4 className="text-white font-medium mb-4">Redis Connection</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Redis Version:</span>
                                  <span className="text-white font-mono">{detailedInfo.cache.redis.version}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Host:</span>
                                  <span className="text-white font-mono">{detailedInfo.cache.connection?.host}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Port:</span>
                                  <span className="text-white font-mono">{detailedInfo.cache.connection?.port}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Подключение:</span>
                                  <span className={`${detailedInfo.cache.connection?.isConnected ? 'text-accent-cyan' : 'text-red-400'}`}>
                                    {detailedInfo.cache.connection?.isConnected ? '✓ Активно' : '✗ Не подключен'}
                                  </span>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Keys:</span>
                                  <span className="text-white">{detailedInfo.cache.redis.keyCount?.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Redis Uptime:</span>
                                  <span className="text-white">{formatUptime(detailedInfo.cache.redis.uptime || 0)}</span>
                                </div>
                                {detailedInfo.cache.redis.memory && Object.keys(detailedInfo.cache.redis.memory).length > 0 && (
                                  <div className="col-span-2 mt-2">
                                    <p className="text-gray-400 text-sm mb-1">Память Redis:</p>
                                    <div className="text-xs space-y-1">
                                      {Object.entries(detailedInfo.cache.redis.memory).slice(0, 3).map(([key, value]) => (
                                        <div key={key} className="flex justify-between">
                                          <span className="text-gray-500">{key}:</span>
                                          <span className="text-gray-300 font-mono">{String(value)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Управление пользователями */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Пользователи системы</h2>
            
            <div className="bg-gradient-to-r from-white/3 to-white/3 rounded-xl border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">Пользователь</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">Роль</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">Крутки</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">Статус</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">Регистрация</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-white/5">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-white">{user.username}</div>
                              <div className="text-sm text-gray-400">{user.uid}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-400">{user.email || 'Не указан'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'ADMIN' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.role || 'USER'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white">{user._count.gachaPulls.toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.isActive 
                              ? 'bg-accent-cyan/20 text-accent-cyan' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isActive ? 'Активен' : 'Неактивен'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => loadUserStats(user.id)}
                              className="text-gray-400 hover:text-white p-1 rounded"
                              title="Просмотр статистики"
                            >
                              <ChartBarIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUser(user)
                                setShowPasswordModal(true)
                              }}
                              className="text-gray-400 hover:text-white p-1 rounded"
                              title="Изменить пароль"
                            >
                              <CogIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => changeUserRole(user.id, user.role === 'ADMIN' ? 'USER' : 'ADMIN')}
                              className="text-gray-400 hover:text-white p-1 rounded"
                              title="Изменить роль"
                            >
                              <ShieldCheckIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => toggleUserStatus(user.id, user.isActive)}
                              className={`p-1 rounded ${
                                user.isActive 
                                  ? 'text-orange-400 hover:text-orange-300' 
                                  : 'text-gray-400 hover:text-white'
                              }`}
                              title={user.isActive ? 'Заблокировать' : 'Активировать'}
                            >
                              <UserGroupIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteUser(user.id, user.username)}
                              className="text-red-400 hover:text-red-300 p-1 rounded"
                              title="Удалить пользователя"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Переводы */}
        {activeTab === 'translations' && (
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">Управление переводами</h2>
                <button
                  onClick={() => setShowMappingForm(true)}
                  className="bg-star-purple/15 border border-star-purple/25 hover:bg-star-purple/25 text-star-purple-light px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <PlusIcon className="w-5 h-5" />
                  <span>Добавить перевод</span>
                </button>
              </div>

              {/* Поиск */}
              <div className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Поиск по названиям..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/10 border border-white/10 text-white placeholder-gray-500 px-4 py-3 pr-10 rounded-lg focus:ring-2 focus:ring-accent-cyan focus:border-transparent"
                  />
                  <MagnifyingGlassIcon className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
                </div>
              </div>

              {/* Таблица переводов */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">Превью</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">Игра</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">Английское название</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">Русское название</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">Тип</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">Редкость</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {mappings.map((mapping) => (
                      <tr key={mapping.id} className="hover:bg-white/5">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {mapping.imagePath ? (
                            <img
                              src={`/images/static/${mapping.imagePath}`}
                              alt={mapping.russianName}
                              className="w-12 h-12 object-cover rounded border"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/images/placeholder.svg'
                              }}
                            />
                          ) : (
                            <div className="w-12 h-12 bg-white/10 rounded border border-white/10 flex items-center justify-center">
                              <PhotoIcon className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-white">{mapping.game}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-400">{mapping.englishName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">{mapping.russianName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-400">{mapping.itemType}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-bold ${getRarityColor(mapping.rarity)}`}>
                            {getRarityStars(mapping.rarity)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openImageSelector('mapping', mapping)}
                              className="text-gray-400 hover:text-white p-1"
                              title="Привязать изображение"
                            >
                              <PhotoIcon className="w-4 h-4" />
                            </button>
                            {mapping.imagePath && (
                              <button
                                onClick={() => removeMappingImage(mapping.id)}
                                className="text-gray-400 hover:text-white p-1"
                                title="Отвязать изображение"
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => startEdit(mapping)}
                              className="text-gray-400 hover:text-white p-1"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteMapping(mapping.id)}
                              className="text-red-400 hover:text-red-300 p-1"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Пагинация */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-6 pt-6 border-t border-white/10">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Предыдущая
                  </button>
                  <span className="text-gray-400">
                    Страница {currentPage} из {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Следующая
                  </button>
                </div>
              )}
            </div>

            {/* Форма добавления/редактирования */}
            {showMappingForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-gray-900 border border-white/10 rounded-xl p-6 w-full max-w-md mx-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-white">
                      {editingMapping ? 'Редактировать перевод' : 'Добавить перевод'}
                    </h3>
                    <button
                      onClick={() => {
                        setShowMappingForm(false)
                        setEditingMapping(null)
                        closeAllDropdowns()
                      }}
                      className="text-gray-400 hover:text-white"
                    >
                      <XMarkIcon className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Игра</label>
                      <div className="relative custom-dropdown">
                        <div
                          onClick={() => toggleDropdown('game')}
                          className="w-full bg-white/10 border border-white/10 text-white px-3 py-2 rounded-lg focus:ring-2 focus:ring-accent-cyan cursor-pointer flex items-center justify-between hover:bg-white/15 transition-colors"
                        >
                          <span>{getOptionLabel('game', mappingForm.game)}</span>
                          <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${dropdowns.game ? 'rotate-180' : ''}`} />
                        </div>
                        {dropdowns.game && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-[#0f0f1e]/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.4)] z-10 overflow-hidden">
                            <div
                              onClick={() => selectOption('game', 'HSR')}
                              className="px-3 py-2 text-white hover:bg-white/10 cursor-pointer transition-colors"
                            >
                              Honkai Star Rail
                            </div>
                            <div
                              onClick={() => selectOption('game', 'GENSHIN')}
                              className="px-3 py-2 text-white hover:bg-white/10 cursor-pointer transition-colors"
                            >
                              Genshin Impact
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Английское название</label>
                      <input
                        type="text"
                        value={mappingForm.englishName}
                        onChange={(e) => setMappingForm({...mappingForm, englishName: e.target.value})}
                        className="w-full bg-white/10 border border-white/10 text-white px-3 py-2 rounded-lg focus:ring-2 focus:ring-accent-cyan"
                        placeholder="Введите английское название"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Русское название</label>
                      <input
                        type="text"
                        value={mappingForm.russianName}
                        onChange={(e) => setMappingForm({...mappingForm, russianName: e.target.value})}
                        className="w-full bg-white/10 border border-white/10 text-white px-3 py-2 rounded-lg focus:ring-2 focus:ring-accent-cyan"
                        placeholder="Введите русское название"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Тип предмета</label>
                      <div className="relative custom-dropdown">
                        <div
                          onClick={() => toggleDropdown('itemType')}
                          className="w-full bg-white/10 border border-white/10 text-white px-3 py-2 rounded-lg focus:ring-2 focus:ring-accent-cyan cursor-pointer flex items-center justify-between hover:bg-white/15 transition-colors"
                        >
                          <span>{getOptionLabel('itemType', mappingForm.itemType)}</span>
                          <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${dropdowns.itemType ? 'rotate-180' : ''}`} />
                        </div>
                        {dropdowns.itemType && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-[#0f0f1e]/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.4)] z-10 overflow-hidden">
                            <div
                              onClick={() => selectOption('itemType', 'CHARACTER')}
                              className="px-3 py-2 text-white hover:bg-white/10 cursor-pointer transition-colors"
                            >
                              Персонаж
                            </div>
                            <div
                              onClick={() => selectOption('itemType', 'LIGHT_CONE')}
                              className="px-3 py-2 text-white hover:bg-white/10 cursor-pointer transition-colors"
                            >
                              Световой конус
                            </div>
                            <div
                              onClick={() => selectOption('itemType', 'WEAPON')}
                              className="px-3 py-2 text-white hover:bg-white/10 cursor-pointer transition-colors"
                            >
                              Оружие
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Редкость</label>
                      <div className="relative custom-dropdown">
                        <div
                          onClick={() => toggleDropdown('rarity')}
                          className="w-full bg-white/10 border border-white/10 text-white px-3 py-2 rounded-lg focus:ring-2 focus:ring-accent-cyan cursor-pointer flex items-center justify-between hover:bg-white/15 transition-colors"
                        >
                          <span className={getRarityColor(mappingForm.rarity)}>{getOptionLabel('rarity', mappingForm.rarity)}</span>
                          <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${dropdowns.rarity ? 'rotate-180' : ''}`} />
                        </div>
                        {dropdowns.rarity && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-[#0f0f1e]/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.4)] z-10 overflow-hidden">
                            <div
                              onClick={() => selectOption('rarity', 3)}
                              className="px-3 py-2 text-accent-cyan hover:bg-white/10 cursor-pointer transition-colors font-bold"
                            >
                              3★
                            </div>
                            <div
                              onClick={() => selectOption('rarity', 4)}
                              className="px-3 py-2 text-accent-cyan hover:bg-white/10 cursor-pointer transition-colors font-bold"
                            >
                              4★
                            </div>
                            <div
                              onClick={() => selectOption('rarity', 5)}
                              className="px-3 py-2 text-accent-cyan hover:bg-white/10 cursor-pointer transition-colors font-bold"
                            >
                              5★
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={() => {
                        setShowMappingForm(false)
                        setEditingMapping(null)
                        closeAllDropdowns()
                      }}
                      className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={saveMapping}
                      className="bg-star-purple/15 border border-star-purple/25 hover:bg-star-purple/25 text-star-purple-light px-4 py-2 rounded-lg transition-colors"
                    >
                      {editingMapping ? 'Сохранить' : 'Добавить'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Модальное окно для изменения пароля */}
        {showPasswordModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-900 border border-white/10 rounded-xl p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Изменить пароль для {selectedUser.username}
                </h3>
                <button
                  onClick={() => {
                    setShowPasswordModal(false)
                    setSelectedUser(null)
                    setNewPassword('')
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Новый пароль</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-white/10 border border-white/10 text-white px-3 py-2 rounded-lg focus:ring-2 focus:ring-accent-cyan"
                    placeholder="Минимум 6 символов"
                    minLength={6}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowPasswordModal(false)
                    setSelectedUser(null)
                    setNewPassword('')
                  }}
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={() => changeUserPassword(selectedUser.id, newPassword)}
                  disabled={newPassword.length < 6}
                  className="bg-star-purple/15 border border-star-purple/25 hover:bg-star-purple/25 text-star-purple-light px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Изменить пароль
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Модальное окно статистики пользователя */}
        {showUserModal && userStats && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-900 border border-white/10 rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-white">
                  Статистика пользователя {userStats.user.username}
                </h3>
                <button
                  onClick={() => {
                    setShowUserModal(false)
                    setUserStats(null)
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Информация о пользователе */}
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-white mb-3">Информация</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">ID:</span>
                      <span className="text-white ml-2">{userStats.user.id}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">UID:</span>
                      <span className="text-white ml-2">{userStats.user.uid}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Email:</span>
                      <span className="text-white ml-2">{userStats.user.email || 'Не указан'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Роль:</span>
                      <span className="text-white ml-2">{userStats.user.role}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Статус:</span>
                      <span className="text-white ml-2">{userStats.user.isActive ? 'Активен' : 'Заблокирован'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Регистрация:</span>
                      <span className="text-white ml-2">{formatDate(userStats.user.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Статистика по редкости */}
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-white mb-3">Статистика круток по редкости</h4>
                  <div className="space-y-2">
                    {userStats.stats.pullStats.map((stat, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-gray-400">
                          {stat.game} - {stat.rankType}★
                        </span>
                        <span className="text-white font-medium">{stat._count} круток</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Статистика по типам предметов */}
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-white mb-3">Статистика по типам предметов</h4>
                  <div className="space-y-2">
                    {userStats.stats.bannerStats.map((stat, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-gray-400">
                          {stat.game} - {stat.itemType}
                        </span>
                        <span className="text-white font-medium">{stat._count} предметов</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => {
                    setShowUserModal(false)
                    setUserStats(null)
                  }}
                  className="bg-star-purple/15 border border-star-purple/25 hover:bg-star-purple/25 text-star-purple-light px-4 py-2 rounded-lg transition-colors"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Banner Management Section */}
        {activeTab === 'banners' && (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">Управление баннерами</h2>
              <button
                onClick={() => setShowBannerForm(true)}
                className="bg-star-purple/15 border border-star-purple/25 hover:bg-star-purple/25 text-star-purple-light px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Добавить баннер</span>
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-white/5">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Изображение
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Название
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Игра
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Тип
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Дата
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/3 divide-y divide-white/5">
                  {banners.map((banner) => (
                    <tr key={banner.id} className="hover:bg-white/5">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {banner.imagePath ? (
                          <img
                            src={`/images/static/${banner.imagePath}`}
                            alt={banner.bannerName}
                            className="w-16 h-10 object-cover rounded border"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/images/placeholder.svg'
                            }}
                          />
                        ) : (
                          <div className="w-16 h-10 bg-white/10 rounded border border-white/10 flex items-center justify-center">
                            <PhotoIcon className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">
                          {banner.bannerNameRu || banner.bannerName}
                        </div>
                        {banner.bannerNameRu && (
                          <div className="text-xs text-gray-400">{banner.bannerName}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-400">{banner.game}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-400">{banner.bannerType}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-400">
                          {new Date(banner.createdAt).toLocaleDateString('ru-RU')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openImageSelector('banner', banner)}
                            className="text-gray-400 hover:text-white p-1"
                            title="Привязать изображение"
                          >
                            <PhotoIcon className="w-4 h-4" />
                          </button>
                          {banner.imagePath && (
                            <button
                              onClick={() => removeBannerImage(banner.id)}
                              className="text-gray-400 hover:text-white p-1"
                              title="Отвязать изображение"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => startBannerEdit(banner)}
                            className="text-gray-400 hover:text-white p-1"
                            title="Редактировать"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteBanner(banner.id)}
                            className="text-red-400 hover:text-red-300 p-1"
                            title="Удалить"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Модальное окно для выбора изображений */}
        {showImageModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-900 border border-white/10 rounded-xl p-6 w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-white">
                  Выберите изображение для {selectedMapping ? 'предмета' : 'баннера'}
                  {selectedMapping && ` "${selectedMapping.russianName}"`}
                  {selectedBanner && ` "${selectedBanner.bannerName}"`}
                </h3>
                <button
                  onClick={() => {
                    if (!isBindingImage) {
                      setShowImageModal(false)
                      setSelectedMapping(null)
                      setSelectedBanner(null)
                    }
                  }}
                  disabled={isBindingImage}
                  className={`${
                    isBindingImage ? 'cursor-not-allowed opacity-50' : 'hover:text-white'
                  }`}
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              
              {/* Секция загрузки изображений */}
              <div className="mb-6">
                <button
                  onClick={() => setShowUploadSection(!showUploadSection)}
                  disabled={isBindingImage}
                  className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-colors ${
                    isBindingImage
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-star-purple/10 hover:bg-white/10 text-gray-400 hover:text-gray-300 border border-white/10'
                  }`}
                >
                  <CloudArrowUpIcon className="w-5 h-5" />
                  <span>{showUploadSection ? 'Скрыть загрузку' : 'Загрузить новые изображения'}</span>
                </button>
                
                {showUploadSection && (
                  <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
                    {/* Быстрая загрузка одного файла */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-400 mb-3">Быстрая загрузка:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Выбор папки */}
                        <div className="relative custom-dropdown">
                          <div
                            onClick={() => !isBindingImage && toggleDropdown('uploadFolder')}
                            className={`w-full bg-white/10 border border-white/10 text-white px-4 py-3 rounded-lg cursor-pointer flex items-center justify-between hover:bg-white/15 transition-colors ${
                              isBindingImage ? 'cursor-not-allowed opacity-50' : ''
                            }`}
                          >
                            <span>Папка: {uploadFolder}</span>
                            <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${dropdowns.uploadFolder ? 'rotate-180' : ''}`} />
                          </div>
                          {dropdowns.uploadFolder && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-[#0f0f1e]/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.4)] z-10 overflow-hidden max-h-60 overflow-y-auto">
                              {['characters', 'weapons', 'artifacts', 'items', 'elements', 'banners', 'events', 'skills', 'monsters', 'tcg'].map(folder => (
                                <div
                                  key={folder}
                                  onClick={() => {
                                    setUploadFolder(folder)
                                    toggleDropdown('uploadFolder')
                                  }}
                                  className="px-4 py-3 text-white hover:bg-white/10 cursor-pointer transition-colors"
                                >
                                  {folder}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {/* Выбор файла */}
                        <div>
                          <label className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg cursor-pointer transition-colors ${
                            isBindingImage
                              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                              : 'bg-white/10 hover:bg-white/15 text-white border border-white/10 border-dashed'
                          }`}>
                            <PhotoIcon className="w-5 h-5" />
                            <span>{selectedFile ? selectedFile.name : 'Выбрать изображение'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                              disabled={isBindingImage}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                      
                      {/* Кнопка быстрой загрузки */}
                      <button
                        onClick={() => selectedFile && uploadImageInModal(selectedFile, uploadFolder)}
                        disabled={isUploadingImage || !selectedFile || isBindingImage}
                        className={`w-full mt-3 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-colors ${
                          isUploadingImage || !selectedFile || isBindingImage
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-accent-cyan/15 border border-accent-cyan/25 hover:bg-accent-cyan/25 text-accent-cyan'
                        }`}
                      >
                        {isUploadingImage ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>Загрузка и привязка...</span>
                          </>
                        ) : (
                          <>
                            <CloudArrowUpIcon className="w-5 h-5" />
                            <span>Загрузить и привязать</span>
                          </>
                        )}
                      </button>
                    </div>
                    
                    <div className="border-t border-white/10 pt-4">
                      <h4 className="text-sm font-medium text-gray-400 mb-3">Массовая загрузка:</h4>
                      {/* Выбор папки для загрузки */}
                      <div className="relative custom-dropdown">
                        <div
                          onClick={() => !isBindingImage && toggleDropdown('uploadFolder')}
                          className={`w-full bg-white/10 border border-white/10 text-white px-4 py-3 rounded-lg cursor-pointer flex items-center justify-between hover:bg-white/15 transition-colors ${
                            isBindingImage ? 'cursor-not-allowed opacity-50' : ''
                          }`}
                        >
                          <span>Папка: {uploadFolder}</span>
                          <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${dropdowns.uploadFolder ? 'rotate-180' : ''}`} />
                        </div>
                        {dropdowns.uploadFolder && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-[#0f0f1e]/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.4)] z-10 overflow-hidden max-h-60 overflow-y-auto">
                            {['characters', 'weapons', 'artifacts', 'items', 'elements', 'banners', 'events', 'skills', 'monsters', 'tcg'].map(folder => (
                              <div
                                key={folder}
                                onClick={() => {
                                  setUploadFolder(folder)
                                  toggleDropdown('uploadFolder')
                                }}
                                className="px-4 py-3 text-white hover:bg-white/10 cursor-pointer transition-colors"
                              >
                                {folder}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Выбор файлов */}
                      <div>
                        <label className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg cursor-pointer transition-colors ${
                          isBindingImage
                            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                            : 'bg-white/10 hover:bg-white/15 text-white border border-white/10 border-dashed'
                        }`}>
                          <PhotoIcon className="w-5 h-5" />
                          <span>{selectedFiles.length > 0 ? `${selectedFiles.length} файлов выбрано` : 'Выбрать изображения'}</span>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
                            disabled={isBindingImage}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                    
                    {/* Список выбранных файлов */}
                    {selectedFiles.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-400 mb-2">Выбранные файлы:</h4>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {selectedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between bg-white/5 px-3 py-2 rounded text-sm">
                              <span className="text-white truncate">{file.name}</span>
                              <span className="text-gray-400 ml-2">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Кнопка загрузки */}
                    <button
                      onClick={uploadImages}
                      disabled={isUploadingImage || selectedFiles.length === 0 || isBindingImage}
                      className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-colors ${
                        isUploadingImage || selectedFiles.length === 0 || isBindingImage
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-accent-cyan/15 border border-accent-cyan/25 hover:bg-accent-cyan/25 text-accent-cyan'
                      }`}
                    >
                      {isUploadingImage ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Загрузка...</span>
                        </>
                      ) : (
                        <>
                          <CloudArrowUpIcon className="w-5 h-5" />
                          <span>Загрузить {selectedFiles.length > 0 ? `${selectedFiles.length} изображений` : ''}</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
              
              {/* Поиск и фильтр по папкам */}
              <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Поиск изображений..."
                    value={imageSearchTerm}
                    onChange={(e) => setImageSearchTerm(e.target.value)}
                    className="w-full bg-white/10 border border-white/10 text-white placeholder-gray-500 px-4 py-3 pr-10 rounded-lg focus:ring-2 focus:ring-accent-cyan focus:border-transparent"
                  />
                  <MagnifyingGlassIcon className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
                </div>
                
                {/* Кастомный dropdown для папок */}
                <div className="relative custom-dropdown">
                  <div
                    onClick={() => toggleDropdown('imageFolder')}
                    className="w-full bg-white/10 border border-white/10 text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-accent-cyan cursor-pointer flex items-center justify-between hover:bg-white/15 transition-colors"
                  >
                    <span>{selectedFolder === '' ? 'Все папки' : selectedFolder === 'characters' ? 'characters (персонажи)' : selectedFolder === 'weapons' ? 'weapons (оружие)' : selectedFolder === 'artifacts' ? 'artifacts (артефакты)' : selectedFolder === 'items' ? 'items (предметы)' : selectedFolder === 'elements' ? 'elements (элементы)' : selectedFolder === 'banners' ? 'banners (баннеры)' : selectedFolder === 'events' ? 'events (события)' : selectedFolder === 'skills' ? 'skills (навыки)' : selectedFolder === 'monsters' ? 'monsters (монстры)' : selectedFolder === 'tcg' ? 'tcg (карточная игра)' : selectedFolder}</span>
                    <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${dropdowns.imageFolder ? 'rotate-180' : ''}`} />
                  </div>
                  {dropdowns.imageFolder && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-[#0f0f1e]/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.4)] z-10 overflow-hidden max-h-60 overflow-y-auto">
                      <div
                        onClick={() => {
                          setSelectedFolder('')
                          toggleDropdown('imageFolder')
                        }}
                        className="px-4 py-3 text-white hover:bg-white/10 cursor-pointer transition-colors"
                      >
                        Все папки
                      </div>
                      <div
                        onClick={() => {
                          setSelectedFolder('characters')
                          toggleDropdown('imageFolder')
                        }}
                        className="px-4 py-3 text-white hover:bg-white/10 cursor-pointer transition-colors"
                      >
                        characters (персонажи)
                      </div>
                      <div
                        onClick={() => {
                          setSelectedFolder('weapons')
                          toggleDropdown('imageFolder')
                        }}
                        className="px-4 py-3 text-white hover:bg-white/10 cursor-pointer transition-colors"
                      >
                        weapons (оружие)
                      </div>
                      <div
                        onClick={() => {
                          setSelectedFolder('artifacts')
                          toggleDropdown('imageFolder')
                        }}
                        className="px-4 py-3 text-white hover:bg-white/10 cursor-pointer transition-colors"
                      >
                        artifacts (артефакты)
                      </div>
                      <div
                        onClick={() => {
                          setSelectedFolder('items')
                          toggleDropdown('imageFolder')
                        }}
                        className="px-4 py-3 text-white hover:bg-white/10 cursor-pointer transition-colors"
                      >
                        items (предметы)
                      </div>
                      <div
                        onClick={() => {
                          setSelectedFolder('elements')
                          toggleDropdown('imageFolder')
                        }}
                        className="px-4 py-3 text-white hover:bg-white/10 cursor-pointer transition-colors"
                      >
                        elements (элементы)
                      </div>
                      <div
                        onClick={() => {
                          setSelectedFolder('banners')
                          toggleDropdown('imageFolder')
                        }}
                        className="px-4 py-3 text-white hover:bg-white/10 cursor-pointer transition-colors"
                      >
                        banners (баннеры)
                      </div>
                      <div
                        onClick={() => {
                          setSelectedFolder('events')
                          toggleDropdown('imageFolder')
                        }}
                        className="px-4 py-3 text-white hover:bg-white/10 cursor-pointer transition-colors"
                      >
                        events (события)
                      </div>
                      <div
                        onClick={() => {
                          setSelectedFolder('skills')
                          toggleDropdown('imageFolder')
                        }}
                        className="px-4 py-3 text-white hover:bg-white/10 cursor-pointer transition-colors"
                      >
                        skills (навыки)
                      </div>
                      <div
                        onClick={() => {
                          setSelectedFolder('monsters')
                          toggleDropdown('imageFolder')
                        }}
                        className="px-4 py-3 text-white hover:bg-white/10 cursor-pointer transition-colors"
                      >
                        monsters (монстры)
                      </div>
                      <div
                        onClick={() => {
                          setSelectedFolder('tcg')
                          toggleDropdown('imageFolder')
                        }}
                        className="px-4 py-3 text-white hover:bg-white/10 cursor-pointer transition-colors"
                      >
                        tcg (карточная игра)
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Список изображений в виде сетки */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 max-h-96 overflow-y-auto">
                {isBindingImage ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-cyan mb-4"></div>
                    <p className="text-gray-400 text-sm">Привязываем изображение...</p>
                  </div>
                ) : imageItems && imageItems.length > 0 ? imageItems
                  .filter(img => {
                    if (!img || !img.name) return false
                    const matchesSearch = img.name.toLowerCase().includes(imageSearchTerm.toLowerCase())
                    const matchesFolder = !selectedFolder || selectedFolder === '' || (img.folder && img.folder.includes(selectedFolder))
                    return matchesSearch && matchesFolder
                  })
                  .map((image) => (
                  <div
                    key={image.id}
                    onClick={() => {
                      if (!isBindingImage) {
                        if (selectedMapping) {
                          updateMappingImage(selectedMapping.id, image.path)
                        } else if (selectedBanner) {
                          updateBannerImage(selectedBanner.id, image.path)
                        }
                      }
                    }}
                    className={`bg-white/5 border border-white/10 rounded-lg p-2 transition-all group ${
                      isBindingImage 
                        ? 'cursor-not-allowed opacity-50' 
                        : 'hover:bg-white/10 cursor-pointer hover:scale-105'
                    }`}
                  >
                    <div className="aspect-square mb-2 overflow-hidden rounded border border-white/10 bg-white/5 flex items-center justify-center">
                      <img
                        src={`/images/static/${image.path}`}
                        alt={image.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.log('Image load error for:', image.path)
                          ;(e.target as HTMLImageElement).src = '/images/placeholder.svg'
                        }}
                        onLoad={() => console.log('Image loaded:', image.path)}
                      />
                    </div>
                    <div className="text-xs text-white font-medium truncate mb-1" title={image.name}>
                      {image.name}
                    </div>
                    <div className="text-xs text-gray-400 truncate" title={image.folder}>
                      {image.folder || '/'}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {formatFileSize(image.size)}
                    </div>
                  </div>
                )) : (
                  <div className="col-span-full text-center py-8">
                    <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">Загружаем изображения...</p>
                  </div>
                )}
              </div>
              
              {imageItems && imageItems.length > 0 && imageItems.filter(img => {
                if (!img || !img.name) return false
                const matchesSearch = img.name.toLowerCase().includes(imageSearchTerm.toLowerCase())
                const matchesFolder = !selectedFolder || selectedFolder === '' || (img.folder && img.folder.includes(selectedFolder))
                return matchesSearch && matchesFolder
              }).length === 0 && (
                <div className="text-center py-8">
                  <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">Изображения не найдены</p>
                  <p className="text-gray-500 text-sm">Попробуйте изменить критерии поиска или выберите другую папку</p>
                </div>
              )}
              
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/10">
                <div className="text-sm text-gray-400">
                  Найдено: {imageItems && imageItems.length > 0 ? imageItems.filter(img => {
                    if (!img || !img.name) return false
                    const matchesSearch = img.name.toLowerCase().includes(imageSearchTerm.toLowerCase())
                    const matchesFolder = !selectedFolder || selectedFolder === '' || (img.folder && img.folder.includes(selectedFolder))
                    return matchesSearch && matchesFolder
                  }).length : 0} изображений
                </div>
                <button
                  onClick={() => {
                    setShowImageModal(false)
                    setSelectedMapping(null)
                    setSelectedBanner(null)
                    setImageSearchTerm('')
                    setSelectedFolder('')
                  }}
                  disabled={isBindingImage}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isBindingImage
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-star-purple/15 border border-star-purple/25 hover:bg-star-purple/25 text-star-purple-light'
                  }`}
                >
                  {isBindingImage ? 'Привязка...' : 'Закрыть'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Banner Form Modal */}
        {showBannerForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#0f0f1e]/95 backdrop-blur-xl p-6 rounded-xl max-w-md w-full mx-4 border border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.5)]">
              <h3 className="text-lg font-semibold text-white mb-4">
                {editingBanner ? 'Редактировать баннер' : 'Добавить баннер'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    ID баннера
                  </label>
                  <input
                    type="text"
                    className="input-glass"
                    value={bannerForm.bannerId}
                    onChange={(e) => setBannerForm({...bannerForm, bannerId: e.target.value})}
                    placeholder="Введите ID баннера"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Название (EN)
                  </label>
                  <input
                    type="text"
                    className="input-glass"
                    value={bannerForm.bannerName}
                    onChange={(e) => setBannerForm({...bannerForm, bannerName: e.target.value})}
                    placeholder="Введите название на английском"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Название (RU)
                  </label>
                  <input
                    type="text"
                    className="input-glass"
                    value={bannerForm.bannerNameRu}
                    onChange={(e) => setBannerForm({...bannerForm, bannerNameRu: e.target.value})}
                    placeholder="Введите название на русском"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Тип баннера
                  </label>
                  <select
                    className="input-glass"
                    value={bannerForm.bannerType}
                    onChange={(e) => setBannerForm({...bannerForm, bannerType: e.target.value})}
                  >
                    <option value="CHARACTER_EVENT">Событийный персонаж</option>
                    <option value="WEAPON_EVENT">Событийное оружие</option>
                    <option value="STANDARD">Стандартный</option>
                    <option value="NOVICE">Новичок</option>
                    <option value="CHRONICLED">Хроникальный</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Игра
                  </label>
                  <select
                    className="input-glass"
                    value={bannerForm.game}
                    onChange={(e) => setBannerForm({...bannerForm, game: e.target.value})}
                  >
                    <option value="HSR">Honkai: Star Rail</option>
                    <option value="GENSHIN">Genshin Impact</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Путь к изображению
                  </label>
                  <input
                    type="text"
                    className="input-glass"
                    value={bannerForm.imagePath}
                    onChange={(e) => setBannerForm({...bannerForm, imagePath: e.target.value})}
                    placeholder="Оставьте пустым или введите путь"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Дата начала
                  </label>
                  <input
                    type="date"
                    className="input-glass"
                    value={bannerForm.startTime}
                    onChange={(e) => setBannerForm({...bannerForm, startTime: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Дата окончания
                  </label>
                  <input
                    type="date"
                    className="input-glass"
                    value={bannerForm.endTime}
                    onChange={(e) => setBannerForm({...bannerForm, endTime: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowBannerForm(false)
                    setEditingBanner(null)
                    setBannerForm({
                      bannerId: '',
                      bannerName: '',
                      bannerNameRu: '',
                      bannerType: 'CHARACTER_EVENT',
                      game: 'HSR',
                      imagePath: '',
                      startTime: '',
                      endTime: ''
                    })
                  }}
                  className="px-4 py-2 bg-white/10 border border-white/10 text-white rounded-xl hover:bg-white/15 transition-all"
                >
                  Отмена
                </button>
                <button
                  onClick={saveBanner}
                  className="px-4 py-2 bg-accent-cyan/15 border border-accent-cyan/25 text-accent-cyan rounded-xl hover:bg-accent-cyan/25 transition-all"
                >
                  {editingBanner ? 'Сохранить' : 'Добавить'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Модалка уведомлений */}
        {notification.show && (
          <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-right-2 duration-300">
            <div className={`max-w-sm p-4 rounded-lg shadow-lg border ${
              notification.type === 'success' 
                ? 'bg-accent-cyan/10 border-accent-cyan/30 text-accent-cyan' 
                : notification.type === 'error'
                ? 'bg-red-900/95 border-red-500/30 text-red-100'
                : 'bg-blue-500/10 border-blue-500/30 text-blue-200'
            }`}>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {notification.type === 'success' && (
                    <svg className="w-6 h-6 text-accent-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {notification.type === 'error' && (
                    <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  )}
                  {notification.type === 'info' && (
                    <svg className="w-6 h-6 text-accent-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{notification.title}</h4>
                  <p className="text-sm opacity-90 mt-1">{notification.message}</p>
                </div>
                <button
                  onClick={() => setNotification(prev => ({ ...prev, show: false }))}
                  className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

    </div>
  )
}

export default AdminPanel
