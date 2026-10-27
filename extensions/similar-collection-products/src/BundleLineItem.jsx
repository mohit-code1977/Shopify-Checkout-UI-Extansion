import "@shopify/ui-extensions/preact";
import { render, Fragment } from "preact";
import { useEffect, useState } from "preact/hooks";

export default function extension() {
  render(<BundleLineItem />, document.body);
}

const PRODUCT_IMAGE_QUERY = `
  query GetProductImage($query: String!) {
    products(first: 1, query: $query) {
      nodes {
        id
        title
        featuredImage {
          url
          altText
        }
        variants(first: 10) {
          nodes {
            id
            title
            image {
              url
              altText
            }
          }
        }
      }
    }
  }
`;

/**
 * Safely extracts property values whether they are saved with or without a leading underscore.
 * @param {Record<string, string | undefined>} map
 * @param {string} baseKey
 */
function getProp(map, baseKey) {
  return (
    map[`_${baseKey}`] ??
    map[baseKey] ??
    map[`_${baseKey.toLowerCase()}`] ??
    map[baseKey.toLowerCase()]
  );
}

/**
 * Reads bundle info from cart line attributes.
 * Supports both public keys ("Product 1", "Bundle Name", "Bundle Price", "Original Price", "Discount")
 * and private keys ("_Product 1", "_Bundle Name", etc.).
 * Returns null if the cart line is not a bundle.
 * @param {{ key: string, value?: string }[] | undefined} attributes
 */
function readBundle(attributes) {
  const map = Object.fromEntries(
    (attributes ?? []).map(({ key, value }) => [key, value]),
  );

  const isBundle =
    map["_bundle"] === "true" ||
    map["bundle"] === "true" ||
    Boolean(getProp(map, "Bundle Name"));

  if (!isBundle) {
    return null;
  }

  const items = [];

  for (let i = 1; ; i++) {
    const title = getProp(map, `Product ${i}`);
    if (!title) break;

    items.push({
      title,
      variant: getProp(map, `Variant ${i}`) || "",
      image: getProp(map, `Product Image ${i}`) || "",
    });
  }

  return {
    name: getProp(map, "Bundle Name") || "Bundle",
    items,
    discount: getProp(map, "Discount"),
    originalPrice: getProp(map, "Original Price"),
    bundlePrice: getProp(map, "Bundle Price"),
    bundleImage: getProp(map, "Bundle Image") || getProp(map, "Image") || "",
  };
}

