import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Upload from './pages/Upload'
import Statistics from './pages/Statistics'
import UserProfile from './pages/UserProfile'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/statistics" element={<Statistics />} />
        <Route path="/user/:uid" element={<UserProfile />} />
      </Routes>
    </Layout>
  )
}

export default App
