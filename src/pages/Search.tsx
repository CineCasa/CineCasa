import React, { useState } from 'react';

export default function Search() {
  const [query, setQuery] = useState('');
  
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-4">Buscar</h1>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar filmes e séries..."
        className="w-full max-w-md px-4 py-2 bg-gray-800 text-white rounded"
      />
    </div>
  );
}
