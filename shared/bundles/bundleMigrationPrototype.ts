/**
 * Native Fixed-Bundle Migration Prototype for Shopify
 *
 * This module provides the data models, validation logic, pricing calculations,
 * and GraphQL mutation generators to prototype migrating from Cart Transform merges
 * to Shopify native fixed bundles (productBundleCreate / requiresComponents).
 */

export interface ComponentOption {
  name: string;
  values: string[];
}

export interface ComponentVariant {
  id: string;
  title: string;
  price: number; // in dollars, e.g. 14.00
  selectedOptions: Record<string, string>;
  inventoryQuantity?: number;
}

export interface BundleComponentProduct {
  productId: string;
  title: string;
  quantity: number;
  options: ComponentOption[];
  variants: ComponentVariant[];
}

export interface BundleDefinition {
  id: string;
  title: string;
  handle: string;
  discountPercent: number;
  coverImageUrl: string;
  components: BundleComponentProduct[];
}

export interface BundleLimitValidation {
  totalVariants: number;
  maxComponentsPerVariant: number;
  maxVariantsAllowed: number;
  maxComponentsAllowed: number;
  isWithinLimits: boolean;
  errors: string[];
}

export interface NativeBundlePriceBreakdown {
  compareAtPrice: string; // e.g. "30.00"
  price: string;          // e.g. "27.00"
  savings: string;        // e.g. "3.00"
  discountPercent: number;
}

export interface NativeBundleVariant {
  title: string;
  price: string;
  compareAtPrice: string;
  selectedOptions: Record<string, string>;
  components: Array<{
    productVariantId: string;
    quantity: number;
  }>;
}

/**
 * Validate that a bundle's variant combinations and component counts
 * strictly adhere to Shopify's native bundle platform limits.
 *
 * Shopify Limits:
 * - Up to 100 variants per bundle product (standard product model)
 * - Up to 30 component variants per bundle variant
 */
export function validateBundleLimits(bundle: BundleDefinition): BundleLimitValidation {
  const errors: string[] = [];
  const maxVariantsAllowed = 100;
  const maxComponentsAllowed = 30;

  // Calculate combinations across unique option values
  let totalCombinations = 1;
  const consolidatedOptions: Record<string, Set<string>> = {};

  for (const component of bundle.components) {
    for (const opt of component.options) {
      if (!consolidatedOptions[opt.name]) {
        consolidatedOptions[opt.name] = new Set<string>();
      }
      for (const val of opt.values) {
        consolidatedOptions[opt.name].add(val);
      }
    }
  }

  const optionKeys = Object.keys(consolidatedOptions);
  if (optionKeys.length === 0) {
    totalCombinations = 1; // Default single-variant bundle
  } else {
    for (const key of optionKeys) {
      totalCombinations *= consolidatedOptions[key].size;
    }
  }

  const maxComponentsPerVariant = bundle.components.reduce(
    (sum, comp) => sum + comp.quantity,
    0
  );

  if (totalCombinations > maxVariantsAllowed) {
    errors.push(
      `Bundle variant combinations (${totalCombinations}) exceed Shopify product limit of ${maxVariantsAllowed}.`
    );
  }

  if (maxComponentsPerVariant > maxComponentsAllowed) {
    errors.push(
      `Bundle components per variant (${maxComponentsPerVariant}) exceed Shopify limit of ${maxComponentsAllowed}.`
    );
  }

  return {
    totalVariants: totalCombinations,
    maxComponentsPerVariant,
    maxVariantsAllowed,
    maxComponentsAllowed,
    isWithinLimits: errors.length === 0,
    errors
  };
}

/**
 * Calculate native bundle variant pricing based on component original catalog prices
 * and configured discount percentage.
 */
export function calculateNativeBundlePricing(
  components: Array<{ price: number; quantity: number }>,
  discountPercent: number
): NativeBundlePriceBreakdown {
  const totalOriginal = components.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const discountFactor = (100 - discountPercent) / 100;
  // Round to nearest cent
  const discounted = Math.round(totalOriginal * discountFactor * 100) / 100;
  const savings = Math.round((totalOriginal - discounted) * 100) / 100;

  return {
    compareAtPrice: totalOriginal.toFixed(2),
    price: discounted.toFixed(2),
    savings: savings.toFixed(2),
    discountPercent
  };
}

/**
 * Generate all native bundle variants with component mappings and pricing.
 */
