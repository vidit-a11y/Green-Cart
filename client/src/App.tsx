import { useState, useEffect } from 'react'
import axios from 'axios'
import AddItem from './assets/components/AddItem' // Make sure path matches your screenshot
import './App.css'

function App() {
  const [items, setItems] = useState<any[]>([]);

  const fetchItems = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/items');
      setItems(response.data);
    } catch (error) {
      console.log("Server unreachable - likely office network restriction.");
    }
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="app-container">
      <header>
        <h1>Green-Cart 🛒</h1>
        <p>B.Tech Project: MERN Stack Inventory</p>
      </header>

      <main>
        {/* Pass fetchItems to AddItem so it can refresh the list after adding */}
        <AddItem onAdded={fetchItems} />

        <div className="item-display">
          <h2>Inventory List</h2>
          {items.length === 0 ? (
            <p>No items found. Add one above!</p>
          ) : (
            <ul>
              {items.map((item) => (
                <li key={item._id} className="item-card">
                  <strong>{item.name}</strong> - {item.location}
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}

export default App