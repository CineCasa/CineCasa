import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PremiumNavbar from '../components/PremiumNavbar';
import PremiumHeroBanner from '../components/PremiumHeroBanner';
import { MobileNetflixHero } from '../components/MobileNetflixHero';
import ContentCarousel from '../components/ContentCarousel';
import { useContinueWatching } from '../hooks/useContinueWatching';
import { useLancamentos } from '../hooks/useLancamentos';
import { useRomances } from '../hooks/useRomances';
import { useFinancas } from '../hooks/useFinancas';
import { useNegritude } from '../hooks/useNegritude';
import { usePreparePipoca } from '../hooks/usePreparePipoca';
import { useInfantil } from '../hooks/useInfantil';
import { useOscarWinners } from '../hooks/useOscarWinners';
import { useTravesseiroEdredon } from '../hooks/useTravesseiroEdredon';
import { useWorstRated } from '../hooks/useWorstRated';
import { useCineRiso } from '../hooks/useCineRiso';
import { useMentesCriminosas } from '../hooks/useMentesCriminosas';
import { useAdrenalinaPura } from '../hooks/useAdrenalinaPura';
import { useClassicosEternos } from '../hooks/useClassicosEternos';
import { useRitmoEmocao } from '../hooks/useRitmoEmocao';
import { useHistoriasEsperanca } from '../hooks/useHistoriasEsperanca';
import { useOrgulhoNacional } from '../hooks/useOrgulhoNacional';
import { useBaseadoEmFatosReais } from '../hooks/useBaseadoEmFatosReais';
import { usePrepareParaMedo } from '../hooks/usePrepareParaMedo';
import { useRecomendacoes } from '../hooks/useRecomendacoes';
import { useRecommendedForYou } from '../hooks/useRecommendedForYou';
import { useWatchlistSection } from '../hooks/useWatchlistSection';
import { useAuth } from '../components/AuthProvider';
import ContinueWatching from '../components/ContinueWatching';
import { BecauseYouWatchedRow } from '../components/BecauseYouWatchedRow';
import CineNoiteSection from '../components/CineNoiteSection';
import MaesInesqueciveisSection from '../components/MaesInesqueciveisSection';
import HeroisDaVidaRealSection from '../components/HeroisDaVidaRealSection';
// Mock data para demonstração
const mockHeroContent = {
  title: "A ORIGEM DO AMANHÃ",
  description: "Em um futuro distante, a humanidade enfrenta sua maior crise quando uma ameaça alienígena coloca em risco a existência da Terra. Uma equipe de elite deve viajar através do tempo para descobrir a origem do ataque e salvar o futuro da humanidade.",
  backdrop: "/api/placeholder/1920/1080",
  year: "2026",
  rating: "8.5",
  duration: "2h 28min"
};

const mockContinueWatching = [
  {
    id: "1",
    title: "Guardiões da Galáxia Vol. 3",
    poster: "/api/placeholder/300/450",
    type: "movie" as const,
    progress: 65,
    year: "2023",
    rating: "8.2"
  },
  {
    id: "2", 
    title: "The Last of Us",
    poster: "/api/placeholder/300/450",
    type: "series" as const,
    progress: 40,
    year: "2023",
    rating: "9.0"
  },
  {
    id: "3",
    title: "Oppenheimer",
    poster: "/api/placeholder/300/450", 
    type: "movie" as const,
    progress: 85,
    year: "2023",
    rating: "8.4"
  },
  {
    id: "4",
    title: "House of the Dragon",
    poster: "/api/placeholder/300/450",
    type: "series" as const,
    progress: 30,
    year: "2022",
    rating: "8.6"
  }
];

const mockNewReleases = [
  {
    id: "5",
    title: "Duna: Parte Dois",
    poster: "/api/placeholder/300/450",
    type: "movie" as const,
    year: "2024",
    rating: "8.8",
    isNew: true
  },
  {
    id: "6",
    title: "The Bear - Temporada 3",
    poster: "/api/placeholder/300/450",
    type: "series" as const,
    year: "2024",
    rating: "8.7",
    isNew: true
  },
  {
    id: "7",
    title: "Godzilla x Kong",
    poster: "/api/placeholder/300/450",
    type: "movie" as const,
    year: "2024",
    rating: "7.9",
    isNew: true
  }
];

