import baseProducts from "./products.json";
import staffProducts from "./products-admin.json";

const merged = new Map(baseProducts.map((product) => [product.id, product]));
for (const product of staffProducts) {
  if (product.active === false) {
    merged.delete(product.id);
    continue;
  }
  merged.set(product.id, { ...merged.get(product.id), ...product });
}

export const products = [...merged.values()];
export const categories = [
  "All watches",
  "Classic",
  "Everyday",
  "Sport",
  "Digital",
  "Couple",
];

export const money = (amount) =>
  `BDT ${Number(amount || 0).toLocaleString("en-BD")}`;
