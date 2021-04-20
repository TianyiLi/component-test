import React, { useState } from 'react'
import logo from './logo.svg'
import './App.css'
import { TimeTable } from './components/TimeTable'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <TimeTable />
    </div>
  )
}

export default App