const mockExclusiveContent = [
  {
    id: "8",
    title: "Mistérios de CineCasa",
    poster: "/api/placeholder/300/450",
    type: "series" as const,
    year: "2024",
    rating: "8.1"
  },
  {
    id: "9",
    title: "Ação Imediata",
    poster: "/api/placeholder/300/450",
    type: "movie" as const,
    year: "2024",
    rating: "7.8"
  }
];

const mockRomanceInspiration = [
  {
    id: "10",
    title: "O Amor nos Tempos da Cholera",
    poster: "/api/placeholder/300/450",
    type: "movie" as const,
    year: "2007",
    rating: "7.3"
  },
  {
    id: "11",
    title: "Como Eu Era Antes de Você",
    poster: "/api/placeholder/300/450",
    type: "movie" as const,
    year: "2016",
    rating: "7.4"
  },
  {
    id: "12",
    title: "Antes do Amanhecer",
    poster: "/api/placeholder/300/450",
    type: "movie" as const,
    year: "1995",
    rating: "8.1"
  },
  {
    id: "13",
    title: "A Notebook - Diário de uma Paixão",
    poster: "/api/placeholder/300/450",
    type: "movie" as const,
    year: "2004",
    rating: "7.8"
  },
  {
    id: "14",
    title: "Orgulho e Preconceito",
    poster: "/api/placeholder/300/450",
    type: "movie" as const,
    year: "2005",
    rating: "7.8"
  }
];

const mockPrepareAPipoca = [
  {
    id: "15",
    title: "Velozes e Furiosos 10",
    poster: "/api/placeholder/300/450",
    type: "movie" as const,
    year: "2023",
    rating: "6.0"
  },
  {
    id: "16",
    title: "Missão Impossível: Acerto de Contas",
    poster: "/api/placeholder/300/450",
    type: "movie" as const,
    year: "2023",
    rating: "7.8"
  },
  {
    id: "17",
    title: "Guardiões da Galáxia Vol. 3",
    poster: "/api/placeholder/300/450",
    type: "movie" as const,
    year: "2023",
    rating: "7.9"
  },
  {
    id: "18",
    title: "John Wick 4: Baba Yaga",
    poster: "/api/placeholder/300/450",
    type: "movie" as const,
    year: "2023",
    rating: "7.7"
  },
  {
    id: "19",
    title: "Duna: Parte Dois",
    poster: "/api/placeholder/300/450",
    type: "movie" as const,
    year: "2024",
    rating: "8.5"
  }
];

const mockComoEBomSerCrianca = [
  {
    id: "20",
    title: "Divertida Mente 2",
    poster: "/api/placeholder/300/450",
    type: "movie" as const,
    year: "2024",
    rating: "7.6"
  },
  {
    id: "21",
    title: "Moana 2",
    poster: "/api/placeholder/300/450",
    type: "movie" as const,
    year: "2024",
    rating: "7.0"
  },
  {
    id: "22",
    title: "Kung Fu Panda 4",
    poster: "/api/placeholder/300/450",
    type: "movie" as const,
    year: "2024",
    rating: "6.7"
  },
  {
    id: "23",
    title: "O Rei Leão",
    poster: "/api/placeholder/300/450",
    type: "movie" as const,
    year: "2019",
    rating: "6.8"
  },
  {
    id: "24",
    title: "Frozen II",
    poster: "/api/placeholder/300/450",
    type: "movie" as const,
    year: "2019",
    rating: "6.8"
  }
];


const mockVencedoresOscar = [
  {
    id: "30",
    title: "Oppenheimer",
    poster: "/api/placeholder/300/450",
    type: "movie" as const,
    year: "2023",
    rating: "8.4"
  },
  {
    id: "31",
    title: "Pobres Criaturas",
    poster: "/api/placeholder/300/450",
    type: "movie" as const,
    year: "2023",
    rating: "7.9"
  },
  {
    id: "32",
    title: "Anatomia de uma Queda",
    poster: "/api/placeholder/300/450",
    type: "movie" as const,
    year: "2023",
    rating: "7.6"
  },
  {
    id: "33",
    title: "American Fiction",
    poster: "/api/placeholder/300/450",
    type: "movie" as const,
    year: "2023",
    rating: "7.5"
  },
  {
    id: "34",
    title: "Zona de Interesse",
    poster: "/api/placeholder/300/450",
    type: "movie" as const,
    year: "2023",
    rating: "7.4"
  }
];

