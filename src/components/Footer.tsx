const Footer = () => (
  <footer className="px-4 md:px-8 lg:px-12 py-10 mt-8 border-t border-border">
    <div className="max-w-6xl mx-auto">
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
      <p className="text-xs text-muted-foreground/60">
        © 2025 Stream+. Todos os direitos reservados.
      </p>
    </div>
  </footer>
);

export default Footer;
