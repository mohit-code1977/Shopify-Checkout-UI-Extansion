import type {
  CartTransformRunInput,
  CartTransformRunResult,
  Operation,
} from "../generated/api";

const NO_CHANGES: CartTransformRunResult = {
  operations: [],
};

const DEFAULT_PARENT_VARIANT_ID = "gid://shopify/ProductVariant/50773507965026";

function formatGid(id: string, type = "ProductVariant"): string {
  if (id.startsWith("gid://shopify/")) {
    return id;
  }
  return `gid://shopify/${type}/${id}`;
}

export function cleanShopifyCdnImageUrl(rawUrl: string): string | null {
  if (!rawUrl || typeof rawUrl !== "string") {
    return null;
  }
  let url = rawUrl.trim();
  if (url.startsWith("//")) {
    url = `https:${url}`;
  }
  const isShopifyCdn =
    url.startsWith("https://cdn.shopify.com/") ||
    url.startsWith("http://cdn.shopify.com/") ||
    /^https?:\/\/[^\/]+\.myshopify\.com\//.test(url);

  if (!isShopifyCdn) {
    return null;
  }

  // Remove legacy file resizing suffix before extension (e.g., _800x800.jpg, _grande.png)
  url = url.replace(
    /_(?:pico|icon|thumb|small|compact|medium|large|grande|original|1024x1024|2048x2048|master|(?:\d+x\d*)|(?:x\d+))(?=\.[a-zA-Z0-9]+(?:\?|$))/i,
    ""
  );

  // Remove resizing query parameters: width, height, crop
  url = url.replace(/([?&])(?:width|height|crop)=[^&#]*/gi, "$1");
  // Clean up any double delimiters or trailing delimiter
  url = url.replace(/[?&]&+/g, "&").replace(/\?&/, "?").replace(/[?&]$/, "");

  return url;
}

export function cartTransformRun(input: CartTransformRunInput): CartTransformRunResult {
  const operations: Operation[] = [];

  // Group cart lines by _bundle_id
  const bundleGroups: Record<string, typeof input.cart.lines> = {};

  for (const line of input.cart.lines) {
    const bundleId = line.bundleId?.value?.trim();
    if (!bundleId) continue;

    if (!bundleGroups[bundleId]) {
      bundleGroups[bundleId] = [];
    }
    bundleGroups[bundleId].push(line);
  }

  for (const [bundleId, lines] of Object.entries(bundleGroups)) {
    // A bundle must consist of at least 2 components
    if (lines.length < 2) {
      continue;
    }

    const firstLine = lines[0];
    const expectedCountStr = firstLine.bundleCount?.value?.trim();
    if (expectedCountStr) {
      const expectedCount = parseInt(expectedCountStr, 10);
      if (!isNaN(expectedCount) && expectedCount > 0 && lines.length !== expectedCount) {
        // Incomplete bundle in cart - do not merge
        continue;
      }
    }

    // Determine parent variant ID
    const rawParentId = firstLine.bundleParentId?.value?.trim();
    const parentVariantId = rawParentId
      ? formatGid(rawParentId)
      : DEFAULT_PARENT_VARIANT_ID;

    // Determine discount percentage safely
    let discountPercent = 0;
    const rawDiscount = firstLine.bundleDiscount?.value?.trim();
    if (rawDiscount) {
      const parsed = parseFloat(rawDiscount.replace("%", ""));
      if (!isNaN(parsed) && parsed > 0 && parsed <= 100) {
        discountPercent = parsed;
      }
    }

    const bundleTitle = firstLine.bundleTitle?.value?.trim() || "Bundle";

    // Extract bundle image from component line attributes if present
    const rawBundleImage = firstLine.bundleImage?.value?.trim();
    let imageOverride: { url: string } | undefined = undefined;

    if (rawBundleImage) {
      const cleanedUrl = cleanShopifyCdnImageUrl(rawBundleImage);
      if (cleanedUrl) {
        imageOverride = { url: cleanedUrl };
      }
    }

    // Calculate real catalog original and discounted prices from Shopify component lines
    let totalComponentPrice = 0;
    for (const line of lines) {
      const unitPrice = parseFloat(line.cost.amountPerQuantity.amount) || 0;
      totalComponentPrice += unitPrice * line.quantity;
    }

    const discountedPrice = discountPercent > 0
      ? totalComponentPrice * (1 - discountPercent / 100)
      : totalComponentPrice;

    // Build attributes to attach to the merged parent line
    const attributes: Array<{ key: string; value: string }> = [
      { key: "_bundle", value: "true" },
      { key: "_Bundle Name", value: bundleTitle },
      { key: "_bundle_id", value: bundleId },
      { key: "_Original Price", value: `$${totalComponentPrice.toFixed(2)}` },
      { key: "_Bundle Price", value: `$${discountedPrice.toFixed(2)}` },
    ];

    if (imageOverride?.url) {
      attributes.push({ key: "_bundle_image", value: imageOverride.url });
    } else if (rawBundleImage) {
      attributes.push({ key: "_bundle_image", value: rawBundleImage });
    }

    if (discountPercent > 0) {
      attributes.push({ key: "_Discount", value: `${discountPercent}% OFF` });
    }

    lines.forEach((line, idx) => {
      if (line.merchandise.__typename === "ProductVariant") {
        attributes.push({
          key: `_Product ${idx + 1}`,
          value: line.merchandise.product.title,
        });
        attributes.push({
          key: `_Variant ${idx + 1}`,
          value: line.merchandise.title || "Default Title",
        });
      }
    });

    const priceAdjustment = discountPercent > 0
      ? {
          percentageDecrease: {
            value: discountPercent.toString(),
          },
        }
      : undefined;

    operations.push({
      linesMerge: {
        parentVariantId,
        cartLines: lines.map((line) => ({
          cartLineId: line.id,
          quantity: line.quantity,
        })),
        price: priceAdjustment,
        image: imageOverride,
        title: bundleTitle,
        attributes,
      },
    });
  }

  if (operations.length === 0) {
    return NO_CHANGES;
  }

  return { operations };
}