const mockTravesseiroEdredon = [
  {
    id: "35",
    title: "Amelie Poulain",
    poster: "/api/placeholder/300/450",
    type: "movie" as const,
    year: "2001",
    rating: "8.3"
  },
  {
    id: "36",
    title: "Antes do Amanhecer",
    poster: "/api/placeholder/300/450",
    type: "movie" as const,
    year: "1995",
    rating: "8.1"
  },
  {
    id: "37",
    title: "A Vida é Bela",
    poster: "/api/placeholder/300/450",
    type: "movie" as const,
    year: "1997",
    rating: "8.6"
  },
  {
    id: "38",
    title: "As Aventuras de Pi",
    poster: "/api/placeholder/300/450",
    type: "movie" as const,
    year: "2012",
    rating: "7.9"
  },
  {
    id: "39",
    title: "Chef",
    poster: "/api/placeholder/300/450",
    type: "movie" as const,
    year: "2014",
    rating: "7.3"
  }
];

const mockPoderiaSerMelhor = [
  {
    id: "40",
    title: "The Room",
    poster: "/api/placeholder/300/450",
    type: "movie" as const,
    year: "2003",
    rating: "3.7"
  },
  {
    id: "41",
    title: "Sharknado",
    poster: "/api/placeholder/300/450",
    type: "movie" as const,
    year: "2013",
    rating: "3.3"
  },
  {
    id: "42",
    title: "Birdemic",
    poster: "/api/placeholder/300/450",
    type: "movie" as const,
    year: "2010",
    rating: "1.8"
  },
  {
    id: "43",
    title: "Troll 2",
    poster: "/api/placeholder/300/450",
    type: "movie" as const,
    year: "1990",
    rating: "2.9"
  },
  {
    id: "44",
    title: "Plan 9 from Outer Space",
    poster: "/api/placeholder/300/450",
    type: "movie" as const,
    year: "1957",
    rating: "4.0"
  }
];

