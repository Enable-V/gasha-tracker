import { useState } from 'react'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onAuthSuccess: (user: any, token: string) => void
}

const AuthModal = ({ isOpen, onClose, onAuthSuccess }: AuthModalProps) => {
  const [isLogin, setIsLogin] = useState(true)

  if (!isOpen) return null

  const handleAuthSuccess = (user: any, token: string) => {
    onAuthSuccess(user, token)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative bg-gray-900/95 border border-white/10 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl"
        >
          ✕
        </button>
        
        <div className="p-6">
          {isLogin ? (
            <LoginForm
              onLoginSuccess={handleAuthSuccess}
              onSwitchToRegister={() => setIsLogin(false)}
            />
          ) : (
            <RegisterForm
              onRegisterSuccess={handleAuthSuccess}
              onSwitchToLogin={() => setIsLogin(true)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthModal
