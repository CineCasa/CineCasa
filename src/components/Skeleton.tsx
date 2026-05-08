import React from 'react';

// ── Base skeleton ──────────────────────────────────────────────
const pulse = `
  @keyframes skeletonPulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 0.8; }
  }
`;

function Bone({ width = '100%', height = 16, radius = 8, style = {} }: {
  width?: string | number; height?: string | number; radius?: number; style?: React.CSSProperties;
}) {
  return (
    <>
      <style>{pulse}</style>
      <div style={{
        width, height, borderRadius: radius,
        background: 'rgba(255,255,255,0.08)',
        animation: 'skeletonPulse 1.6s ease-in-out infinite',
        flexShrink: 0,
        ...style,
      }} />
    </>
  );
}

// ── Card de conteúdo (poster 2:3) ─────────────────────────────
export function ContentCardSkeleton({ width = 140 }: { width?: number }) {
  return (
    <div style={{ width, flexShrink: 0 }}>
      <Bone width={width} height={width * 1.5} radius={12} style={{ marginBottom: 8 }} />
      <Bone width="85%" height={12} radius={4} style={{ marginBottom: 6 }} />
      <Bone width="50%" height={10} radius={4} />
    </div>
  );
}

// ── Carrossel de cards ────────────────────────────────────────
export function CarouselSkeleton({ count = 8, cardWidth = 140 }: { count?: number; cardWidth?: number }) {
  return (
    <div style={{ padding: '0 0 8px' }}>
      <Bone width={160} height={18} radius={6} style={{ marginBottom: 16 }} />
      <div style={{ display: 'flex', gap: 12, overflow: 'hidden' }}>
        {Array.from({ length: count }).map((_, i) => (
          <ContentCardSkeleton key={i} width={cardWidth} />
        ))}
      </div>
    </div>
  );
}

// ── Hero banner ───────────────────────────────────────────────
export function HeroBannerSkeleton() {
  return (
    <div style={{ position: 'relative', height: 'min(60vw, 520px)', background: 'rgba(255,255,255,0.04)', borderRadius: 0, overflow: 'hidden' }}>
      <style>{pulse}</style>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.04)', animation: 'skeletonPulse 1.6s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', bottom: 80, left: 28, maxWidth: 500 }}>
        <Bone width={80} height={22} radius={12} style={{ marginBottom: 16 }} />
        <Bone width="70%" height={40} radius={8} style={{ marginBottom: 12 }} />
        <Bone width="90%" height={14} radius={4} style={{ marginBottom: 8 }} />
        <Bone width="75%" height={14} radius={4} style={{ marginBottom: 20 }} />
        <div style={{ display: 'flex', gap: 12 }}>
          <Bone width={140} height={44} radius={16} />
          <Bone width={100} height={44} radius={16} />
        </div>
      </div>
    </div>
  );
}

// ── Tela de home completa ──────────────────────────────────────
export function HomeSkeleton() {
  return (
    <div style={{ background: '#070A10', minHeight: '100vh' }}>
      <HeroBannerSkeleton />
      <div style={{ padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 40 }}>
        <CarouselSkeleton count={7} />
        <CarouselSkeleton count={7} />
        <CarouselSkeleton count={7} />
      </div>
    </div>
  );
}

// ── Tela de detalhes ──────────────────────────────────────────
export function DetailsSkeleton() {
  return (
    <div style={{ background: '#070A10', minHeight: '100vh' }}>
      <Bone width="100%" height="min(56vw, 560px)" radius={0} />
      <div style={{ padding: '24px 28px' }}>
        <Bone width="60%" height={36} radius={8} style={{ marginBottom: 16 }} />
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <Bone width={60} height={20} radius={10} />
          <Bone width={40} height={20} radius={10} />
          <Bone width={80} height={20} radius={10} />
        </div>
        <Bone width="100%" height={14} radius={4} style={{ marginBottom: 8 }} />
        <Bone width="90%" height={14} radius={4} style={{ marginBottom: 8 }} />
        <Bone width="75%" height={14} radius={4} style={{ marginBottom: 24 }} />
        <div style={{ display: 'flex', gap: 12 }}>
          <Bone width={160} height={48} radius={16} />
          <Bone width={120} height={48} radius={16} />
        </div>
      </div>
    </div>
  );
}

// ── Grid de resultados de busca ───────────────────────────────
export function SearchSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 16, padding: '24px 16px' }}>
      {Array.from({ length: count }).map((_, i) => <ContentCardSkeleton key={i} />)}
    </div>
  );
}

// ── Perfil ────────────────────────────────────────────────────
export function ProfileSkeleton() {
  return (
    <div style={{ background: '#000', minHeight: '100vh', padding: '0 0 80px' }}>
      <Bone width="100%" height={200} radius={0} />
      <div style={{ padding: '60px 24px 0' }}>
        <Bone width={180} height={26} radius={8} style={{ marginBottom: 12 }} />
        <Bone width={120} height={14} radius={4} style={{ marginBottom: 20 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 24 }}>
          {Array.from({ length: 4 }).map((_, i) => <Bone key={i} height={80} radius={12} />)}
        </div>
        <Bone width="100%" height={60} radius={12} style={{ marginBottom: 20 }} />
        <CarouselSkeleton count={4} cardWidth={140} />
      </div>
    </div>
  );
}

// ── Favorites ────────────────────────────────────────────────
export function FavoritesSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div style={{ padding: '80px 24px 24px' }}>
      <Bone width={160} height={28} radius={8} style={{ marginBottom: 24 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 16 }}>
        {Array.from({ length: count }).map((_, i) => <ContentCardSkeleton key={i} />)}
      </div>
    </div>
  );
}

export default Bone;
