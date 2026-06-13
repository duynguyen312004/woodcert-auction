import type { CreateProductFormValues, ProductDetail } from "../types";
import type { UploadedImage } from "./ProductImageUploader";

export function toProductFormValues(product: ProductDetail): CreateProductFormValues {
  return {
    categoryId: product.category?.id ?? 0,
    title: product.title,
    description: product.description ?? "",
    material: product.material ?? "",
    dimensions: product.dimensions ?? "",
    weight: product.weight != null ? String(product.weight) : "",
  };
}

export function toUploadedImages(product: ProductDetail): UploadedImage[] {
  return product.images
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((image, index) => ({
      mediaId: image.mediaId,
      previewUrl: image.imageUrl,
      isPrimary: image.isPrimary,
      sortOrder: index,
      fileName: `product-image-${image.id}`,
    }));
}
