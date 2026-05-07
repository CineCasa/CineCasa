import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PremiumNavbar from '../components/PremiumNavbar';
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
import { useRecomendacoesExclusivas } from '../hooks/useRecomendacoesExclusivas';
import { useRecommendedForYou } from '../hooks/useRecommendedForYou';
import { useWatchlistSection } from '../hooks/useWatchlistSection';
import { useAuth } from '../components/AuthProvider';
import ContinueWatching from '../components/ContinueWatching';
import { BecauseYouWatchedRow } from '../components/BecauseYouWatchedRow';
import CineNoiteSection from '../components/CineNoiteSection';
import HeroBanner from '../components/HeroBanner';
const PremiumHome: React.FC = () => {
  const navigate = useNavigate();

  // Sempre inicia no topo da página (banner) quando a home é carregada
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const { items: continueWatchingItems, isLoading: isLoadingContinue, removeItem } = useContinueWatching();
  const { user } = useAuth();
  const { lancamentos, isLoading: isLoadingLancamentos } = useLancamentos(user?.email);
  const { recomendacoes, isLoading: isLoadingRecomendacoes, topGenres } = useRecomendacoesExclusivas(user?.email);
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
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute; // minutos desde meia-noite
  
  // Cine Noite: 23:58 - 05:59
  const isCineNoiteVisible = currentTime >= (23 * 60 + 58) || currentTime <= (5 * 60 + 59);

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


  const handleCardClick = (item: any) => {
    const typePath = item.type === 'movie' ? 'cinema' : 'series';
    // Usar o ID do banco de dados (prioridade) em vez do tmdbId
    const id = item.id || item.tmdbId;
    navigate(`/details/${typePath}/${id}`);
  };



  return (
    <div className="streaming-container min-h-screen bg-black pb-0 md:pb-0">
      {/* Hero Banner - fixo no topo, começa após a navbar */}
      <div className="pt-[56px] md:pt-[80px]">
        <HeroBanner pageType="home" />
      </div>

      {/* Continue Watching - Logo após o Banner */}
      {!isLoadingContinue ? (
        <div className="relative z-40 mt-6 mb-4">
          {continueWatchingItems.length > 0 ? (
            <ContinueWatching
              items={continueWatchingItems.slice(0, 5).map(item => ({
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
                // Bug #13 corrigido: onRemove agora chama removeItem do hook
                removeItem(id, type, episodeId);
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
            })), 5)}
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
        {/* Exclusivos para Você - Inteligente: baseado nos gêneros mais assistidos */}
        {user && !isLoadingRecomendacoes && recomendacoes.length > 0 && (
          <ContentCarousel
            title={`Exclusivos para Você${topGenres.length > 0 ? ` • ${topGenres.slice(0, 2).join(', ')}` : ''}`}
            items={filterUniqueItems((recomendacoes || []).map(item => ({
              id: item.id,
              tmdbId: item.tmdbId,
              title: item.title,
              poster: item.poster,
              type: item.type,
              year: item.year,
              rating: `${Math.round(item.matchScore * 10)}% compatível`,
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
