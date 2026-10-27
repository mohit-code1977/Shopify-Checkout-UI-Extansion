import "@shopify/ui-extensions/preact";
import { render } from "preact";

export default function extension() {
  render(<BundleLineItem />, document.body);
}

function BundleLineItem() {
  // Returns null so no duplicate custom card is rendered.
  // Shopify's native transformed bundle line item and nested component products are rendered directly by checkout.
  return null;
}
