const Footer = () => (
  <footer className="px-4 md:px-8 lg:px-12 py-10 mt-8 border-t border-border bg-black/50">
    <div className="max-w-6xl mx-auto">
      {/* Logo Centralizado */}
      <div className="flex justify-center mb-8">
        <img 
          src="/logo-transparent.png" 
          alt="CineCasa" 
          className="h-12 w-auto object-contain"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "/favicon.ico";
            target.className = "h-8 w-auto object-contain";
          }}
        />
      </div>
      
      {/* Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
        {["Termos de Uso", "Política de Privacidade", "Ajuda", "Dispositivos"].map((link) => (
          <button key={link} className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors text-left">
            {link}
          </button>
        ))}
        {["Central de Ajuda", "Sobre", "Carreiras", "Acessibilidade"].map((link) => (
          <button key={link} className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors text-left">
            {link}
          </button>
        ))}
      </div>
      
      {/* Copyright */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-white/5 pt-8">
        <div className="flex items-center gap-3">
          <img 
            src="/cinecasa-logo.png" 
            alt="CineCasa" 
            className="w-6 h-6 object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/logo.png'; // Fallback para logo padrão
            }}
          />
          <p className="text-xs text-muted-foreground/60">
            © {new Date().getFullYear()} Cinecasa. Todos os direitos reservados.
          </p>
        </div>
        <span className="text-[10px] font-bold text-white/30 tracking-[0.3em] uppercase">
          Entretenimento e lazer
        </span>
      </div>
    </div>
  </footer>
);

export default Footer;
