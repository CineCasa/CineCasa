import Navbar from "@/components/Navbar";
import HeroBanner from "@/components/HeroBanner";
import ContentRow from "@/components/ContentRow";
import Footer from "@/components/Footer";
import { categories } from "@/data/content";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroBanner />
        <div className="-mt-16 relative z-10 pt-4">
          {categories.map((cat) => (
            <ContentRow key={cat.id} category={cat} />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
