const UserProfile = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Профиль пользователя</h1>
      
      <div className="card">
        <div className="text-center py-8">
          <div className="text-4xl mb-4">👤</div>
          <h2 className="text-xl font-bold text-white mb-2">Пользователь не найден</h2>
          <p className="text-gray-400">Загрузите данные для просмотра профиля</p>
        </div>
      </div>
    </div>
  )
}

export default UserProfile
