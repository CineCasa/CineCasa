import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface FilterSystemProps {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const FilterSystem: React.FC<FilterSystemProps> = ({
  categories,
  activeCategory,
  onCategoryChange
}) => {
  const [showAll, setShowAll] = useState(false);

  const displayCategories = showAll ? categories : categories.slice(0, 12);

  return (
    <div className="mb-8">
      <div className="flex flex-wrap gap-3 px-6 max-w-7xl mx-auto">
        {/* Botão "Todos" */}
        <button
          onClick={() => onCategoryChange('')}
          className={`filter-button font-buttons text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl px-2 sm:px-4 md:px-6 lg:px-8 xl:px-10 py-1 sm:py-2 md:py-3 lg:py-4 xl:py-5 ${
            activeCategory === '' ? 'active' : ''
          }`}
        >
          Todos
        </button>

        {/* Categorias */}
        {displayCategories.map((category, index) => (
          <motion.button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={`filter-button font-buttons text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl px-2 sm:px-4 md:px-6 lg:px-8 xl:px-10 py-1 sm:py-2 md:py-3 lg:py-4 xl:py-5 ${
              activeCategory === category ? 'active' : ''
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            {category}
          </motion.button>
        ))}

        {/* Botão Mostrar Mais/Menos */}
        {categories.length > 12 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="filter-button font-buttons text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl px-2 sm:px-4 md:px-6 lg:px-8 xl:px-10 py-1 sm:py-2 md:py-3 lg:py-4 xl:py-5 text-accent hover:text-accent/80"
          >
            {showAll ? 'Mostrar Menos' : `Mostrar Mais (${categories.length - 12})`}
          </button>
        )}
      </div>
    </div>
  );
};

// Categorias predefinidas para o CineCasa
export const CINECASA_CATEGORIES = [
  "Lançamento 2026",
  "Ação", 
  "Aventura",
  "Comédia",
  "Drama",
  "Terror",
  "Suspense",
  "Ficção Científica",
  "Romance",
  "Documentário",
  "Animação",
  "Finanças",
  "Negritude",
  "LGBTQ+",
  "Esportes",
  "Música",
  "História",
  "Biografia",
  "Família",
  "Infantil",
  "Guerra",
  "Policial",
  "Mistério",
  "Fantasia",
  "Musical",
  "Western"
];

export default FilterSystem;
