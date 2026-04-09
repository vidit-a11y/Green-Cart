import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  // Logic: This is like a Python list that React 'watches' for changes
  const [items, setItems] = useState<any[]>([])

  // Logic: The function that fetches data from your Node.js server
  const fetchItems = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/items')
      setItems(response.data)
    } catch (error) {
      console.error("Error fetching items:", error)
    }
  }

  // Logic: Run 'fetchItems' as soon as the component loads
  useEffect(() => {
    fetchItems()
  }, [])

  return (
    <div className="app-container">
      <header id="center">
        <h1>Green-Cart 🛒</h1>
        <p>Fresh items directly from the database</p>
      </header>

      <section id="next-steps">
        <div className="item-display">
          <h2>Items in Inventory</h2>
          
          {items.length === 0 ? (
            <div className="no-items">
              <p>No items found! Your MongoDB is empty.</p>
              <p>Check <code>localhost:5000/api/items</code> to verify.</p>
            </div>
          ) : (
            <ul className="item-list">
              {items.map((item) => (
                <li key={item._id} className="item-card">
                  <h3>{item.name}</h3>
                  <p>Location: {item.location}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}

export default App