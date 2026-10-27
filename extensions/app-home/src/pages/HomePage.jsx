export default function HomePage() {
  return (
    <s-page heading="Checkout Product Recommendations">
      <s-button
        slot="primary-action"
        variant="primary"
        href="shopify:admin/settings/checkout"
      >
        Customize in Checkout Editor
      </s-button>

      {/* Main Status & Overview Section */}
      <s-section heading="Extension Status">
        <s-stack gap="base">
          <s-stack direction="inline" gap="small" alignItems="center">
            <s-badge tone="success">Active</s-badge>
            <s-text color="subdued">similar-collection-products</s-text>
          </s-stack>

          <s-paragraph>
            Your checkout extension is live. It dynamically inspects items in the buyer's checkout cart and recommends available products from the exact same collection.
          </s-paragraph>
        </s-stack>
      </s-section>

      {/* How It Works */}
      <s-section heading="How It Works">
        <s-grid gap="base">
          <s-stack gap="small-100">
            <s-text type="strong">1. Smart Same-Collection Detection</s-text>
            <s-paragraph>
              Inspects checkout line items to find their true collection, automatically filtering out store-wide collections like 'All' or 'Catalog'.
            </s-paragraph>
          </s-stack>

          <s-divider />

          <s-stack gap="small-100">
            <s-text type="strong">2. Automated Duplicate Filtering</s-text>
            <s-paragraph>
              Never recommends products the customer already has in checkout. Only products with in-stock variants are shown.
            </s-paragraph>
          </s-stack>

          <s-divider />

          <s-stack gap="small-100">
            <s-text type="strong">3. 1-Click Upsell Action</s-text>
            <s-paragraph>
              Customers can add recommended products directly into their order without leaving the checkout page.
            </s-paragraph>
          </s-stack>
        </s-grid>
      </s-section>

      {/* Quick Placement Instructions */}
      <s-section heading="Checkout Placement Guide">
        <s-stack gap="small">
          <s-paragraph>
            To customize where the recommendations appear on your checkout:
          </s-paragraph>
          <s-ordered-list>
            <s-list-item>
              In Shopify Admin, go to <s-text type="strong">Settings &gt; Checkout</s-text>.
            </s-list-item>
            <s-list-item>
              Click <s-text type="strong">Customize</s-text> next to your active checkout configuration.
            </s-list-item>
            <s-list-item>
              Click <s-text type="strong">Add app block</s-text> in the sidebar or under line items.
            </s-list-item>
            <s-list-item>
              Select <s-text type="strong">similar-collection-products</s-text> and drag it to your desired spot.
            </s-list-item>
          </s-ordered-list>
        </s-stack>
      </s-section>

      {/* Aside details */}
      <s-section slot="aside" heading="Extension Info">
        <s-stack gap="small">
          <s-stack direction="inline" justifyContent="space-between">
            <s-text color="subdued">Target:</s-text>
            <s-text type="strong">purchase.checkout.block.render</s-text>
          </s-stack>
          <s-stack direction="inline" justifyContent="space-between">
            <s-text color="subdued">Surface:</s-text>
            <s-text type="strong">Checkout &amp; Order Summary</s-text>
          </s-stack>
          <s-stack direction="inline" justifyContent="space-between">
            <s-text color="subdued">API Access:</s-text>
            <s-text type="strong">Storefront GraphQL</s-text>
          </s-stack>
        </s-stack>
      </s-section>
    </s-page>
  );
}
