import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug, getProducts } from "@/services/product.service";
import { ProductPageClient } from "./ProductPageClient";

export async function generateStaticParams() {
  const { products } = await getProducts({ limit: 500 });
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: "Product Not Found — EcoMarket" };
  }

  return {
    title: `${product.title} — EcoMarket`,
    description: product.shortDescription ?? product.description,
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return <ProductPageClient slug={slug} />;
}
