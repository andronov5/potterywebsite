export type Product = {
  slug: string;
  number: string;
  name: string;
  description: string;
  price: number;
  tone: "peach" | "mint" | "blue" | "butter" | "lilac";
  images: { src: string; alt: string }[];
};

const placeholderPhotos = [
  {
    src: "/placeholders/product-front.svg",
    alt: "Temporary product photo placeholder, front view",
  },
  {
    src: "/placeholders/product-detail.svg",
    alt: "Temporary product photo placeholder, detail view",
  },
  {
    src: "/placeholders/product-studio.svg",
    alt: "Temporary product photo placeholder, studio view",
  },
];

const prices = [10, 15, 25, 10, 30, 40, 15];
const tones: Product["tone"][] = [
  "peach",
  "mint",
  "blue",
  "butter",
  "lilac",
  "peach",
  "mint",
];

export const products: Product[] = prices.map((price, index) => ({
  slug: `piece-${String(index + 1).padStart(2, "0")}`,
  number: String(index + 1).padStart(2, "0"),
  name: "Insert name here",
  description: "Insert description here.",
  price,
  tone: tones[index],
  images: [
    ...placeholderPhotos.slice(index % placeholderPhotos.length),
    ...placeholderPhotos.slice(0, index % placeholderPhotos.length),
  ],
}));

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(price);
}
