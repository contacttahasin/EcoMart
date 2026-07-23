import Navbar from "./components/Navbar";
import Hero from "./components/home/Hero";
import CuratedCollections from "./components/home/CuratedCollections";
import TopRatedVendors from "./components/home/TopRatedVendors";
import NewArrivals from "./components/home/NewArrivals";
import JoinSustainable from "./components/home/JoinSustainable";
import Footer from "./components/layout/Footer";
import ProductGrid from "./components/products/ProductGrid";

export default function Page() {
  return (
    <>
      <Navbar />
      <Hero />
      <CuratedCollections />
      <TopRatedVendors />
      <NewArrivals />

      

      <JoinSustainable />
      <Footer />
    </>
  );
}