export function generateNativeBundleVariants(bundle: BundleDefinition): NativeBundleVariant[] {
  // Check if all components have default variants only
  const hasOptions = bundle.components.some(c => c.options.length > 0);

  if (!hasOptions) {
    const compPricing = bundle.components.map(c => ({
      price: c.variants[0]?.price ?? 0,
      quantity: c.quantity
    }));
    const pricing = calculateNativeBundlePricing(compPricing, bundle.discountPercent);

    return [
      {
        title: "Default Title",
        price: pricing.price,
        compareAtPrice: pricing.compareAtPrice,
        selectedOptions: { Title: "Default Title" },
        components: bundle.components.map(c => ({
          productVariantId: c.variants[0]?.id ?? "",
          quantity: c.quantity
        }))
      }
    ];
  }

  // Multi-option cross-product matching
  const optionsMap: Record<string, string[]> = {};
  for (const comp of bundle.components) {
    for (const opt of comp.options) {
      if (!optionsMap[opt.name]) {
        optionsMap[opt.name] = [];
      }
      for (const val of opt.values) {
        if (!optionsMap[opt.name].includes(val)) {
          optionsMap[opt.name].push(val);
        }
      }
    }
  }

  const optNames = Object.keys(optionsMap);
  const cartesian = (arrays: string[][]): string[][] => {
    return arrays.reduce<string[][]>(
      (acc, curr) => acc.flatMap(a => curr.map(c => [...a, c])),
      [[]]
    );
  };

  const combinations = cartesian(optNames.map(name => optionsMap[name]));

  const variants: NativeBundleVariant[] = [];

  for (const combo of combinations) {
    const selectedOptions: Record<string, string> = {};
    optNames.forEach((name, i) => {
      selectedOptions[name] = combo[i];
    });

    const bundleComponents: Array<{ productVariantId: string; quantity: number }> = [];
    const compPricing: Array<{ price: number; quantity: number }> = [];
    let allAvailable = true;

    for (const comp of bundle.components) {
      // Find matching variant
      const match = comp.variants.find(v => {
        return Object.entries(v.selectedOptions).every(
          ([k, val]) => selectedOptions[k] === val
        );
      });

      if (match) {
        bundleComponents.push({
          productVariantId: match.id,
          quantity: comp.quantity
        });
        compPricing.push({
          price: match.price,
          quantity: comp.quantity
        });
      } else {
        allAvailable = false;
      }
    }

    if (allAvailable) {
      const pricing = calculateNativeBundlePricing(compPricing, bundle.discountPercent);
      const title = Object.values(selectedOptions).join(" / ");
      variants.push({
        title,
        price: pricing.price,
        compareAtPrice: pricing.compareAtPrice,
        selectedOptions,
        components: bundleComponents
      });
    }
  }

  return variants;
}

/**
 * Generate GraphQL Admin mutation payload for productBundleCreate.
 */
export function generateProductBundleCreateMutation(bundle: BundleDefinition) {
  const componentsInput = bundle.components.map(comp => {
    const optionSelections = comp.options.map(opt => ({
      componentOptionId: `gid://shopify/ProductOption/${opt.name.toLowerCase()}`,
      values: opt.values
    }));

    return {
      productId: comp.productId,
      quantity: comp.quantity,
      optionSelections
    };
  });

  return {
    query: `mutation productBundleCreate($input: ProductBundleCreateInput!) {
  productBundleCreate(input: $input) {
    productBundleOperation {
      id
      status
    }
    userErrors {
      field
      message
    }
  }
}`,
    variables: {
      input: {
        title: bundle.title,
        components: componentsInput
      }
    }
  };
}

/**
 * Generate comparison table comparing Cart Transform vs Native Bundle architecture.
 */
export function generateArchitectureComparison(bundle: BundleDefinition) {
  const limits = validateBundleLimits(bundle);
  const variants = generateNativeBundleVariants(bundle);
  const sampleVariant = variants[0];

  return {
    bundleTitle: bundle.title,
    discountConfigured: `${bundle.discountPercent}%`,
    samplePricing: {
      compareAtPrice: sampleVariant ? `$${sampleVariant.compareAtPrice}` : "$0.00",
      bundlePrice: sampleVariant ? `$${sampleVariant.price}` : "$0.00"
    },
    limits,
    comparisonDimensions: [
      {
        feature: "Storefront Add-to-Cart",
        cartTransformModel:
          "Pushes multiple component lines with custom internal properties (_bundle_id, _bundle_parent_id: '50773507965026').",
        nativeBundleModel:
          "Pushes single native bundle variant ID directly: { id: bundleVariantId, quantity: 1 }. Zero internal properties needed."
      },
      {
        feature: "Checkout Presentation",
        cartTransformModel:
          "Cart Transform Function executes merge operation on the fly, rendering a merged line item.",
        nativeBundleModel:
          "Natively handled by Shopify checkout. Shows bundle title, cover image, and expandable component items."
      },
      {
        feature: "Shopify Admin Order Details",
        cartTransformModel:
          "Decomposed by Shopify into separate component line items with redundant metadata properties.",
        nativeBundleModel:
          "Displays the Bundle Parent item with an expandable native 'Bundle components' subsection and individual component fulfillment tracking."
      },
      {
        feature: "Admin UI Extension Requirement",
        cartTransformModel:
          "Requires a custom Admin UI Extension / block to visually group lines.",
        nativeBundleModel:
          "Zero custom Admin UI blocks required. Fully native Shopify Admin behavior."
      },
      {
        feature: "Inventory Tracking",
        cartTransformModel:
          "Inventory is deducted from components when order is placed.",
        nativeBundleModel:
          "Native automatic allocation. Bundle variant inventory = min(component_inventory / quantity)."
      },
      {
        feature: "Price Calculation",
        cartTransformModel:
          "Dynamic percentage calculation at checkout time from live component prices.",
        nativeBundleModel:
          "Pre-calculated static variant price stored in catalog ($27.00 compare-at $30.00; $45.92 compare-at $56.00)."
      },
      {
        feature: "App Permission Scope",
        cartTransformModel:
          "write_cart_transforms (already granted).",
        nativeBundleModel:
          "write_products (required if created programmatically via app) OR official free Shopify Bundles App (no extra app scope needed)."
      }
    ]
  };
}
