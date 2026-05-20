import { ArrowRight } from "lucide-react";
import { Link } from "react-router";

import { type Category, useCategories } from "@/features/catalog";

const STATIC_CATEGORIES = [
  {
    id: "sua",
    name: "Gỗ Sưa",
    description: "32 tác phẩm",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBnF9eFjdmcrZauI_L4Ya7vbfBYFdN4iDI9wAgq_gppVth3EPH5VnnY0nXoDXXx6Px_AY-vPxq7eqST7YeHK7ouHacBcQfA2-B5QhTVnvFjbNvYNYKyE6mfwsMcC3VQl6lNfa7NnznwZgSX1Gsuq6UrBHKqj8D832hAO4eQC3b7OgCwMC0bIjFP19DO4DOOp4uvoR8JmtUoXhtNQilzes-TFBuaDVh3M6-rrzSdVSr_f5QUJzFMzhck7Wz-EdTaO-Ulhd0Uqbyf_CJw",
  },
  {
    id: "huong",
    name: "Gỗ Hương",
    description: "58 tác phẩm",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCYR2M2icNmiI4IOWg4W9LA4eI6d7h_8iOrpr1of96hb8mwPDx94gqRWicaDRRXZgS6yapB5yn2NhrFSKMnCsbwxVPUaucL4rRVe_L4l8Jn4aK6FwDdvdoqhEBKPc5CI5wTc0RXphmnj9M4o91fI4LNPf_LrBVuYLyL4GDdY73TDz0HtBtSmY4_46lsnAe2qrTmth99TNG5UrxtVos6xuIf4Emp8okjV9s5jWjj9IlFezkBtZK6s1MjI44tj31tUlnC2O5HFBcBuweo",
  },
  {
    id: "mun",
    name: "Gỗ Mun",
    description: "14 tác phẩm",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAQ90HF0hjAyLvT-u5a6sUC_3GloOmb99pi0FL-hq1ACUNGkgpY3i2xz0FcfNR2okhVwZM6dsNGL-qwyJQMOD7ECpqu3d0gI3dmffjYB_j8SgtZY8APsFl6D-jA5u2e7JFRat58WnfScb0C9VygtbH9ZFr_Li6l04rvXYlzIXI62PzntN0k9CKKKy0M6U9pq_UvbMbXpkmVfZ7KZ08q0n8PyXDF8Tgyv2Xy2NhF_pHCch2I4lI7F-6svW-RgEtG1smqWiW2UrJfleod",
  },
  {
    id: "luc-binh",
    name: "Lục Bình",
    description: "21 tác phẩm",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA3_Lj8p1d19euu0JMn4HYeMi8ZMcEAwStQnFL3ez_wzWkOtZC3NBPlq0A3tuHTtwC2ao437VydUmDMQRgAOHVc6OIe0pHKbCdJ5ZsyvqHl6PLhgxXYJhEGFEOOQsHYChk3N_VCu9rPzfSKkRpZB5-49HV7GqYswmt5x3h32poBgnt8fPqMsGfrFRvmrfIcOLwQHayLXUhPOy2_-YEacJ-tjJV1e_xgCv4QeDRmFceJRS6jYKDntAm32IF3RuJG0DXrPNCckYwGYfcr",
  },
];

function toCategoryDisplay(cat: Category, index: number) {
  return {
    id: String(cat.id),
    name: cat.name,
    description: cat.description ?? "Tác phẩm thẩm định",
    imageUrl: STATIC_CATEGORIES[index % STATIC_CATEGORIES.length]!.imageUrl,
  };
}

export function CategoriesSection() {
  const { data: categories } = useCategories();

  const displayItems =
    categories && categories.length > 0
      ? categories.slice(0, 4).map(toCategoryDisplay)
      : STATIC_CATEGORIES;

  return (
    <section className="py-24">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="font-serif text-3xl font-bold text-foreground md:text-4xl">
            Danh mục nổi bật
          </h2>
          <Link
            to="/auctions"
            className="group hidden items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80 sm:inline-flex"
          >
            Xem tất cả
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {displayItems.map((item) => (
            <Link
              key={item.id}
              to="/auctions"
              className="group relative h-64 cursor-pointer overflow-hidden rounded-lg"
            >
              <img
                src={item.imageUrl}
                alt={item.name}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              <div className="absolute inset-0 flex items-end p-6">
                <div>
                  <h4 className="font-serif text-lg font-bold text-white">{item.name}</h4>
                  <p className="mt-0.5 text-xs uppercase tracking-widest text-primary/90">
                    {item.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
