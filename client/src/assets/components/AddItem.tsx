import { useState } from 'react';
import axios from 'axios';

function AddItem({ onAdded }: { onAdded: () => void }) {
  const [name, setName] = useState('');

const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
    if (!name) return;

    try {
      // Sending the POST request to your Node server
      await axios.post('http://localhost:5000/api/items', {
        name: name,
        location: "Jaipur" // Default location for Vidit
      });

      alert(`Success! Added: ${name}`);
      setName('');   // Clear input box
      onAdded();     // Tell the main page to refresh the list
    } catch (error) {
      console.error(error);
      alert("Error: Could not connect to server. Check your Node.js terminal.");
    }
  };

  return (
    <div className="add-item-box">
      <form onSubmit={handleSubmit} className="add-form">
        <input 
          type="text" 
          placeholder="Enter item name..." 
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit">Add Item</button>
      </form>
    </div>
  );
}

export default AddItem;