function BundleLineItem() {
  // Merchant setting in Checkout Editor (configured in shopify.extension.toml)
  const [settings, setSettings] = useState(shopify.settings?.value ?? {});

  // Cart line reactive signal
  const [line, setLine] = useState(shopify.target?.value);

  // Storefront images cache
  const [productImages, setProductImages] = useState(
    /** @type {Record<string, string>} */ ({}),
  );

  useEffect(() => {
    if (!shopify.settings?.subscribe) return;
    return shopify.settings.subscribe((updatedSettings) => {
      setSettings(updatedSettings);
    });
  }, []);

  useEffect(() => {
    if (!shopify.target?.subscribe) return;
    return shopify.target.subscribe((updatedLine) => {
      setLine(updatedLine);
    });
  }, []);

  // When merchant disables bundle details via settings checkbox, render nothing
  const isEnabled = settings.enable_bundle_details !== false;
  if (!isEnabled) {
    return null;
  }

  const bundle = readBundle(line?.attributes);

  // Normal (non-bundle) products: render nothing
  if (!bundle) {
    return null;
  }

  // Asynchronously fetch missing product images via Storefront API if needed
  useEffect(() => {
    let cancelled = false;
    if (!bundle?.items?.length) return;

    const itemsNeedingImage = bundle.items.filter(
      (item) => !item.image && item.title && !productImages[item.title],
    );

    if (itemsNeedingImage.length === 0) return;

    async function fetchImages() {
      try {
        const results = await Promise.all(
          itemsNeedingImage.map(async (item) => {
            const sanitizedTitle = item.title.replace(/["\\]/g, "");
            let res = await shopify.query(PRODUCT_IMAGE_QUERY, {
              variables: { query: `title:"${sanitizedTitle}"` },
            });

            let product = res?.data?.products?.nodes?.[0];
            if (!product) {
              const fallbackRes = await shopify.query(PRODUCT_IMAGE_QUERY, {
                variables: { query: sanitizedTitle },
              });
              product = fallbackRes?.data?.products?.nodes?.[0];
            }

            const variantObj =
              product?.variants?.nodes?.find(
                (v) => v.title === item.variant && v.title !== "Default Title",
              ) ||
              product?.variants?.nodes?.find((v) => v.title === "Default Title") ||
              product?.variants?.nodes?.[0];

            const imageUrl =
              variantObj?.image?.url || product?.featuredImage?.url || "";

            return { title: item.title, imageUrl };
          }),
        );

        if (!cancelled) {
          setProductImages((prev) => {
            const next = { ...prev };
            for (const { title, imageUrl } of results) {
              if (imageUrl) next[title] = imageUrl;
            }
            return next;
          });
        }
      } catch (err) {
        console.warn("Could not query Storefront API for bundle images:", err);
      }
    }

    fetchImages();

    return () => {
      cancelled = true;
    };
  }, [bundle?.items]);

  return (
    <s-box
      padding="small"
      border="base"
      borderRadius="base"
      background="subdued"
    >
      <s-stack gap="small">
        {/* Header: Optional Bundle Image, Bundle Title, Discount Badge, Prices */}
        <s-stack
          direction="inline"
          gap="small"
          alignItems="center"
          justifyContent="space-between"
        >
          <s-stack direction="inline" gap="small" alignItems="center">
            {bundle.bundleImage && (
              <s-product-thumbnail
                src={bundle.bundleImage}
                alt={bundle.name}
                size="small"
              />
            )}
            <s-text type="strong">{bundle.name}</s-text>
            {bundle.discount && (
              <s-badge tone="success">{bundle.discount}</s-badge>
            )}
          </s-stack>

          {(bundle.bundlePrice || bundle.originalPrice) && (
            <s-stack direction="inline" gap="small-100" alignItems="center">
              {bundle.originalPrice && (
                <s-text type="redundant" color="subdued">
                  {bundle.originalPrice}
                </s-text>
              )}
              {bundle.bundlePrice && (
                <s-text type="strong">{bundle.bundlePrice}</s-text>
              )}
            </s-stack>
          )}
        </s-stack>

        {/* Expandable/Collapsible Included Products List */}
        {bundle.items.length > 0 && (
          <s-details defaultOpen>
            <s-summary>
              <s-text color="subdued" type="small">
                Included products ({bundle.items.length})
              </s-text>
            </s-summary>

            <s-stack gap="small" paddingBlockStart="small-200">
              {bundle.items.map((item, index) => {
                const imageUrl = item.image || productImages[item.title] || "";

                return (
                  <Fragment key={`${item.title}-${index}`}>
                    {index > 0 && <s-divider />}

                    <s-grid
                      gridTemplateColumns="auto 1fr"
                      alignItems="center"
                      columnGap="small"
                    >
                      {/* Product Thumbnail or Fallback Icon */}
                      {imageUrl ? (
                        <s-product-thumbnail
                          src={imageUrl}
                          alt={item.title}
                          size="small"
                        />
                      ) : (
                        <s-box
                          inlineSize="44px"
                          blockSize="44px"
                          border="base"
                          borderRadius="base"
                          background="subdued"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <s-icon type="product" />
                        </s-box>
                      )}

                      {/* Product Title and Variant */}
                      <s-stack direction="block" gap="none">
                        <s-text type="strong">{item.title}</s-text>
                        {item.variant && item.variant !== "Default Title" && (
                          <s-text color="subdued" type="small">
                            {item.variant}
                          </s-text>
                        )}
                      </s-stack>
                    </s-grid>
                  </Fragment>
                );
              })}
            </s-stack>
          </s-details>
        )}
      </s-stack>
    </s-box>
  );
}
