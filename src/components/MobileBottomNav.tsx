import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Film, Tv, Bell } from 'lucide-react';
import { useEffect, useRef } from 'react';

export default function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const navRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { icon: Home, path: '/', label: 'Home' },
    { icon: Film, path: '/filmes', label: 'Filmes' },
    { icon: Tv, path: '/series', label: 'Séries' },
    { icon: Bell, path: '/notifications', label: 'Notificações' },
  ];

  useEffect(() => {
    // Implementar lógica de active state
    const handleNavClick = (clickedItem: HTMLElement) => {
      // Remover active de todos
      document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
      });
      // Adicionar active ao clicado
      clickedItem.classList.add('active');
    };

    // Adicionar event listeners
    const items = document.querySelectorAll('.nav-item');
    items.forEach(item => {
      item.addEventListener('click', () => handleNavClick(item));
    });

    return () => {
      // Cleanup
      items.forEach(item => {
        item.removeEventListener('click', () => handleNavClick(item));
      });
    };
  }, []);

  return (
    <>
      <style>{`
        /* ========================= */
        /* RESET */
        /* ========================= */
        
        .cinecasa-mobile-nav *{
          margin:0;
          padding:0;
          box-sizing:border-box;
        }
        
        .cinecasa-mobile-nav{
          background:#000;
          height:100vh;
          display:flex;
          justify-content:center;
          align-items:flex-end;
          padding-bottom:30px;
          font-family:'Inter', sans-serif;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 100;
          pointer-events: none;
        }
        
        .cinecasa-navbar-wrapper{
          pointer-events: auto;
        }
        
        /* ========================= */
        /* NAVBAR */
        /* ========================= */
        
        .cinecasa-navbar{
          position:relative;
          
          width:95%;
          max-width:520px;
          height:95px;
          
          display:flex;
          justify-content:space-around;
          align-items:center;
          
          padding:0 12px;
          
          border-radius:34px;
          
          background:
            linear-gradient(
              180deg,
              rgba(20,20,25,.96) 0%,
              rgba(5,5,8,.98) 100%
            );
          
          border:1px solid rgba(255,255,255,.08);
          
          box-shadow:
            inset 0 1px 1px rgba(255,255,255,.06),
            inset 0 -1px 1px rgba(255,255,255,.03),
            0 10px 30px rgba(0,0,0,.75),
            0 0 40px rgba(0,140,255,.08);
          
          backdrop-filter:blur(18px);
          
          overflow:visible;
        }
        
        /* brilho externo */
        
        .cinecasa-navbar::before{
          content:"";
          
          position:absolute;
          inset:0;
          
          border-radius:34px;
          
          background:
            linear-gradient(
              90deg,
              rgba(0,170,255,.10),
              transparent 30%,
              transparent 70%,
              rgba(0,170,255,.10)
            );
          
          pointer-events:none;
        }
        
        /* ========================= */
        /* ITENS */
        /* ========================= */
        
        .nav-item{
          position:relative;
          
          width:90px;
          height:90px;
          
          border:none;
          background:none;
          
          display:flex;
          flex-direction:column;
          justify-content:center;
          align-items:center;
          gap:10px;
          
          color:#b7bcc7;
          
          cursor:pointer;
          
          transition:.35s ease;
          
          z-index:2;
        }
        
        /* icones */
        
        .nav-item i{
          font-size:28px;
          
          transition:
            transform .35s ease,
            color .35s ease,
            text-shadow .35s ease;
        }
        
        /* legenda */
        
        .nav-item span{
          font-size:15px;
          font-weight:500;
          letter-spacing:.4px;
          
          transition:.35s ease;
        }
        
        /* ========================= */
        /* ITEM ATIVO */
        /* ========================= */
        
        .nav-item.active{
          transform:translateY(-28px);
        }
        
        /* botão central */
        
        .nav-item.active::before{
          content:"";
          
          position:absolute;
          
          width:110px;
          height:110px;
          
          border-radius:50%;
          
          background:
            radial-gradient(
              circle at center,
              rgba(0,180,255,.25) 0%,
              rgba(0,140,255,.15) 45%,
              rgba(0,90,255,.05) 65%,
              transparent 80%
            );
          
          z-index:-2;
        }
        
        /* circulo principal */
        
        .nav-item.active .active-glow{
          position:absolute;
          
          width:102px;
          height:102px;
          
          border-radius:50%;
          
          background:
            linear-gradient(
              180deg,
              rgba(25,25,35,.98),
              rgba(5,5,10,.98)
            );
          
          border:2px solid rgba(0,195,255,.9);
          
          box-shadow:
            0 0 12px rgba(0,195,255,.7),
            0 0 35px rgba(0,120,255,.35),
            inset 0 1px 3px rgba(255,255,255,.10),
            inset 0 -2px 8px rgba(0,0,0,.8);
          
          z-index:-1;
        }
        
        /* cor ativa */
        
        .nav-item.active i,
        .nav-item.active span{
          color:#1ad4ff;
          
          text-shadow:
            0 0 10px rgba(0,212,255,.9),
            0 0 25px rgba(0,140,255,.8);
        }
        
        /* ========================= */
        /* HOVER */
        /* ========================= */
        
        .nav-item:hover i{
          transform:translateY(-4px) scale(1.08);
          
          color:#e9f7ff;
          
          text-shadow:
            0 0 10px rgba(0,195,255,.5);
        }
        
        .nav-item:hover span{
          color:#fff;
        }
        
        /* ========================= */
        /* ANIMAÇÃO CLICK */
        /* ========================= */
        
        .nav-item:active i{
          transform:scale(.88);
        }
        
        /* ========================= */
        /* EFEITO FLUTUANTE */
        /* ========================= */
        
        @keyframes floating{
          0%{
            transform:translateY(0px);
          }
          
          50%{
            transform:translateY(-3px);
          }
          
          100%{
            transform:translateY(0px);
          }
        }
        
        .nav-item.active .active-glow{
          animation:floating 3s ease-in-out infinite;
        }
        
        /* ========================= */
        /* RESPONSIVO */
        /* ========================= */
        
        @media(max-width:480px){
          
          .cinecasa-navbar{
            height:88px;
          }
          
          .nav-item{
            width:75px;
          }
          
          .nav-item i{
            font-size:24px;
          }
          
          .nav-item span{
            font-size:13px;
          }
          
          .nav-item.active .active-glow{
            width:88px;
            height:88px;
          }
          
        }
      `}</style>
      
      <div className="cinecasa-mobile-nav md:hidden">
        <div className="cinecasa-navbar-wrapper">
          <nav className="cinecasa-navbar">
            {navItems.map(({ icon: Icon, path, label }) => {
              const isActive = location.pathname === path;
              return (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                >
                  {isActive && <div className="active-glow"></div>}
                  <Icon className="nav-icon" />
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
}
