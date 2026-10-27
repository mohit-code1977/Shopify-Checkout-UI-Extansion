export default function SettingsPage() {
  return (
    <s-page heading="Setup & Settings Guide">
      <s-section heading="Current Configuration">
        <s-stack gap="base">
          <s-paragraph>
            Your Checkout UI Extension is active with optimal defaults:
          </s-paragraph>

          <s-stack gap="small">
            <s-stack direction="inline" justifyContent="space-between" alignItems="center">
              <s-stack direction="block" gap="none">
                <s-text type="strong">Widget Title</s-text>
                <s-text color="subdued">Displayed above recommended products</s-text>
              </s-stack>
              <s-badge tone="neutral">"You may also like"</s-badge>
            </s-stack>

            <s-divider />

            <s-stack direction="inline" justifyContent="space-between" alignItems="center">
              <s-stack direction="block" gap="none">
                <s-text type="strong">Recommendation Limit</s-text>
                <s-text color="subdued">Maximum products shown at checkout</s-text>
              </s-stack>
              <s-badge tone="neutral">Top 4 products</s-badge>
            </s-stack>

            <s-divider />

            <s-stack direction="inline" justifyContent="space-between" alignItems="center">
              <s-stack direction="block" gap="none">
                <s-text type="strong">Collection Filtering</s-text>
                <s-text color="subdued">Excludes 'All', 'Frontpage', and generic collections</s-text>
              </s-stack>
              <s-badge tone="success">Strict Same-Collection</s-badge>
            </s-stack>
          </s-stack>
        </s-stack>
      </s-section>
    </s-page>
  );
}
