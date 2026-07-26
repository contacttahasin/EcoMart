import { notFound } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/layout/Footer";
import ProductGrid from "@/app/components/products/ProductGrid";
import { VendorProfileHeader } from "@/app/components/vendors/VendorProfileHeader";
import { fetchVendorBySlug } from "@/services/public-vendor.service";

export default async function VendorProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const vendor = await fetchVendorBySlug(slug);

  if (!vendor) {
    notFound();
  }

  return (
    <>
      <Navbar />
      <main className="w-full bg-surface py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <VendorProfileHeader vendor={vendor} />

          <section className="mt-10">
            <h2 className="mb-6 text-2xl font-bold text-foreground">Products by {vendor.shopName}</h2>
            <ProductGrid
              filters={{ categories: [], vendors: [vendor.id], ratings: [], price: { min: 0, max: Number.MAX_SAFE_INTEGER } }}
            />
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
