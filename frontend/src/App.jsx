import { useState } from 'react'

import './App.css'
import LandingPage from './pages/landing'
import Authentication from './pages/authentication'
import{BrowserRouter as Router,Routes,Route} from 'react-router-dom'
import VideoMeet from './pages/videoMeet'
function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Router>
        <Routes>
        
          <Route path='/' element={<LandingPage/>}/>
          <Route path='/auth' element={<Authentication/>}/>
          <Route path='/:url' element={<VideoMeet/>}/>
        </Routes>
      </Router>
    </>
  )
}

export default App
