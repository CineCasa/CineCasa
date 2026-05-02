import React from 'react';
import { useParams } from 'react-router-dom';

export default function MovieDetails() {
  const { id } = useParams();
  
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-4">Detalhes do Filme</h1>
      <p className="text-gray-400">ID: {id}</p>
    </div>
  );
}
