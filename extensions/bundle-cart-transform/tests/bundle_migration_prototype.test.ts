import { describe, test, expect } from "vitest";
import {
  BundleDefinition,
  validateBundleLimits,
  calculateNativeBundlePricing,
  generateNativeBundleVariants,
  generateProductBundleCreateMutation,
  generateArchitectureComparison
} from "../../../shared/bundles/bundleMigrationPrototype";

describe("Native Bundle Migration Prototype", () => {
  // Test case 1: Bundle Test Book
  const bundleTestBook: BundleDefinition = {
    id: "gid://shopify/Metaobject/bundle_test_book",
    title: "Bundle Test Book",
    handle: "bundle-test-book",
    discountPercent: 10,
    coverImageUrl: "https://cdn.shopify.com/s/files/1/0818/7271/5874/files/theme_cover_image.jpg",
    components: [
      {
        productId: "gid://shopify/Product/pen_01",
        title: "Charcoal Everyday Pen",
        quantity: 1,
        options: [
          {
            name: "Color",
            values: ["Charcoal", "Slate", "Navy"]
          }
        ],
        variants: [
          {
            id: "gid://shopify/ProductVariant/pen_charcoal",
            title: "Charcoal",
            price: 14.00,
            selectedOptions: { Color: "Charcoal" }
          },
          {
            id: "gid://shopify/ProductVariant/pen_slate",
            title: "Slate",
            price: 14.00,
            selectedOptions: { Color: "Slate" }
          },
          {
            id: "gid://shopify/ProductVariant/pen_navy",
            title: "Navy",
            price: 14.00,
            selectedOptions: { Color: "Navy" }
          }
        ]
      },
      {
        productId: "gid://shopify/Product/notebook_01",
        title: "Charcoal Everyday Notebook",
        quantity: 1,
        options: [
          {
            name: "Color",
            values: ["Charcoal", "Slate", "Navy"]
          }
        ],
        variants: [
          {
            id: "gid://shopify/ProductVariant/notebook_charcoal",
            title: "Charcoal",
            price: 16.00,
            selectedOptions: { Color: "Charcoal" }
          },
          {
            id: "gid://shopify/ProductVariant/notebook_slate",
            title: "Slate",
            price: 16.00,
            selectedOptions: { Color: "Slate" }
          },
          {
            id: "gid://shopify/ProductVariant/notebook_navy",
            title: "Navy",
            price: 16.00,
            selectedOptions: { Color: "Navy" }
          }
        ]
      }
    ]
  };

  // Test case 2: Bundle Daily Need Products
  const bundleDailyNeed: BundleDefinition = {
    id: "gid://shopify/Metaobject/bundle_daily_need",
    title: "Bundle Daily Need Products",
    handle: "bundle-daily-need-products",
    discountPercent: 18,
    coverImageUrl: "https://cdn.shopify.com/s/files/1/0818/7271/5874/files/daily-essentials-bundle.png",
    components: [
      {
        productId: "gid://shopify/Product/cap_01",
        title: "Classic Canvas Cap",
        quantity: 1,
        options: [
          {
            name: "Color",
            values: ["Black", "Olive"]
          }
        ],
        variants: [
          {
            id: "gid://shopify/ProductVariant/cap_black",
            title: "Black",
            price: 24.00,
            selectedOptions: { Color: "Black" }
          },
          {
            id: "gid://shopify/ProductVariant/cap_olive",
            title: "Olive",
            price: 24.00,
            selectedOptions: { Color: "Olive" }
          }
        ]
      },
      {
        productId: "gid://shopify/Product/tote_01",
        title: "Everyday Carry Tote",
        quantity: 1,
        options: [
          {
            name: "Color",
            values: ["Black", "Olive"]
          }
        ],
        variants: [
          {
            id: "gid://shopify/ProductVariant/tote_black",
            title: "Black",
            price: 32.00,
            selectedOptions: { Color: "Black" }
          },
          {
            id: "gid://shopify/ProductVariant/tote_olive",
            title: "Olive",
            price: 32.00,
            selectedOptions: { Color: "Olive" }
          }
        ]
      }
    ]
  };

  describe("Requirement 3 & 4: Bundle Test Book (10% discount)", () => {
    test("calculates exact test bundle price of $27.00 and compare-at $30.00", () => {
      const pricing = calculateNativeBundlePricing(
        [
          { price: 14.00, quantity: 1 },
          { price: 16.00, quantity: 1 }
        ],
        10
      );

      expect(pricing.compareAtPrice).toBe("30.00");
      expect(pricing.price).toBe("27.00");
      expect(pricing.savings).toBe("3.00");
      expect(pricing.discountPercent).toBe(10);
    });

    test("verifies all variant combinations can be represented within Shopify limits", () => {
      const validation = validateBundleLimits(bundleTestBook);
      expect(validation.isWithinLimits).toBe(true);
      expect(validation.totalVariants).toBe(3); // Consolidated Color option: 3 values
      expect(validation.totalVariants).toBeLessThanOrEqual(validation.maxVariantsAllowed);
      expect(validation.maxComponentsPerVariant).toBe(2);
      expect(validation.maxComponentsPerVariant).toBeLessThanOrEqual(validation.maxComponentsAllowed);
      expect(validation.errors).toHaveLength(0);
    });

    test("generates native bundle variants with component bindings", () => {
      const variants = generateNativeBundleVariants(bundleTestBook);
      expect(variants).toHaveLength(3);

      // Verify first variant
      const charcoalVariant = variants.find(v => v.title === "Charcoal");
      expect(charcoalVariant).toBeDefined();
      expect(charcoalVariant?.price).toBe("27.00");
      expect(charcoalVariant?.compareAtPrice).toBe("30.00");
      expect(charcoalVariant?.components).toEqual([
        { productVariantId: "gid://shopify/ProductVariant/pen_charcoal", quantity: 1 },
        { productVariantId: "gid://shopify/ProductVariant/notebook_charcoal", quantity: 1 }
      ]);
    });

    test("generates valid productBundleCreate GraphQL mutation payload", () => {
      const payload = generateProductBundleCreateMutation(bundleTestBook);
      expect(payload.variables.input.title).toBe("Bundle Test Book");
      expect(payload.variables.input.components).toHaveLength(2);
      expect(payload.variables.input.components[0].productId).toBe("gid://shopify/Product/pen_01");
      expect(payload.variables.input.components[1].productId).toBe("gid://shopify/Product/notebook_01");
    });
  });

  describe("Requirement 3 & 4: Bundle Daily Need Products (18% discount)", () => {
    test("calculates exact test bundle price of $45.92 and compare-at $56.00", () => {
      const pricing = calculateNativeBundlePricing(
        [
          { price: 24.00, quantity: 1 },
          { price: 32.00, quantity: 1 }
        ],
        18
      );

      // $56.00 * 0.82 = $45.92
      expect(pricing.compareAtPrice).toBe("56.00");
      expect(pricing.price).toBe("45.92");
      expect(pricing.savings).toBe("10.08");
      expect(pricing.discountPercent).toBe(18);
    });

    test("verifies variant combinations remain within native limits", () => {
      const validation = validateBundleLimits(bundleDailyNeed);
      expect(validation.isWithinLimits).toBe(true);
      expect(validation.totalVariants).toBe(2); // Consolidated Color: Black, Olive
      expect(validation.totalVariants).toBeLessThanOrEqual(100);
      expect(validation.maxComponentsPerVariant).toBe(2);
      expect(validation.maxComponentsPerVariant).toBeLessThanOrEqual(30);
    });

    test("generates native bundle variants with component bindings", () => {
      const variants = generateNativeBundleVariants(bundleDailyNeed);
      expect(variants).toHaveLength(2);

      const blackVariant = variants.find(v => v.title === "Black");
      expect(blackVariant).toBeDefined();
      expect(blackVariant?.price).toBe("45.92");
      expect(blackVariant?.compareAtPrice).toBe("56.00");
      expect(blackVariant?.components).toEqual([
        { productVariantId: "gid://shopify/ProductVariant/cap_black", quantity: 1 },
        { productVariantId: "gid://shopify/ProductVariant/tote_black", quantity: 1 }
      ]);
    });
  });

  describe("Requirement 5 & 6: Architecture Comparison", () => {
    test("produces side-by-side architecture comparison validating zero Admin UI block requirement", () => {
      const comp = generateArchitectureComparison(bundleTestBook);
      expect(comp.bundleTitle).toBe("Bundle Test Book");
      expect(comp.samplePricing.bundlePrice).toBe("$27.00");
      expect(comp.samplePricing.compareAtPrice).toBe("$30.00");

      const adminUiDim = comp.comparisonDimensions.find(
        d => d.feature === "Admin UI Extension Requirement"
      );
      expect(adminUiDim?.nativeBundleModel).toContain("Zero custom Admin UI blocks required");

      const orderDim = comp.comparisonDimensions.find(
        d => d.feature === "Shopify Admin Order Details"
      );
      expect(orderDim?.nativeBundleModel).toContain("Displays the Bundle Parent item");

      const scopeDim = comp.comparisonDimensions.find(
        d => d.feature === "App Permission Scope"
      );
      expect(scopeDim?.nativeBundleModel).toContain("write_products");
    });
  });
});