const PremiumHome: React.FC = () => {
  console.log('[PremiumHome] Componente iniciando renderização');
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  // Sempre inicia no topo da página (banner) quando a home é carregada
  useEffect(() => {
    console.log('[PremiumHome] useEffect scrollTo executado');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const { items: continueWatchingItems, isLoading: isLoadingContinue } = useContinueWatching();
  const { user } = useAuth();
  const { lancamentos, isLoading: isLoadingLancamentos } = useLancamentos(user?.email);
  const { recomendacoes, isLoading: isLoadingRecomendacoes, topGenres } = useRecomendacoes(user?.email);
  const { romances, isLoading: isLoadingRomances } = useRomances(user?.email);
  const { financas, isLoading: isLoadingFinancas } = useFinancas(user?.email);
  const { content: adrenalinaContent, isLoading: isLoadingAdrenalina } = useAdrenalinaPura();
  const { negritude, isLoading: isLoadingNegritude } = useNegritude(user?.email);
  const { recommendations: recommendedForYou, isLoading: isLoadingRecommendedForYou } = useRecommendedForYou(user?.id);
  const { series: pipocaSeries, isLoading: isLoadingPipoca } = usePreparePipoca(user?.email);
  const { infantil, isLoading: isLoadingInfantil } = useInfantil(user?.email);
  const { content: classicosContent, isLoading: isLoadingClassicos } = useClassicosEternos();
  const { oscarWinners, isLoading: isLoadingOscar } = useOscarWinners();
  const { content: travesseiroContent, isLoading: isLoadingTravesseiro } = useTravesseiroEdredon(user?.email);
  const { content: cineRisoContent, isLoading: isLoadingCineRiso } = useCineRiso();
  const { content: mentesContent, isLoading: isLoadingMentes } = useMentesCriminosas();
  const { content: worstRatedContent, isLoading: isLoadingWorstRated, isUsingFallback } = useWorstRated(user?.email);
  const { content: ritmoContent, isLoading: isLoadingRitmo } = useRitmoEmocao();
  const { content: historiasContent, isLoading: isLoadingHistorias } = useHistoriasEsperanca();
  const { content: orgulhoContent, isLoading: isLoadingOrgulho } = useOrgulhoNacional();
  const { content: baseadoEmFatosContent, isLoading: isLoadingBaseadoEmFatos } = useBaseadoEmFatosReais();
  const { content: prepareParaMedoContent, isLoading: isLoadingPrepareParaMedo } = usePrepareParaMedo();
  const { watchlistItems, isLoading: isLoadingWatchlist, count: watchlistCount } = useWatchlistSection(user?.id);

  // Verificar visibilidade de seções agendadas (evitar flickering)
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-11
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute; // minutos desde meia-noite
  
  // Cine Noite: 23:58 - 05:59
  const isCineNoiteVisible = currentTime >= (23 * 60 + 58) || currentTime <= (5 * 60 + 59);
  
  // Mães Inesquecíveis: mês de maio (4)
  const isMaesInesqueciveisVisible = currentMonth === 4;
  
  // Heróis da Vida Real: mês de agosto (7)
  const isHeroisDaVidaRealVisible = currentMonth === 7;

  // Sistema para evitar duplicatas apenas DENTRO de cada seção (não entre seções)
  const filterUniqueItems = (items: any[], limit: number = 5) => {
    const usedIds = new Set<string>();
    const unique = items.filter(item => {
      const id = item.tmdbId || item.id;
      if (usedIds.has(id)) return false;
      usedIds.add(id);
      return true;
    });
    return unique.slice(0, limit);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    console.log("Searching for:", query);
  };

  const handleCardClick = (item: any) => {
    console.log("🎯 PremiumHome - Card clicado:", item);
    const typePath = item.type === 'movie' ? 'cinema' : 'series';
    // Usar o ID do banco de dados (prioridade) em vez do tmdbId
    const id = item.id || item.tmdbId;
    console.log("🧭 Navegando para:", `/details/${typePath}/${id}`, "com:", { tmdbId: item.tmdbId, id: item.id, finalId: id });
    navigate(`/details/${typePath}/${id}`);
  };

  const handleHeroPlay = () => {
    console.log("Playing hero content");
  };

  const handleHeroDetails = () => {
    console.log("Showing hero details");
  };

  return (
    <div className="streaming-container min-h-screen bg-black">
      {/* HERO BANNER - Primeiro elemento visível da página */}
      {/* Mobile Banner - hidden on desktop */}
      <div className="md:hidden relative z-[100]">
        <MobileNetflixHero contentType="all" />
      </div>
      {/* Desktop Banner - hidden on mobile */}
      <div className="hidden md:block relative z-[100]">
        <PremiumHeroBanner contentType="all" />
      </div>

      {/* Continue Watching - Logo após o Banner */}
      {(() => {
        console.log('[PremiumHome] Continue Watching - isLoading:', isLoadingContinue, 'items:', continueWatchingItems.length, 'user:', user?.id);
        return null;
      })()}
      {!isLoadingContinue ? (
        <div className="relative z-40 mt-6 mb-4">
          {continueWatchingItems.length > 0 ? (
            <ContinueWatching
              items={continueWatchingItems.slice(0, 4).map(item => ({
                id: item.id,
                title: item.title,
                poster: item.poster,
                banner: item.banner,
                backdrop: item.banner,
                type: item.type,
                progress: item.progress,
                episodeId: item.episodeId,
                seasonNumber: item.seasonNumber,
                episodeNumber: item.episodeNumber
              }))}
              onRemove={(id, type, episodeId) => {
                console.log("Removendo item:", id, type, episodeId);
              }}
            />
          ) : (
            <div className="px-4 md:px-8 py-4">
              <h2 className="text-lg font-semibold text-white mb-2">Continuar Assistindo</h2>
              <p className="text-sm text-gray-400">Comece a assistir algo para ver aqui</p>
            </div>
          )}
        </div>
      ) : null}

      {/* HERÓIS DA VIDA REAL - Seção especial Dia dos Pais (mês de agosto) */}
      {isHeroisDaVidaRealVisible && <HeroisDaVidaRealSection onCardClick={handleCardClick} />}

      {/* MÃES INESQUECÍVEIS - Seção especial Dia das Mães (mês de maio) */}
      {isMaesInesqueciveisVisible && <MaesInesqueciveisSection onCardClick={handleCardClick} />}

      {/* LANÇAMENTOS E NOVIDADES - Seção principal, sempre visível */}
      <div className="relative z-30 my-6">
        {isLoadingLancamentos ? (
          <div className="px-4 md:px-8 py-8">
            <div className="h-8 w-48 bg-gray-800 rounded animate-pulse mb-4"></div>
            <div className="flex gap-4 overflow-hidden">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="w-32 h-48 bg-gray-800 rounded animate-pulse flex-shrink-0"></div>
              ))}
            </div>
          </div>
        ) : lancamentos.length > 0 ? (
          <ContentCarousel
            title="Lançamentos e Novidades 🆕"
            items={filterUniqueItems((lancamentos || []).map(item => ({
              id: item.id,
              tmdbId: item.tmdbId,
              title: item.title,
              poster: item.poster,
              type: item.type,
              year: item.year,
              rating: item.rating,
              isNew: true
            })), 10)}
            onCardClick={handleCardClick}
          />
        ) : (
          <div className="px-4 md:px-8 py-8">
            <h2 className="text-xl font-bold text-white mb-4">Lançamentos e Novidades 🆕</h2>
            <p className="text-gray-400">Em breve novos lançamentos!</p>
          </div>
        )}
      </div>

      {/* VER DEPOIS - Seção exclusiva do usuário (apenas se logado e tiver itens) */}
      {user && watchlistCount > 0 && (
        <div className="relative z-30 my-6">
          {isLoadingWatchlist ? (
            <div className="px-4 md:px-8 py-8">
              <div className="h-8 w-48 bg-gray-800 rounded animate-pulse mb-4"></div>
              <div className="flex gap-4 overflow-hidden">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="w-32 h-48 bg-gray-800 rounded animate-pulse flex-shrink-0"></div>
                ))}
              </div>
            </div>
          ) : (
            <ContentCarousel
              title="➕ Ver depois"
              items={filterUniqueItems((watchlistItems || []).map(item => ({
                id: item.id,
                tmdbId: item.tmdbId,
                title: item.title,
                poster: item.poster,
                type: item.type,
                year: item.year,
                rating: item.rating
              })), 5)}
              onCardClick={handleCardClick}
            />
          )}
        </div>
      )}

      {/* Content Sections - no margin on mobile, keep margin on desktop */}
      <div className="mt-0 md:mt-[70px] relative z-30">
        {/* Exclusivos para Você - Inteligente: baseado nos 5 gêneros mais vistos */}
        {!isLoadingRecomendacoes && recomendacoes.length > 0 && (
          <ContentCarousel
            title={`Exclusivos para Você${topGenres.length > 0 ? ` • ${topGenres.slice(0, 2).map(g => g.genre).join(', ')}` : ''}`}
            items={filterUniqueItems((recomendacoes || []).map(item => ({
              id: item.id,
              tmdbId: item.tmdbId,
              title: item.title,
              poster: item.poster,
              type: item.type,
              year: item.year,
              rating: `${Math.round(item.matchScore * 10)}% match`,
              isNew: true
            })), 5)}
            onCardClick={handleCardClick}
          />
        )}

        {/* Porque você assistiu - Recomendações baseadas no histórico */}
        <BecauseYouWatchedRow />

        {/* Romances para se Inspirar - Fixa: 5 capas da categoria romance */}
        <ContentCarousel
          title="Romances para se Inspirar 💕"
          items={filterUniqueItems((romances || []).map(item => ({
            id: item.id,
            tmdbId: item.tmdbId,
            title: item.title,
            poster: item.poster,
            type: item.type,
            year: item.year,
            rating: item.rating
          })), 5)}
          onCardClick={handleCardClick}
        />

        {/* Dinheiro Importa! - Fixa: 5 capas da categoria Finanças */}
        <ContentCarousel
          title="Dinheiro Importa! 💰"
          items={filterUniqueItems((financas || []).map(item => ({
            id: item.id,
            tmdbId: item.tmdbId,
            title: item.title,
            poster: item.poster,
            type: item.type,
            year: item.year,
            rating: item.rating
          })), 5)}
          onCardClick={handleCardClick}
        />

        {/* Negritude em Alta - Fixa: 5 capas da categoria Negritude */}
        <ContentCarousel
          title="Negritude em Alta ✊🏾"
          items={filterUniqueItems((negritude || []).map(item => ({
            id: item.id,
            tmdbId: item.tmdbId,
            title: item.title,
            poster: item.poster,
            type: item.type,
            year: item.year,
            rating: item.rating
          })), 5)}
          onCardClick={handleCardClick}
        />

        {/* Recomendado para você - Personalizado baseado no histórico do usuário */}
        {user && (
          <ContentCarousel
            title="Recomendado para você 🎯"
            items={!isLoadingRecommendedForYou ? filterUniqueItems((recommendedForYou || []).map(item => ({
              id: item.id,
              tmdbId: item.tmdbId,
              title: item.title,
              poster: item.poster,
              type: item.type,
              year: item.year,
              rating: item.rating
            })), 5) : []}
            onCardClick={handleCardClick}
          />
        )}

        {/* Orgulho Nacional - 5 capas da categoria nacional */}
        <ContentCarousel
          title="Orgulho Nacional 🇧🇷"
          items={!isLoadingOrgulho ? filterUniqueItems((orgulhoContent || []).map(item => ({
            id: item.id,
            tmdbId: item.tmdbId || item.id,
            title: item.title,
            poster: item.poster,
            type: item.type,
            year: item.year,
            rating: item.rating
          })), 5) : []}
          onCardClick={handleCardClick}
        />

        {/* Prepare a Pipoca - Fixa: 5 séries aleatórias */}
        <ContentCarousel
          title="Prepare a Pipoca 🍿"
          items={filterUniqueItems((pipocaSeries || []).map(item => ({
            id: item.id,
            tmdbId: item.tmdbId,
            title: item.title,
            poster: item.poster,
            type: item.type,
            year: item.year,
            rating: item.rating
          })), 5)}
          onCardClick={handleCardClick}
        />

        {/* Adrenalina Pura - 5 capas aleatórias das categorias Ação e Aventura */}
        <ContentCarousel
          title="Adrenalina Pura 💥"
          items={!isLoadingAdrenalina ? filterUniqueItems((adrenalinaContent || []).map(item => ({
            id: item.id,
            tmdbId: item.tmdbId || item.id,
            title: item.title,
            poster: item.poster,
            type: item.type,
            year: item.year,
            rating: item.rating
          })), 5) : []}
          onCardClick={handleCardClick}
        />

        {/* Como é bom ser criança - Inteligente: 5 capas aleatórias da categoria infantil */}
        <ContentCarousel
          title="Como é bom ser criança 🧸"
          items={!isLoadingInfantil ? filterUniqueItems((infantil || []).map(item => ({
            id: item.id,
            tmdbId: item.tmdbId,
            title: item.title,
            poster: item.poster,
            type: item.type,
            year: item.year,
            rating: item.rating,
            isNew: true
          })), 5) : []}
          onCardClick={handleCardClick}
        />

        {/* Clássicos Eternos - 5 capas aleatórias da categoria clássicos */}
        <ContentCarousel
          title="Clássicos Eternos 🎬"
          items={!isLoadingClassicos ? filterUniqueItems((classicosContent || []).map(item => ({
            id: item.id,
            tmdbId: item.tmdbId || item.id,
            title: item.title,
            poster: item.poster,
            type: item.type,
            year: item.year,
            rating: item.rating
          })), 5) : []}
          onCardClick={handleCardClick}
        />

        {/* Vencedores de Oscar - Inteligente: 5 capas de conteúdos premiados desde 2000 */}
        <ContentCarousel
          title="Vencedores de Oscar 🏆"
          items={!isLoadingOscar ? filterUniqueItems((oscarWinners || []).map(item => ({
            id: item.id,
            title: item.title,
            poster: item.poster,
            type: item.type,
            year: `Oscar ${item.oscarYear || item.year}`,
            rating: item.rating,
            isNew: true
          })), 5) : []}
          onCardClick={handleCardClick}
        />

        {/* CineRiso - 5 capas de comédia: 4 filmes e 1 série */}
        <ContentCarousel
          title="CineRiso 😂"
          items={!isLoadingCineRiso ? (cineRisoContent || []).slice(0, 5).map(item => ({
            id: item.id,
            tmdbId: item.tmdbId || item.id,
            title: item.title,
            poster: item.poster,
            type: item.type,
            year: item.year,
            rating: item.rating,
            isNew: true
          })) : []}
          onCardClick={handleCardClick}
        />

        {/* Mentes Criminosas - 5 capas aleatórias das categorias crime e policial */}
        <ContentCarousel
          title="Mentes Criminosas 🔪"
          items={!isLoadingMentes ? filterUniqueItems((mentesContent || []).map(item => ({
            id: item.id,
            tmdbId: item.tmdbId || item.id,
            title: item.title,
            poster: item.poster,
            type: item.type,
            year: item.year,
            rating: item.rating
          })), 5) : []}
          onCardClick={handleCardClick}
        />

        {/* Histórias de Esperança - 5 capas da categoria religioso */}
        <ContentCarousel
          title="Histórias de Esperança ✨"
          items={!isLoadingHistorias ? filterUniqueItems((historiasContent || []).map(item => ({
            id: item.id,
            tmdbId: item.tmdbId || item.id,
            title: item.title,
            poster: item.poster,
            type: item.type,
            year: item.year,
            rating: item.rating
          })), 5) : []}
          onCardClick={handleCardClick}
        />

        {/* Poderia ser melhor! - 5 capas com piores notas do TMDB */}
        <ContentCarousel
          title={isUsingFallback ? "Para explorar! 🎬" : "Poderia ser melhor! 😬"}
          items={!isLoadingWorstRated ? filterUniqueItems((worstRatedContent || []).map(item => ({
            id: item.id,
            tmdbId: item.tmdb_id,
            title: item.title,
            poster: item.poster,
            type: item.type,
            year: item.year,
            rating: item.rating,
            isNew: true
          })), 5) : []}
          onCardClick={handleCardClick}
        />

        {/* Ritmo & Emoção - 5 capas da categoria musical */}
        <ContentCarousel
          title="Ritmo & Emoção 🎵"
          items={!isLoadingRitmo ? filterUniqueItems((ritmoContent || []).map(item => ({
            id: item.id,
            tmdbId: item.tmdbId || item.id,
            title: item.title,
            poster: item.poster,
            type: item.type,
            year: item.year,
            rating: item.rating
          })), 5) : []}
          onCardClick={handleCardClick}
        />

        {/* Baseado em Fatos Reais - 4 filmes e 1 série da categoria documentário */}
        <ContentCarousel
          title="Baseado em Fatos Reais 📜"
          items={!isLoadingBaseadoEmFatos ? filterUniqueItems((baseadoEmFatosContent || []).map(item => ({
            id: item.id,
            tmdbId: item.tmdbId || item.id,
            title: item.title,
            poster: item.poster,
            type: item.type,
            year: item.year,
            rating: item.rating,
            isNew: true
          })), 5) : []}
          onCardClick={handleCardClick}
        />

        {/* Prepare-se para o Medo - 5 capas da categoria terror */}
        <ContentCarousel
          title="Prepare-se para o Medo 👻"
          items={!isLoadingPrepareParaMedo ? filterUniqueItems((prepareParaMedoContent || []).map(item => ({
            id: item.id,
            tmdbId: item.tmdbId || item.id,
            title: item.title,
            poster: item.poster,
            type: item.type,
            year: item.year,
            rating: item.rating,
            isNew: true
          })), 5) : []}
          onCardClick={handleCardClick}
        />

        {/* Travesseiro e Edredon - Inteligente: 5 capas de conteúdos relaxantes/calmos */}
        <ContentCarousel
          title="Travesseiro e Edredon 🌙"
          items={!isLoadingTravesseiro ? filterUniqueItems((travesseiroContent || []).map(item => ({
            id: item.id,
            title: item.title,
            poster: item.poster,
            type: item.type,
            year: item.year,
            rating: item.rating,
            isNew: true
          })), 5) : []}
          onCardClick={handleCardClick}
        />

        {/* Cine Noite - Seção 18+ (23:58 - 05:59) - ÚLTIMA SEÇÃO */}
        {isCineNoiteVisible && <CineNoiteSection onCardClick={handleCardClick} />}
      </div>
    </div>
  );
};

export default PremiumHome;
