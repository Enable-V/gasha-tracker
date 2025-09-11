import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
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

const AdminPanel: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [activeTab, setActiveTab] = useState<'overview' | 'images' | 'users' | 'translations' | 'banners'>('overview')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [images, setImages] = useState<ImageFile[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [mappings, setMappings] = useState<Mapping[]>([])
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [uploadModal] = useState(false)
  
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
    name: '',
    game: 'HSR',
    type: 'CHARACTER',
    startDate: '',
    endDate: ''
  })
  
  // Состояние для выпадающих списков
  const [dropdowns, setDropdowns] = useState({
    game: false,
    itemType: false,
    rarity: false,
    imageFolder: false,
    uploadFolder: false
  })

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

  const deleteMapping = async (id: number) => {
    if (!confirm('Удалить этот перевод?')) return
    
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`/api/admin/mappings/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
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
    try {
      const token = localStorage.getItem('token')
      const response = await axios.put(`/api/admin/mappings/${mappingId}/image`, 
        { imagePath },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      if (response.data.success) {
        loadMappings(currentPage, searchTerm)
        setShowImageModal(false)
        setSelectedMapping(null)
        alert('Изображение успешно привязано к предмету')
      }
    } catch (error: any) {
      console.error('Error updating mapping image:', error)
      alert(`Ошибка: ${error.response?.data?.error || 'Не удалось обновить изображение'}`)
    }
  }

  const updateBannerImage = async (bannerId: number, imagePath: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.put(`/api/admin/banners/${bannerId}/image`, 
        { imagePath },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      if (response.data.success) {
        loadBanners(bannerPage, imageSearchTerm)
        setShowImageModal(false)
        setSelectedBanner(null)
        alert('Изображение успешно привязано к баннеру')
      }
    } catch (error: any) {
      console.error('Error updating banner image:', error)
      alert(`Ошибка: ${error.response?.data?.error || 'Не удалось обновить изображение'}`)
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
      name: banner.bannerName,
      game: banner.game,
      type: banner.bannerType,
      startDate: banner.startTime ? new Date(banner.startTime).toISOString().split('T')[0] : '',
      endDate: banner.endTime ? new Date(banner.endTime).toISOString().split('T')[0] : ''
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
            selectedImages.includes(file.path) ? 'bg-purple-600/20' : ''
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
            <PhotoIcon className="w-5 h-5 text-green-400 mr-2" />
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
              <button className="text-blue-400 hover:text-blue-300">
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Заголовок */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <ShieldCheckIcon className="w-8 h-8 text-purple-400" />
            <h1 className="text-3xl font-bold text-white">Админская панель</h1>
          </div>
          <p className="text-purple-300">Управление системой и контентом</p>
        </div>

        {/* Навигация */}
        <div className="flex space-x-2 mb-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 text-purple-300 hover:bg-white/20'
            }`}
          >
            <ChartBarIcon className="w-5 h-5" />
            <span>Обзор</span>
          </button>
          <button
            onClick={() => setActiveTab('images')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'images'
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 text-purple-300 hover:bg-white/20'
            }`}
          >
            <PhotoIcon className="w-5 h-5" />
            <span>Изображения</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'users'
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 text-purple-300 hover:bg-white/20'
            }`}
          >
            <UserGroupIcon className="w-5 h-5" />
            <span>Пользователи</span>
          </button>
          <button
            onClick={() => setActiveTab('translations')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'translations'
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 text-purple-300 hover:bg-white/20'
            }`}
          >
            <DocumentTextIcon className="w-5 h-5" />
            <span>Переводы</span>
          </button>
          <button
            onClick={() => setActiveTab('banners')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'banners'
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 text-purple-300 hover:bg-white/20'
            }`}
          >
            <PhotoIcon className="w-5 h-5" />
            <span>Баннеры</span>
          </button>
        </div>

        {/* Обзор */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-r from-blue-600/20 to-blue-700/20 rounded-xl p-6 border border-blue-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-300 text-sm">Пользователи</p>
                    <p className="text-3xl font-bold text-white">{stats.users}</p>
                  </div>
                  <UserGroupIcon className="w-8 h-8 text-blue-400" />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-600/20 to-green-700/20 rounded-xl p-6 border border-green-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-300 text-sm">Баннеры</p>
                    <p className="text-3xl font-bold text-white">{stats.banners}</p>
                  </div>
                  <CogIcon className="w-8 h-8 text-green-400" />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-600/20 to-purple-700/20 rounded-xl p-6 border border-purple-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-300 text-sm">Всего круток</p>
                    <p className="text-3xl font-bold text-white">{stats.pulls.toLocaleString()}</p>
                  </div>
                  <ChartBarIcon className="w-8 h-8 text-purple-400" />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-yellow-600/20 to-yellow-700/20 rounded-xl p-6 border border-yellow-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-300 text-sm">Переводы</p>
                    <p className="text-3xl font-bold text-white">{stats.mappings}</p>
                  </div>
                  <PhotoIcon className="w-8 h-8 text-yellow-400" />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-xl p-6 border border-purple-500/20">
                <h3 className="text-xl font-bold text-white mb-4">Статистика по играм</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-purple-300">Honkai Star Rail</span>
                    <span className="text-white font-bold">{stats.games.HSR.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-purple-300">Genshin Impact</span>
                    <span className="text-white font-bold">{stats.games.GENSHIN.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-xl p-6 border border-purple-500/20">
                <h3 className="text-xl font-bold text-white mb-4">Быстрые действия</h3>
                <div className="space-y-3">
                  <button 
                    onClick={() => setActiveTab('images')}
                    className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <PhotoIcon className="w-4 h-4" />
                    <span>Управление изображениями</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('users')}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
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
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                >
                  <DocumentTextIcon className="w-4 h-4" />
                  <span>Привязать к предметам</span>
                </button>
                <button 
                  onClick={loadImageItems}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                >
                  <PhotoIcon className="w-4 h-4" />
                  <span>Обновить список</span>
                </button>
              </div>
            </div>

            {/* Drag & Drop зона для загрузки */}
            <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-xl border border-purple-500/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Загрузка изображений</h3>
              
              {/* Выбор папки */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-purple-300 mb-2">Папка для загрузки</label>
                <div className="relative custom-dropdown">
                  <div
                    onClick={() => toggleDropdown('uploadFolder')}
                    className="w-full bg-white/10 border border-purple-500/30 text-white px-3 py-2 rounded-lg focus:ring-2 focus:ring-purple-500 cursor-pointer flex items-center justify-between hover:bg-white/15 transition-colors"
                  >
                    <span>{selectedFolder === '/' ? 'Корень' : selectedFolder === 'characters' ? 'characters (персонажи)' : selectedFolder === 'weapons' ? 'weapons (оружие)' : selectedFolder === 'artifacts' ? 'artifacts (артефакты)' : selectedFolder === 'items' ? 'items (предметы)' : selectedFolder === 'elements' ? 'elements (элементы)' : selectedFolder === 'banners' ? 'banners (баннеры)' : selectedFolder === 'events' ? 'events (события)' : selectedFolder === 'skills' ? 'skills (навыки)' : selectedFolder === 'monsters' ? 'monsters (монстры)' : selectedFolder === 'tcg' ? 'tcg (карточная игра)' : selectedFolder === 'home' ? 'home (дом)' : selectedFolder === 'fishing' ? 'fishing (рыбалка)' : selectedFolder === 'furnishing' ? 'furnishing (мебель)' : selectedFolder === 'daily' ? 'daily (ежедневные)' : selectedFolder === 'donation' ? 'donation (пожертвования)' : selectedFolder}</span>
                    <ChevronDownIcon className={`w-5 h-5 text-purple-300 transition-transform ${dropdowns.uploadFolder ? 'rotate-180' : ''}`} />
                  </div>
                  {dropdowns.uploadFolder && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-purple-500/30 rounded-lg shadow-xl z-10 overflow-hidden max-h-60 overflow-y-auto">
                      <div
                        onClick={() => {
                          setSelectedFolder('/')
                          toggleDropdown('uploadFolder')
                        }}
                        className="px-3 py-2 text-white hover:bg-purple-600/30 cursor-pointer transition-colors"
                      >
                        Корень
                      </div>
                      <div
                        onClick={() => {
                          setSelectedFolder('characters')
                          toggleDropdown('uploadFolder')
                        }}
                        className="px-3 py-2 text-white hover:bg-purple-600/30 cursor-pointer transition-colors"
                      >
                        characters (персонажи)
                      </div>
                      <div
                        onClick={() => {
                          setSelectedFolder('weapons')
                          toggleDropdown('uploadFolder')
                        }}
                        className="px-3 py-2 text-white hover:bg-purple-600/30 cursor-pointer transition-colors"
                      >
                        weapons (оружие)
                      </div>
                      <div
                        onClick={() => {
                          setSelectedFolder('artifacts')
                          toggleDropdown('uploadFolder')
                        }}
                        className="px-3 py-2 text-white hover:bg-purple-600/30 cursor-pointer transition-colors"
                      >
                        artifacts (артефакты)
                      </div>
                      <div
                        onClick={() => {
                          setSelectedFolder('items')
                          toggleDropdown('uploadFolder')
                        }}
                        className="px-3 py-2 text-white hover:bg-purple-600/30 cursor-pointer transition-colors"
                      >
                        items (предметы)
                      </div>
                      <div
                        onClick={() => {
                          setSelectedFolder('elements')
                          toggleDropdown('uploadFolder')
                        }}
                        className="px-3 py-2 text-white hover:bg-purple-600/30 cursor-pointer transition-colors"
                      >
                        elements (элементы)
                      </div>
                      <div
                        onClick={() => {
                          setSelectedFolder('banners')
                          toggleDropdown('uploadFolder')
                        }}
                        className="px-3 py-2 text-white hover:bg-purple-600/30 cursor-pointer transition-colors"
                      >
                        banners (баннеры)
                      </div>
                      <div
                        onClick={() => {
                          setSelectedFolder('events')
                          toggleDropdown('uploadFolder')
                        }}
                        className="px-3 py-2 text-white hover:bg-purple-600/30 cursor-pointer transition-colors"
                      >
                        events (события)
                      </div>
                      <div
                        onClick={() => {
                          setSelectedFolder('skills')
                          toggleDropdown('uploadFolder')
                        }}
                        className="px-3 py-2 text-white hover:bg-purple-600/30 cursor-pointer transition-colors"
                      >
                        skills (навыки)
                      </div>
                      <div
                        onClick={() => {
                          setSelectedFolder('monsters')
                          toggleDropdown('uploadFolder')
                        }}
                        className="px-3 py-2 text-white hover:bg-purple-600/30 cursor-pointer transition-colors"
                      >
                        monsters (монстры)
                      </div>
                      <div
                        onClick={() => {
                          setSelectedFolder('tcg')
                          toggleDropdown('uploadFolder')
                        }}
                        className="px-3 py-2 text-white hover:bg-purple-600/30 cursor-pointer transition-colors"
                      >
                        tcg (карточная игра)
                      </div>
                      <div
                        onClick={() => {
                          setSelectedFolder('home')
                          toggleDropdown('uploadFolder')
                        }}
                        className="px-3 py-2 text-white hover:bg-purple-600/30 cursor-pointer transition-colors"
                      >
                        home (дом)
                      </div>
                      <div
                        onClick={() => {
                          setSelectedFolder('fishing')
                          toggleDropdown('uploadFolder')
                        }}
                        className="px-3 py-2 text-white hover:bg-purple-600/30 cursor-pointer transition-colors"
                      >
                        fishing (рыбалка)
                      </div>
                      <div
                        onClick={() => {
                          setSelectedFolder('furnishing')
                          toggleDropdown('uploadFolder')
                        }}
                        className="px-3 py-2 text-white hover:bg-purple-600/30 cursor-pointer transition-colors"
                      >
                        furnishing (мебель)
                      </div>
                      <div
                        onClick={() => {
                          setSelectedFolder('daily')
                          toggleDropdown('uploadFolder')
                        }}
                        className="px-3 py-2 text-white hover:bg-purple-600/30 cursor-pointer transition-colors"
                      >
                        daily (ежедневные)
                      </div>
                      <div
                        onClick={() => {
                          setSelectedFolder('donation')
                          toggleDropdown('uploadFolder')
                        }}
                        className="px-3 py-2 text-white hover:bg-purple-600/30 cursor-pointer transition-colors"
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
                    ? 'border-purple-400 bg-purple-500/10' 
                    : 'border-purple-500/30 hover:border-purple-500/50'
                }`}
              >
                <CloudArrowUpIcon className={`w-12 h-12 mx-auto mb-4 ${
                  dragActive ? 'text-purple-400' : 'text-purple-300'
                }`} />
                <p className="text-white font-medium mb-2">
                  Перетащите изображения сюда или нажмите для выбора
                </p>
                <p className="text-purple-300 text-sm mb-4">
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
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg cursor-pointer transition-colors inline-flex items-center space-x-2"
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
                      <div className="flex justify-between text-sm text-purple-300 mb-1">
                        <span>{filename}</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full transition-all"
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
                  className="w-full bg-white/10 border border-purple-500/30 text-white placeholder-purple-300 px-4 py-3 pr-10 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <MagnifyingGlassIcon className="absolute right-3 top-3.5 w-5 h-5 text-purple-300" />
              </div>
              
              {/* Фильтр по папкам */}
              <div className="relative custom-dropdown">
                <div
                  onClick={() => toggleDropdown('imageFolder')}
                  className="w-full bg-white/10 border border-purple-500/30 text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-purple-500 cursor-pointer flex items-center justify-between hover:bg-white/15 transition-colors"
                >
                  <span>{imageFilterFolder || 'Все папки'}</span>
                  <ChevronDownIcon className={`w-5 h-5 text-purple-300 transition-transform ${dropdowns.imageFolder ? 'rotate-180' : ''}`} />
                </div>
                {dropdowns.imageFolder && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-purple-500/30 rounded-lg shadow-xl z-10 overflow-hidden max-h-60 overflow-y-auto">
                    <div
                      onClick={() => {
                        setImageFilterFolder('')
                        closeAllDropdowns()
                      }}
                      className="px-4 py-2 text-white hover:bg-purple-600/30 cursor-pointer transition-colors"
                    >
                      Все папки
                    </div>
                    <div
                      onClick={() => {
                        setImageFilterFolder('/')
                        closeAllDropdowns()
                      }}
                      className="px-4 py-2 text-white hover:bg-purple-600/30 cursor-pointer transition-colors"
                    >
                      / (корень)
                    </div>
                    <div
                      onClick={() => {
                        setImageFilterFolder('characters')
                        closeAllDropdowns()
                      }}
                      className="px-4 py-2 text-white hover:bg-purple-600/30 cursor-pointer transition-colors"
                    >
                      characters (персонажи)
                    </div>
                    <div
                      onClick={() => {
                        setImageFilterFolder('weapons')
                        closeAllDropdowns()
                      }}
                      className="px-4 py-2 text-white hover:bg-purple-600/30 cursor-pointer transition-colors"
                    >
                      weapons (оружие)
                    </div>
                    <div
                      onClick={() => {
                        setImageFilterFolder('artifacts')
                        closeAllDropdowns()
                      }}
                      className="px-4 py-2 text-white hover:bg-purple-600/30 cursor-pointer transition-colors"
                    >
                      artifacts (артефакты)
                    </div>
                    <div
                      onClick={() => {
                        setImageFilterFolder('items')
                        closeAllDropdowns()
                      }}
                      className="px-4 py-2 text-white hover:bg-purple-600/30 cursor-pointer transition-colors"
                    >
                      items (предметы)
                    </div>
                    <div
                      onClick={() => {
                        setImageFilterFolder('elements')
                        closeAllDropdowns()
                      }}
                      className="px-4 py-2 text-white hover:bg-purple-600/30 cursor-pointer transition-colors"
                    >
                      elements (элементы)
                    </div>
                    <div
                      onClick={() => {
                        setImageFilterFolder('banners')
                        closeAllDropdowns()
                      }}
                      className="px-4 py-2 text-white hover:bg-purple-600/30 cursor-pointer transition-colors"
                    >
                      banners (баннеры)
                    </div>
                    <div
                      onClick={() => {
                        setImageFilterFolder('events')
                        closeAllDropdowns()
                      }}
                      className="px-4 py-2 text-white hover:bg-purple-600/30 cursor-pointer transition-colors"
                    >
                      events (события)
                    </div>
                    <div
                      onClick={() => {
                        setImageFilterFolder('skills')
                        closeAllDropdowns()
                      }}
                      className="px-4 py-2 text-white hover:bg-purple-600/30 cursor-pointer transition-colors"
                    >
                      skills (навыки)
                    </div>
                    <div
                      onClick={() => {
                        setImageFilterFolder('monsters')
                        closeAllDropdowns()
                      }}
                      className="px-4 py-2 text-white hover:bg-purple-600/30 cursor-pointer transition-colors"
                    >
                      monsters (монстры)
                    </div>
                    <div
                      onClick={() => {
                        setImageFilterFolder('tcg')
                        closeAllDropdowns()
                      }}
                      className="px-4 py-2 text-white hover:bg-purple-600/30 cursor-pointer transition-colors"
                    >
                      tcg (карточная игра)
                    </div>
                    <div
                      onClick={() => {
                        setImageFilterFolder('home')
                        closeAllDropdowns()
                      }}
                      className="px-4 py-2 text-white hover:bg-purple-600/30 cursor-pointer transition-colors"
                    >
                      home (дом)
                    </div>
                    <div
                      onClick={() => {
                        setImageFilterFolder('fishing')
                        closeAllDropdowns()
                      }}
                      className="px-4 py-2 text-white hover:bg-purple-600/30 cursor-pointer transition-colors"
                    >
                      fishing (рыбалка)
                    </div>
                    <div
                      onClick={() => {
                        setImageFilterFolder('furnishing')
                        closeAllDropdowns()
                      }}
                      className="px-4 py-2 text-white hover:bg-purple-600/30 cursor-pointer transition-colors"
                    >
                      furnishing (мебель)
                    </div>
                    <div
                      onClick={() => {
                        setImageFilterFolder('daily')
                        closeAllDropdowns()
                      }}
                      className="px-4 py-2 text-white hover:bg-purple-600/30 cursor-pointer transition-colors"
                    >
                      daily (ежедневные)
                    </div>
                    <div
                      onClick={() => {
                        setImageFilterFolder('donation')
                        closeAllDropdowns()
                      }}
                      className="px-4 py-2 text-white hover:bg-purple-600/30 cursor-pointer transition-colors"
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
            
            <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-xl border border-purple-500/20 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-purple-800/30">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-purple-300 uppercase tracking-wider">Превью</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-purple-300 uppercase tracking-wider">Название</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-purple-300 uppercase tracking-wider">Папка</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-purple-300 uppercase tracking-wider">Размер</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-purple-300 uppercase tracking-wider">Изменен</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-purple-300 uppercase tracking-wider">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-500/10">
                    {imageItems && imageItems.length > 0 ? getPaginatedImages().map((image) => (
                      <tr key={image.id} className="hover:bg-purple-500/5">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <img
                            src={`/images/static/${image.path}`}
                            alt={image.name}
                            className="w-12 h-12 object-cover rounded border cursor-pointer hover:scale-110 transition-transform"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/images/placeholder.png'
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
                          <div className="text-sm text-purple-300">{image.folder || '/'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white">{formatFileSize(image.size)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-300">
                          {formatDate(image.modified)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(`/images/static/${image.path}`)
                                alert('Путь скопирован в буфер обмена')
                              }}
                              className="text-blue-400 hover:text-blue-300 p-1 rounded"
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
              <div className="px-6 py-4 border-t border-purple-500/20 flex justify-between items-center">
                <div className="text-sm text-purple-300">
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
                    <span className="text-purple-300">
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

        {/* Управление пользователями */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Пользователи системы</h2>
            
            <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-xl border border-purple-500/20 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-purple-800/30">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-purple-300 uppercase tracking-wider">Пользователь</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-purple-300 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-purple-300 uppercase tracking-wider">Роль</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-purple-300 uppercase tracking-wider">Крутки</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-purple-300 uppercase tracking-wider">Статус</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-purple-300 uppercase tracking-wider">Регистрация</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-purple-300 uppercase tracking-wider">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-500/10">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-purple-500/5">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-white">{user.username}</div>
                              <div className="text-sm text-gray-400">{user.uid}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-purple-300">{user.email || 'Не указан'}</div>
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
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isActive ? 'Активен' : 'Неактивен'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-300">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => loadUserStats(user.id)}
                              className="text-blue-400 hover:text-blue-300 p-1 rounded"
                              title="Просмотр статистики"
                            >
                              <ChartBarIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUser(user)
                                setShowPasswordModal(true)
                              }}
                              className="text-yellow-400 hover:text-yellow-300 p-1 rounded"
                              title="Изменить пароль"
                            >
                              <CogIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => changeUserRole(user.id, user.role === 'ADMIN' ? 'USER' : 'ADMIN')}
                              className="text-purple-400 hover:text-purple-300 p-1 rounded"
                              title="Изменить роль"
                            >
                              <ShieldCheckIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => toggleUserStatus(user.id, user.isActive)}
                              className={`p-1 rounded ${
                                user.isActive 
                                  ? 'text-orange-400 hover:text-orange-300' 
                                  : 'text-green-400 hover:text-green-300'
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
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-purple-500/20 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">Управление переводами</h2>
                <button
                  onClick={() => setShowMappingForm(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
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
                    className="w-full bg-white/10 border border-purple-500/30 text-white placeholder-purple-300 px-4 py-3 pr-10 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <MagnifyingGlassIcon className="absolute right-3 top-3.5 w-5 h-5 text-purple-300" />
                </div>
              </div>

              {/* Таблица переводов */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-purple-800/30">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-purple-300 uppercase tracking-wider">Превью</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-purple-300 uppercase tracking-wider">Игра</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-purple-300 uppercase tracking-wider">Английское название</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-purple-300 uppercase tracking-wider">Русское название</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-purple-300 uppercase tracking-wider">Тип</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-purple-300 uppercase tracking-wider">Редкость</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-purple-300 uppercase tracking-wider">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-500/10">
                    {mappings.map((mapping) => (
                      <tr key={mapping.id} className="hover:bg-purple-500/5">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {mapping.imagePath ? (
                            <img
                              src={`/images/static/${mapping.imagePath}`}
                              alt={mapping.russianName}
                              className="w-12 h-12 object-cover rounded border"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/images/placeholder.png'
                              }}
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-600 rounded border flex items-center justify-center">
                              <PhotoIcon className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-white">{mapping.game}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-purple-300">{mapping.englishName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">{mapping.russianName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-purple-300">{mapping.itemType}</div>
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
                              className="text-green-400 hover:text-green-300 p-1"
                              title="Привязать изображение"
                            >
                              <PhotoIcon className="w-4 h-4" />
                            </button>
                            {mapping.imagePath && (
                              <button
                                onClick={() => removeMappingImage(mapping.id)}
                                className="text-yellow-400 hover:text-yellow-300 p-1"
                                title="Отвязать изображение"
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => startEdit(mapping)}
                              className="text-purple-400 hover:text-purple-300 p-1"
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
                <div className="flex justify-between items-center mt-6 pt-6 border-t border-purple-500/20">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Предыдущая
                  </button>
                  <span className="text-purple-300">
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
                <div className="bg-gray-900 border border-purple-500/30 rounded-xl p-6 w-full max-w-md mx-4">
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
                      <label className="block text-sm font-medium text-purple-300 mb-2">Игра</label>
                      <div className="relative custom-dropdown">
                        <div
                          onClick={() => toggleDropdown('game')}
                          className="w-full bg-white/10 border border-purple-500/30 text-white px-3 py-2 rounded-lg focus:ring-2 focus:ring-purple-500 cursor-pointer flex items-center justify-between hover:bg-white/15 transition-colors"
                        >
                          <span>{getOptionLabel('game', mappingForm.game)}</span>
                          <ChevronDownIcon className={`w-5 h-5 text-purple-300 transition-transform ${dropdowns.game ? 'rotate-180' : ''}`} />
                        </div>
                        {dropdowns.game && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-purple-500/30 rounded-lg shadow-xl z-10 overflow-hidden">
                            <div
                              onClick={() => selectOption('game', 'HSR')}
                              className="px-3 py-2 text-white hover:bg-purple-600/30 cursor-pointer transition-colors"
                            >
                              Honkai Star Rail
                            </div>
                            <div
                              onClick={() => selectOption('game', 'GENSHIN')}
                              className="px-3 py-2 text-white hover:bg-purple-600/30 cursor-pointer transition-colors"
                            >
                              Genshin Impact
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-purple-300 mb-2">Английское название</label>
                      <input
                        type="text"
                        value={mappingForm.englishName}
                        onChange={(e) => setMappingForm({...mappingForm, englishName: e.target.value})}
                        className="w-full bg-white/10 border border-purple-500/30 text-white px-3 py-2 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="Введите английское название"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-purple-300 mb-2">Русское название</label>
                      <input
                        type="text"
                        value={mappingForm.russianName}
                        onChange={(e) => setMappingForm({...mappingForm, russianName: e.target.value})}
                        className="w-full bg-white/10 border border-purple-500/30 text-white px-3 py-2 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="Введите русское название"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-purple-300 mb-2">Тип предмета</label>
                      <div className="relative custom-dropdown">
                        <div
                          onClick={() => toggleDropdown('itemType')}
                          className="w-full bg-white/10 border border-purple-500/30 text-white px-3 py-2 rounded-lg focus:ring-2 focus:ring-purple-500 cursor-pointer flex items-center justify-between hover:bg-white/15 transition-colors"
                        >
                          <span>{getOptionLabel('itemType', mappingForm.itemType)}</span>
                          <ChevronDownIcon className={`w-5 h-5 text-purple-300 transition-transform ${dropdowns.itemType ? 'rotate-180' : ''}`} />
                        </div>
                        {dropdowns.itemType && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-purple-500/30 rounded-lg shadow-xl z-10 overflow-hidden">
                            <div
                              onClick={() => selectOption('itemType', 'CHARACTER')}
                              className="px-3 py-2 text-white hover:bg-purple-600/30 cursor-pointer transition-colors"
                            >
                              Персонаж
                            </div>
                            <div
                              onClick={() => selectOption('itemType', 'LIGHT_CONE')}
                              className="px-3 py-2 text-white hover:bg-purple-600/30 cursor-pointer transition-colors"
                            >
                              Световой конус
                            </div>
                            <div
                              onClick={() => selectOption('itemType', 'WEAPON')}
                              className="px-3 py-2 text-white hover:bg-purple-600/30 cursor-pointer transition-colors"
                            >
                              Оружие
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-purple-300 mb-2">Редкость</label>
                      <div className="relative custom-dropdown">
                        <div
                          onClick={() => toggleDropdown('rarity')}
                          className="w-full bg-white/10 border border-purple-500/30 text-white px-3 py-2 rounded-lg focus:ring-2 focus:ring-purple-500 cursor-pointer flex items-center justify-between hover:bg-white/15 transition-colors"
                        >
                          <span className={getRarityColor(mappingForm.rarity)}>{getOptionLabel('rarity', mappingForm.rarity)}</span>
                          <ChevronDownIcon className={`w-5 h-5 text-purple-300 transition-transform ${dropdowns.rarity ? 'rotate-180' : ''}`} />
                        </div>
                        {dropdowns.rarity && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-purple-500/30 rounded-lg shadow-xl z-10 overflow-hidden">
                            <div
                              onClick={() => selectOption('rarity', 3)}
                              className="px-3 py-2 text-blue-400 hover:bg-purple-600/30 cursor-pointer transition-colors font-bold"
                            >
                              3★
                            </div>
                            <div
                              onClick={() => selectOption('rarity', 4)}
                              className="px-3 py-2 text-purple-400 hover:bg-purple-600/30 cursor-pointer transition-colors font-bold"
                            >
                              4★
                            </div>
                            <div
                              onClick={() => selectOption('rarity', 5)}
                              className="px-3 py-2 text-yellow-400 hover:bg-purple-600/30 cursor-pointer transition-colors font-bold"
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
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
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
            <div className="bg-gray-900 border border-purple-500/30 rounded-xl p-6 w-full max-w-md mx-4">
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
                  <label className="block text-sm font-medium text-purple-300 mb-2">Новый пароль</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-white/10 border border-purple-500/30 text-white px-3 py-2 rounded-lg focus:ring-2 focus:ring-purple-500"
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
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            <div className="bg-gray-900 border border-purple-500/30 rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
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
                      <span className="text-purple-300">ID:</span>
                      <span className="text-white ml-2">{userStats.user.id}</span>
                    </div>
                    <div>
                      <span className="text-purple-300">UID:</span>
                      <span className="text-white ml-2">{userStats.user.uid}</span>
                    </div>
                    <div>
                      <span className="text-purple-300">Email:</span>
                      <span className="text-white ml-2">{userStats.user.email || 'Не указан'}</span>
                    </div>
                    <div>
                      <span className="text-purple-300">Роль:</span>
                      <span className="text-white ml-2">{userStats.user.role}</span>
                    </div>
                    <div>
                      <span className="text-purple-300">Статус:</span>
                      <span className="text-white ml-2">{userStats.user.isActive ? 'Активен' : 'Заблокирован'}</span>
                    </div>
                    <div>
                      <span className="text-purple-300">Регистрация:</span>
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
                        <span className="text-purple-300">
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
                        <span className="text-purple-300">
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
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Banner Management Section */}
        {activeTab === 'banners' && (
          <div className="bg-gray-800 rounded-lg p-6 border border-purple-500/20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">Управление баннерами</h2>
              <button
                onClick={() => setShowBannerForm(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Добавить баннер</span>
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">
                      Изображение
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">
                      Название
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">
                      Игра
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">
                      Тип
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">
                      Дата
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {banners.map((banner) => (
                    <tr key={banner.id} className="hover:bg-purple-500/5">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {banner.imagePath ? (
                          <img
                            src={`/images/static/${banner.imagePath}`}
                            alt={banner.bannerName}
                            className="w-16 h-10 object-cover rounded border"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/images/placeholder.png'
                            }}
                          />
                        ) : (
                          <div className="w-16 h-10 bg-gray-600 rounded border flex items-center justify-center">
                            <PhotoIcon className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{banner.bannerName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-purple-300">{banner.game}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-purple-300">{banner.bannerType}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-purple-300">
                          {new Date(banner.createdAt).toLocaleDateString('ru-RU')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openImageSelector('banner', banner)}
                            className="text-green-400 hover:text-green-300 p-1"
                            title="Привязать изображение"
                          >
                            <PhotoIcon className="w-4 h-4" />
                          </button>
                          {banner.imagePath && (
                            <button
                              onClick={() => removeBannerImage(banner.id)}
                              className="text-yellow-400 hover:text-yellow-300 p-1"
                              title="Отвязать изображение"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => startBannerEdit(banner)}
                            className="text-purple-400 hover:text-purple-300 p-1"
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
            <div className="bg-gray-900 border border-purple-500/30 rounded-xl p-6 w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-white">
                  Выберите изображение для {selectedMapping ? 'предмета' : 'баннера'}
                  {selectedMapping && ` "${selectedMapping.russianName}"`}
                  {selectedBanner && ` "${selectedBanner.bannerName}"`}
                </h3>
                <button
                  onClick={() => {
                    setShowImageModal(false)
                    setSelectedMapping(null)
                    setSelectedBanner(null)
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              
              {/* Поиск и фильтр по папкам */}
              <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Поиск изображений..."
                    value={imageSearchTerm}
                    onChange={(e) => setImageSearchTerm(e.target.value)}
                    className="w-full bg-white/10 border border-purple-500/30 text-white placeholder-purple-300 px-4 py-3 pr-10 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <MagnifyingGlassIcon className="absolute right-3 top-3.5 w-5 h-5 text-purple-300" />
                </div>
                
                {/* Кастомный dropdown для папок */}
                <div className="relative custom-dropdown">
                  <div
                    onClick={() => toggleDropdown('imageFolder')}
                    className="w-full bg-white/10 border border-purple-500/30 text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-purple-500 cursor-pointer flex items-center justify-between hover:bg-white/15 transition-colors"
                  >
                    <span>{selectedFolder === '' ? 'Все папки' : selectedFolder === 'characters' ? 'characters (персонажи)' : selectedFolder === 'weapons' ? 'weapons (оружие)' : selectedFolder === 'artifacts' ? 'artifacts (артефакты)' : selectedFolder === 'items' ? 'items (предметы)' : selectedFolder === 'elements' ? 'elements (элементы)' : selectedFolder === 'banners' ? 'banners (баннеры)' : selectedFolder === 'events' ? 'events (события)' : selectedFolder === 'skills' ? 'skills (навыки)' : selectedFolder === 'monsters' ? 'monsters (монстры)' : selectedFolder === 'tcg' ? 'tcg (карточная игра)' : selectedFolder}</span>
                    <ChevronDownIcon className={`w-5 h-5 text-purple-300 transition-transform ${dropdowns.imageFolder ? 'rotate-180' : ''}`} />
                  </div>
                  {dropdowns.imageFolder && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-purple-500/30 rounded-lg shadow-xl z-10 overflow-hidden max-h-60 overflow-y-auto">
                      <div
                        onClick={() => {
                          setSelectedFolder('')
                          toggleDropdown('imageFolder')
                        }}
                        className="px-4 py-3 text-white hover:bg-purple-600/30 cursor-pointer transition-colors"
                      >
                        Все папки
                      </div>
                      <div
                        onClick={() => {
                          setSelectedFolder('characters')
                          toggleDropdown('imageFolder')
                        }}
                        className="px-4 py-3 text-white hover:bg-purple-600/30 cursor-pointer transition-colors"
                      >
                        characters (персонажи)
                      </div>
                      <div
                        onClick={() => {
                          setSelectedFolder('weapons')
                          toggleDropdown('imageFolder')
                        }}
                        className="px-4 py-3 text-white hover:bg-purple-600/30 cursor-pointer transition-colors"
                      >
                        weapons (оружие)
                      </div>
                      <div
                        onClick={() => {
                          setSelectedFolder('artifacts')
                          toggleDropdown('imageFolder')
                        }}
                        className="px-4 py-3 text-white hover:bg-purple-600/30 cursor-pointer transition-colors"
                      >
                        artifacts (артефакты)
                      </div>
                      <div
                        onClick={() => {
                          setSelectedFolder('items')
                          toggleDropdown('imageFolder')
                        }}
                        className="px-4 py-3 text-white hover:bg-purple-600/30 cursor-pointer transition-colors"
                      >
                        items (предметы)
                      </div>
                      <div
                        onClick={() => {
                          setSelectedFolder('elements')
                          toggleDropdown('imageFolder')
                        }}
                        className="px-4 py-3 text-white hover:bg-purple-600/30 cursor-pointer transition-colors"
                      >
                        elements (элементы)
                      </div>
                      <div
                        onClick={() => {
                          setSelectedFolder('banners')
                          toggleDropdown('imageFolder')
                        }}
                        className="px-4 py-3 text-white hover:bg-purple-600/30 cursor-pointer transition-colors"
                      >
                        banners (баннеры)
                      </div>
                      <div
                        onClick={() => {
                          setSelectedFolder('events')
                          toggleDropdown('imageFolder')
                        }}
                        className="px-4 py-3 text-white hover:bg-purple-600/30 cursor-pointer transition-colors"
                      >
                        events (события)
                      </div>
                      <div
                        onClick={() => {
                          setSelectedFolder('skills')
                          toggleDropdown('imageFolder')
                        }}
                        className="px-4 py-3 text-white hover:bg-purple-600/30 cursor-pointer transition-colors"
                      >
                        skills (навыки)
                      </div>
                      <div
                        onClick={() => {
                          setSelectedFolder('monsters')
                          toggleDropdown('imageFolder')
                        }}
                        className="px-4 py-3 text-white hover:bg-purple-600/30 cursor-pointer transition-colors"
                      >
                        monsters (монстры)
                      </div>
                      <div
                        onClick={() => {
                          setSelectedFolder('tcg')
                          toggleDropdown('imageFolder')
                        }}
                        className="px-4 py-3 text-white hover:bg-purple-600/30 cursor-pointer transition-colors"
                      >
                        tcg (карточная игра)
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Список изображений в виде сетки */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 max-h-96 overflow-y-auto">
                {imageItems && imageItems.length > 0 ? imageItems
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
                      if (selectedMapping) {
                        updateMappingImage(selectedMapping.id, image.path)
                      } else if (selectedBanner) {
                        updateBannerImage(selectedBanner.id, image.path)
                      }
                    }}
                    className="bg-white/5 border border-purple-500/20 rounded-lg p-2 hover:bg-white/10 cursor-pointer transition-all group hover:scale-105"
                  >
                    <div className="aspect-square mb-2 overflow-hidden rounded border bg-gray-700 flex items-center justify-center">
                      <img
                        src={`/images/static/${image.path}`}
                        alt={image.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.log('Image load error for:', image.path)
                          ;(e.target as HTMLImageElement).src = '/images/placeholder.png'
                        }}
                        onLoad={() => console.log('Image loaded:', image.path)}
                      />
                    </div>
                    <div className="text-xs text-white font-medium truncate mb-1" title={image.name}>
                      {image.name}
                    </div>
                    <div className="text-xs text-purple-300 truncate" title={image.folder}>
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
              
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-purple-500/20">
                <div className="text-sm text-purple-300">
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
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default AdminPanel
