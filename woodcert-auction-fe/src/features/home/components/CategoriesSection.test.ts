import { describe, expect, it } from "vitest";

import { getCategoryImage } from "./CategoriesSection";

describe("category image mapping", () => {
  it("maps the new flat seed category slugs", () => {
    expect(getCategoryImage("tuong-dieu-khac-go")).toContain("1606744824163");
    expect(getCategoryImage("tranh-phu-dieu-go")).toContain("1610701596007");
    expect(getCategoryImage("do-tho-tam-linh")).toContain("1596462502278");
    expect(getCategoryImage("binh-loc-binh-go")).toContain("1612196808214");
    expect(getCategoryImage("noi-that-nghe-thuat")).toContain("1538688525198");
    expect(getCategoryImage("go-canh-nu-lua")).toContain("1615873968403");
    expect(getCategoryImage("hop-khay-vat-pham-trang-tri")).toContain("1513519245088");
    expect(getCategoryImage("trang-suc-phu-kien-go")).toContain("1515562141207");
    expect(getCategoryImage("tac-pham-suu-tam")).toContain("1579783901586");
  });

  it("uses the shared default for unknown and khac slugs", () => {
    expect(getCategoryImage("khac")).toBe(getCategoryImage("unknown-slug"));
  });
});
