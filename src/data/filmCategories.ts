// Categorias para menu Filmes - ordem e escrita exatas conforme solicitado
export const filmCategories = [
  'Lançamento 2026',
  'Lançamento 2025', 
  'Ação',
  'Aventura',
  'Infantil',
  'Finanças',
  'Anime',
  'Animação',
  'Comédia',
  'Drama',
  'Dorama',
  'Clássicos',
  'Negritude',
  'Crime',
  'Policial',
  'Família',
  'Musical',
  'Documentário',
  'Faroeste',
  'Ficção',
  'Nacional',
  'Religioso',
  'Romance',
  'Terror',
  'Suspense',
  'Adulto'
];

// Função para normalizar categorias do banco
export const normalizeCategory = (category: string): string => {
  if (!category) return '';
  
  // Extrair primeira categoria de strings concatenadas
  const firstCategory = category.split(',')[0].trim();
  
  // Mapear variações comuns para as categorias padrão
  const categoryMap: Record<string, string> = {
    'Açao': 'Ação',
    'Familia': 'Família',
    'Documentários': 'Documentário',
    'kids': 'Infantil',
    'Lançamento': 'Lançamento 2025' // Default para lançamento sem ano
  };
  
  return categoryMap[firstCategory] || firstCategory;
};

// Função para verificar se categoria é válida
export const isValidCategory = (category: string): boolean => {
  return filmCategories.includes(category);
};
