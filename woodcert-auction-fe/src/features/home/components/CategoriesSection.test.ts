import { describe, expect, it } from "vitest";

import { getCategoryImage } from "./CategoriesSection";

describe("category image mapping", () => {
  it("maps the four curated home-page categories", () => {
    expect(getCategoryImage("tuong-dieu-khac-go")).toContain("category-sculpture");
    expect(getCategoryImage("tranh-phu-dieu-go")).toContain("category-relief");
    expect(getCategoryImage("do-tho-tam-linh")).toContain("category-spiritual");
    expect(getCategoryImage("binh-loc-binh-go")).toContain("category-vases");
  });

  it("uses sculpture as a safe fallback for an unknown slug", () => {
    expect(getCategoryImage("unknown-slug")).toContain("category-sculpture");
  });
});
