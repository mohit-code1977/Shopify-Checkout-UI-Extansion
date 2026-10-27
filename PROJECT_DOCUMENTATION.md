# 🛍️ Shopify Checkout UI Extension & Admin App — Complete Zero-to-Hero Guide

> **दस्तावेज़ विवरण (Document Overview):**  
> यह फ़ाइल इस पूरे Shopify App के हर एक पहलू (Architecture, Working, Workflow, Extensions, Commands, Setup, APIs aur Functionalities) को **शून्य (Zero) से अंत (Complete Detail)** तक समझाने के लिए बनाई गई है।

---

## 📑 विषय-सूची (Table of Contents)
1. [App क्या है? (Executive Summary & Concept)](#1-app-क्या-है-executive-summary--concept)
2. [आर्किटेक्चर: "Extension-Only" पैटर्न (Architecture Overview)](#2-आर्किटेक्चर-extension-only-पैटर्न-architecture-overview)
3. [प्रोजेक्ट डायरेक्टरी संरचना (Folder & File Structure)](#3-प्रोजेक्ट-डायरेक्टरी-संरचना-folder--file-structure)
4. [तीनों एक्सटेंशन्स का सम्पूर्ण विश्लेषण (Detailed Breakdown of Extensions)](#4-तीनों-एक्सटेंशन्स-का-सम्पूर्ण-विश्लेषण-detailed-breakdown-of-extensions)
   - [4.1 `similar-collection-products` (Checkout UI Extension)](#41-similar-collection-products-checkout-ui-extension)
   - [4.2 `app-home` (Merchant Admin Dashboard)](#42-app-home-merchant-admin-dashboard)
   - [4.3 `app-tools` (Shopify AI & Sidekick Tools)](#43-app-tools-shopify-ai--sidekick-tools)
   - [4.4 `shared/` (Models & Utilities)](#44-shared-models--utilities)
5. [वर्कफ्लो और डेटा फ़्लो (End-to-End Workflow & Data Flow)](#5-वर्कफ्लो-और-डेटा-फ़्लो-end-to-end-workflow--data-flow)
6. [API संदर्भ एवं GraphQL क्वेरीज़ (APIs & GraphQL Queries)](#6-api-संदर्भ-एवं-graphql-क्वेरीज़-apis--graphql-queries)
7. [सेटअप एवं इंस्टॉलेशन गाइड (Step-by-Step Setup & Installation)](#7-सेटअप-एवं-इंस्टॉलेशन-गाइड-step-by-step-setup--installation)
8. [कमांड्स चीटशीट (All CLI Commands Reference)](#8-कमांड्स-चीटशीट-all-cli-commands-reference)
9. [Shopify Checkout Editor में एक्टिवेट कैसे करें (Store Configuration)](#9-shopify-checkout-editor-में-एक्टिवेट-कैसे-करें-store-configuration)
10. [ट्रबलशूटिंग एवं अक्सर पूछे जाने वाले सवाल (Troubleshooting & FAQs)](#10-ट्रबलशूटिंग-एवं-अक्सर-पूछे-जाने-वाले-सवाल-troubleshooting--faqs)

---

## 1. App क्या है? (Executive Summary & Concept)

यह प्रोजेक्ट एक आधुनिक **Shopify Checkout Extensibility & Admin App** है। इसका मुख्य उद्देश्य चेकआउट पेज पर ग्राहकों (Buyers) को **Same-Collection Product Recommendations (क्रॉस-सेल / अपसेल)** दिखाना और 1-क्लिक में कार्ट में ऐड करने की सुविधा देना है, जिससे मर्चेंट का **Average Order Value (AOV)** बढ़ सके।

### मुख्य विशेषताएं (Key Features):
1. **Intelligent Same-Collection Recommendation Engine:**
   - खरीदार के चेकआउट कार्ट में मौजूद प्रोडक्ट्स की जांच करता है।
   - जेनेरिक कलेक्शन्स (जैसे "All", "Frontpage", "Catalog", "Sale") को बाईपास करके सही और वास्तविक (Specific) कलेक्शन को पहचानता है।
   - कार्ट में मौजूद बाकी प्रोडक्ट्स के साथ शेयर किए गए कलेक्शन को प्राथमिकता देता है।
2. **Duplicate Prevention & Stock Verification:**
   - जो प्रोडक्ट पहले से कार्ट में है, उसे कभी दोबारा रेकमेंड नहीं करता।
   - केवल इन-स्टॉक (`availableForSale: true`) प्रोडक्ट्स और उनके वेरिएंट्स दिखाता है।
3. **1-Click Direct Add to Cart:**
   - ग्राहक बिना चेकआउट पेज छोड़े तुरंत "Add" बटन दबाकर प्रोडक्ट को चेकआउट में जोड़ सकता है।
4. **Merchant Admin Dashboard (`app-home`):**
   - Shopify Admin के अंदर मर्चेंट को एक्सटेंशन का स्टेटस, फीचर्स, और कस्टमाइज़ेशन गाइड दिखाता है।
5. **Shopify AI Sidekick Tools (`app-tools`):**
   - Shopify के AI इकोसिस्टम (Sidekick) के साथ इंटीग्रेट होने के लिए टूल्स और मेटाऑब्जेक्ट्स (FAQs) उपलब्ध कराता है।

---

## 2. आर्किटेक्चर: "Extension-Only" पैटर्न (Architecture Overview)

पारंपरिक Shopify ऐप्स में Node.js, Ruby, या Python का एक अलग बैकएंड सर्वर और डेटाबेस (जैसे PostgreSQL/MySQL) चलाना पड़ता था। 

यह ऐप **Serverless / Extension-Only Architecture** पर आधारित है:
- **No Custom Backend Server:** किसी एक्सप्रेस, नोड या थर्ड-पार्टी सर्वर की आवश्यकता नहीं है।
- **Direct API Access (Browser-to-Shopify):** Shopify Admin API और Storefront API कॉल्स सीधे ब्राउज़र से ऑथेंटिकेट होकर चलती हैं (via App Bridge & Checkout Extension Sandbox)।
- **Preact & Web Components:** लाइटवेट और सुपर फ़ास्ट UI के लिए Preact और Shopify के नेटिव UI वेब कम्पोनेंट्स (`<s-box>`, `<s-button>`, `<s-grid>`, आदि) का इस्तेमाल होता है।
- **Data Persistence via Shopify Metaobjects:** डेटा स्टोर करने के लिए बाहरी डेटाबेस की जगह Shopify के नेटिव Metaobjects (`$app:faq`) का उपयोग होता है।

```
+---------------------------------------------------------------------------------+
|                                 SHOPIFY PLATFORM                                |
+---------------------------------------------------------------------------------+
       |                                      |                             |
       | Storefront GraphQL API               | Admin Direct API            | AI Agent / Tools
       v                                      v                             v
+-----------------------------+  +--------------------------+  +-----------------------+
|  Checkout UI Extension      |  |  App Home Extension      |  |  App Tools Extension  |
|  (similar-collection-prod)  |  |  (Merchant Admin UI)     |  |  (AI / Metaobjects)   |
|                             |  |                          |  |                       |
|  - purchase.checkout.block  |  |  - admin.app.home.render |  |  - admin.app.tools    |
|  - Storefront Query         |  |  - Preact-iso Router     |  |  - list_faqs, get_faq |
|  - 1-Click Cart Mutation    |  |  - Settings & Placements |  |  - shared/models/faq  |
+-----------------------------+  +--------------------------+  +-----------------------+
```

---

## 3. प्रोजेक्ट डायरेक्टरी संरचना (Folder & File Structure)

```
custom-app/
├── package.json                   # रूट वर्कस्पेस कॉन्फ़िगरेशन और मुख्य स्क्रिप्ट्स
├── pnpm-workspace.yaml            # PNPM monorepo वर्कस्पेस मैपिंग ("extensions/*")
├── shopify.app.toml               # ग्लोबल ऐप कॉन्फ़िगरेशन (Client ID, Scopes, Access Modes)
├── vite.config.ts                 # विट बंडलिंग कॉन्फ़िगरेशन
├── .graphqlrc.js                  # GraphQL स्कीमा और टाइपजेन कॉन्फ़िग
│
├── extensions/                    # सारे Shopify Extensions का मुख्य फ़ोल्डर
│   │
│   ├── similar-collection-products/   # [1] चेकआउट UI एक्सटेंशन (मुख्य अपसेल विगेट्स)
│   │   ├── shopify.extension.toml     # एक्सटेंशन टार्गेट (purchase.checkout.block.render)
│   │   ├── package.json               # प्रीएक्ट और यूआई एक्सटेंशन डिपेंडेंसीज़
│   │   ├── tsconfig.json              # टाइपस्क्रिप्ट कॉन्फ़िग
│   │   ├── locales/                   # मल्टी-लैंग्वेज ट्रांसलेशन (en.default.json, fr.json)
│   │   └── src/
│   │       └── Checkout.jsx           # पूरी चेकआउट अपसेल लॉजिक और यूआई
│   │
│   ├── app-home/                      # [2] शॉपिफ़ाई एडमिन डैशबोर्ड (Embedded UI)
│   │   ├── shopify.extension.toml     # एक्सटेंशन टार्गेट (admin.app.home.render)
│   │   ├── package.json
│   │   ├── assets/                    # इमेजेस एवं आइकन्स
│   │   └── src/
│   │       ├── AppHome.jsx            # रूट कम्पोनेंट और क्लाइंट-साइड राउटिंग
│   │       └── pages/
│   │           ├── HomePage.jsx       # स्टेटस और चेकआउट एडिटर गाइड
│   │           ├── SettingsPage.jsx   # एक्टिव कॉन्फ़िगरेशन गाइड
│   │           └── NotFoundPage.jsx   # 404 फॉलबैक
│   │
│   └── app-tools/                     # [3] AI टूल्स एक्सटेंशन (Sidekick Integration)
│       ├── shopify.extension.toml     # एक्सटेंशन टार्गेट (admin.app.tools.data)
│       ├── tools.json                 # AI एजेंट के लिए टूल्स का JSON स्कीमा
│       ├── instructions.md            # AI एजेंट के लिए प्रॉम्प्ट निर्देश
│       └── src/
│           └── index.js               # टूल रजिस्ट्रेशन हैंडलर (list_faqs, get_faq)
│
└── shared/                        # सभी एक्सटेंशन्स द्वारा शेयर किया गया कोड
    ├── models/
    │   └── faq.ts                 # Metaobjects ($app:faq) CRUD GraphQL ऑपरेशन्स
    └── utils/
        └── gid.ts                 # Shopify Global ID (GID) पार्सिंग और कनवर्टर
```

---

## 4. तीनों एक्सटेंशन्स का सम्पूर्ण विश्लेषण (Detailed Breakdown)

### 4.1 `similar-collection-products` (Checkout UI Extension)

- **Target Point:** `purchase.checkout.block.render`
- **Source Code:** [`extensions/similar-collection-products/src/Checkout.jsx`](file:///home/mohit/Shopify-App/custom-app/extensions/similar-collection-products/src/Checkout.jsx)
- **कॉन्फ़िगरेशन:** [`extensions/similar-collection-products/shopify.extension.toml`](file:///home/mohit/Shopify-App/custom-app/extensions/similar-collection-products/shopify.extension.toml)
  - `api_access = true`: इसे Storefront GraphQL API को सीधे क्वेरी करने की अनुमति देता है।

#### यह कैसे काम करता है (Step-by-Step Logic):
1. **कार्ट स्टेट लिसनिंग (`shopify.lines.subscribe`):**
   - जैसे ही खरीदार चेकआउट पेज पर आता है या कार्ट में आइटम बदलता है, `shopify.lines` से वर्तमान कार्ट प्रोडक्ट्स की लिस्ट ली जाती है।
2. **कार्ट प्रोडक्ट्स से कलेक्शन्स निकालना (`RECOMMENDATION_QUERY`):**
   - पहले 4 कार्ट प्रोडक्ट्स की IDs लेकर Storefront API से उनके कलेक्शन्स और उन कलेक्शन्स के पहले 20 प्रोडक्ट्स फेच किए जाते हैं।
3. **जेनेरिक कलेक्शन्स को हटाना (`isSpecificCollection`):**
   - "all", "all-products", "frontpage", "catalog", "sale", "automated-collection" जैसे सामान्य कलेक्शन्स को फ़िल्टर कर दिया जाता है ताकि केवल प्रासंगिक (niche) कलेक्शन ही चुना जाए।
4. **कॉमन / टारगेट कलेक्शन का चयन:**
   - यदि कार्ट में एक से अधिक प्रोडक्ट्स हैं, तो एल्गोरिदम देखता है कि क्या वे कोई कलेक्शन शेयर करते हैं। यदि हाँ, तो उसी शेयर किए गए कलेक्शन को टारगेट माना जाता है।
   - नहीं तो, पहले प्रोडक्ट के मुख्य स्पेसिफिक कलेक्शन को चुना जाता है।
5. **डुप्लीकेट्स व आउट-ऑफ़-स्टॉक फ़िल्टरिंग:**
   - जो प्रोडक्ट्स पहले से कार्ट में हैं (`cartProductIdSet`), उन्हें बाहर कर दिया जाता है।
   - जिन प्रोडक्ट्स में कोई उपलब्ध वेरिएंट (`availableForSale: true`) नहीं है, उन्हें छोड़ दिया जाता है।
   - टॉप 4 प्रोडक्ट्स चुने जाते हैं।
6. **1-Click Add-to-Cart (`shopify.applyCartLinesChange`):**
   - यूजर जब किसी प्रोडक्ट के सामने **"Add"** बटन दबाता है, तो `shopify.applyCartLinesChange({ type: "addCartLine", merchandiseId: variantId, quantity: 1 })` फायर होता है।
   - सफलता पर "Product added to your cart." मैसेज दिखता है और कार्ट तुरंत ऑटो-अपडेट हो जाता है।

---

### 4.2 `app-home` (Merchant Admin Dashboard)

- **Target Point:** `admin.app.home.render`
- **Source Code:** [`extensions/app-home/src/AppHome.jsx`](file:///home/mohit/Shopify-App/custom-app/extensions/app-home/src/AppHome.jsx)
- **Pages:**
  - `HomePage.jsx`: एक्सटेंशन का एक्टिव स्टेटस, काम करने का तरीका, और Shopify Checkout Editor का डायरेक्ट डीप-लिंक बटन (`shopify:admin/settings/checkout`) प्रदान करता है।
  - `SettingsPage.jsx`: एक्सटेंशन के रूल्स (जैसे मैक्सिमम 4 प्रोडक्ट्स, स्ट्रिक्ट सेम-कलेक्शन) की जानकारी देता है।
- **तकनीक:** `preact-iso` क्लाइंट-साइड राउटर और Polaris Web Components (`<s-page>`, `<s-section>`, `<s-badge>`, `<s-button>`, `<s-app-nav>`)।

---

### 4.3 `app-tools` (Shopify AI & Sidekick Tools)

- **Target Point:** `admin.app.tools.data`
- **Source Code:** [`extensions/app-tools/src/index.js`](file:///home/mohit/Shopify-App/custom-app/extensions/app-tools/src/index.js)
- **स्कीमा व निर्देश:** [`tools.json`](file:///home/mohit/Shopify-App/custom-app/extensions/app-tools/tools.json), [`instructions.md`](file:///home/mohit/Shopify-App/custom-app/extensions/app-tools/instructions.md)
- **उद्देश्य:**
  - Shopify के AI असिस्टेंट (Sidekick) या ऑटोमेशन टूल्स को ऐप के डेटा से इंटरैक्ट करने देता है।
  - `list_faqs`: स्टोर के सभी FAQ मेटाऑब्जेक्ट्स की लिस्ट निकालता है।
  - `get_faq`: किसी विशिष्ट ID के FAQ की पूरी जानकारी और विजिबिलिटी देता है।

---

### 4.4 `shared/` (Models & Utilities)

- **[`shared/models/faq.ts`](file:///home/mohit/Shopify-App/custom-app/shared/models/faq.ts):**
  - Shopify के **Direct API** (`fetch("shopify:admin/api/2026-07/graphql.json")`) का उपयोग करके Metaobjects (`$app:faq`) पर CRUD ऑपरेशन्स करता है:
    - `fetchFAQ(id)`: सिंगल FAQ फेच करता है।
    - `listFAQs()`: 50 FAQs लिस्ट करता है।
    - `createFAQ(faq)`: नया Metaobject बनाता है।
    - `updateFAQ(id, faq)`: Metaobject अपडेट करता है।
    - `deleteFAQ(id)`: Metaobject डिलीट करता है।
- **[`shared/utils/gid.ts`](file:///home/mohit/Shopify-App/custom-app/shared/utils/gid.ts):**
  - `gidToId`: पूर्ण URI (`gid://shopify/Metaobject/12345`) से सिर्फ संख्यात्मक ID (`12345`) निकालता है।
  - `idToGid`: संख्यात्मक ID को Shopify GID स्ट्रिंग में बदलता है।

---

## 5. वर्कफ्लो और डेटा फ़्लो (End-to-End Workflow & Data Flow)

### चेकआउट यूजर जर्नी (Buyer Experience Flow):
```
+-----------------------------------------------------------------------------------+
| 1. खरीदार चेकआउट पेज पर आता है (Cart Lines Loaded)                               |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| 2. Extension कार्ट में मौजूद प्रोडक्ट्स की IDs लेता है                             |
|    - Storefront API से Related Products और Collections मंगाता है                  |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| 3. Smart Filtering:                                                               |
|    - जेनेरिक कलेक्शन्स (All, Catalog, आदि) हटाए जाते हैं                           |
|    - कार्ट में पहले से मौजूद प्रोडक्ट्स हटाए जाते हैं                             |
|    - केवल उपलब्ध (In-Stock) प्रोडक्ट्स छांटे जाते हैं (अधिकतम 4)                  |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| 4. चेकआउट पेज पर "You may also like" विगेट रेंडर होता है                         |
|    - प्रोडक्ट का फोटो, टाइटल, लोकल करेंसी में कीमत, और "Add" बटन दिखाई देता है   |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| 5. खरीदार "Add" बटन दबाता है                                                     |
|    - shopify.applyCartLinesChange() कॉल होता है                                   |
|    - नया प्रोडक्ट चेकआउट सारांश (Order Summary) में जुड़ जाता है                  |
+-----------------------------------------------------------------------------------+
```

---

## 6. API संदर्भ एवं GraphQL क्वेरीज़ (APIs & GraphQL Queries)

### 1. Storefront GraphQL Query (`RECOMMENDATION_QUERY`)
यह क्वेरी चेकआउट एक्सटेंशन में किसी प्रोडक्ट के कलेक्शन और उसके सिबलिंग प्रोडक्ट्स प्राप्त करने के लिए चलती है:

```graphql
query RelatedProducts($id: ID!) {
  product(id: $id) {
    id
    title
    productType
    collections(first: 10) {
      nodes {
        id
        title
        handle
        products(first: 20) {
          nodes {
            id
            title
            productType
            featuredImage {
              url
              altText
            }
            variants(first: 10) {
              nodes {
                id
                title
                availableForSale
                price {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      }
    }
  }
}
```

### 2. Admin Direct GraphQL Mutation (Cart Manipulation)
चेकआउट एक्सटेंशन में कार्ट में प्रोडक्ट जोड़ने के लिए नेटिव API:
```javascript
const result = await shopify.applyCartLinesChange({
  type: "addCartLine",
  merchandiseId: variantId, // gid://shopify/ProductVariant/XXXX
  quantity: 1,
});
```

### 3. Currency Formatting API
Shopify स्टोर की एक्टिव करेंसी में कीमत प्रदर्शित करने के लिए:
```javascript
shopify.i18n.formatCurrency(Number(product.variant.price.amount), {
  currency: product.variant.price.currencyCode,
});
```

---

## 7. सेटअप एवं इंस्टॉलेशन गाइड (Step-by-Step Setup & Installation)

### 7.1 पूर्व-आवश्यकताएं (Prerequisites)
1. **Node.js**: v18.20.0 या उससे अधिक (v20+ अनुशंसित)।
2. **Shopify CLI**: लेटेस्ट वर्जन (`npm install -g @shopify/cli@latest`)।
3. **Shopify Partners Account**: [partners.shopify.com](https://partners.shopify.com) पर अकाउंट।
4. **Development Store**: ऐसा डेवलपमेंट स्टोर जिसमें **Checkout Extensibility** इनेबल्ड हो।

### 7.2 इंस्टॉलेशन स्टेप्स (Step-by-Step Setup)

#### Step 1: रिपॉजिटरी क्लोन करें व फोल्डर में जाएं
```bash
cd /home/mohit/Shopify-App/custom-app
```

#### Step 2: डिपेंडेंसीज इंस्टॉल करें
```bash
npm install
# या यदि pnpm का उपयोग कर रहे हैं:
pnpm install
```

#### Step 3: Shopify अकाउंट से लॉगिन करें
```bash
shopify auth login
```

#### Step 4: लोकल डेवलपमेंट सर्वर शुरू करें
```bash
npm run dev
# या
shopify app dev
```
- पहली बार चलाने पर CLI आपसे पूछेगा कि किस पार्टनर संगठन (Partner Org) और डेवलपमेंट स्टोर से लिंक करना है।
- CLI एक टनल और लोकल यूआरएल बनाएगा और कंसोल में एक लिंक देगा।
- कंसोल में **`P`** दबाने पर आपके स्टोर का Admin Dev Preview पेज खुल जाएगा।

---

## 8. कमांड्स चीटशीट (All CLI Commands Reference)

| कमांड | कार्य विवरण (Description) |
|---|---|
| `npm run dev` | लोकल डेवलपमेंट सर्वर और टनल शुरू करता है; लाइव रिलोडिंग चालू करता है। |
| `npm run build` | सभी एक्सटेंशन्स (`extensions/*`) को प्रोडक्शन के लिए कंपाइल/बंडल करता है। |
| `npm run deploy` | एक्सटेंशन्स के नए वर्जन को Shopify Partners / App Dashboard पर डिप्लॉय करता है। |
| `shopify app info` | वर्तमान ऐप के कॉन्फ़िगरेशन, लिंक्ड स्टोर, Scopes और एक्सटेंशन्स की स्थिति दिखाता है। |
| `shopify app generate extension` | ऐप में नया एक्सटेंशन (जैसे फ़ंक्शन, वेब पिक्सल, थीम ऐप एक्सटेंशन) जोड़ने के लिए। |

---

## 9. Shopify Checkout Editor में एक्टिवेट कैसे करें (Store Configuration)

> ⚠️ **महत्वपूर्ण:** कोड रन होने के बाद भी जब तक आप इसे Checkout Editor में ड्रैग-एंड-ड्रॉप नहीं करेंगे, यह स्टोर के चेकआउट पर दिखाई नहीं देगा!

### एक्टिवेट करने की प्रक्रिया:
1. अपने **Shopify Admin** में लॉगिन करें।
2. बायीं ओर नीचे **Settings** पर क्लिक करें और फिर **Checkout** चुनें।
3. **Configurations** सेक्शन में जाकर अपनी एक्टिव चेकआउट प्रोफ़ाइल के सामने **Customize** बटन पर क्लिक करें।
4. चेकआउट कस्टमाइज़र में बाईं ओर **Add app block** पर क्लिक करें।
5. लिस्ट में से **`similar-collection-products`** एक्सटेंशन चुनें।
6. इसे ड्रैग करके अपनी मनपसंद जगह पर रखें (जैसे: **Order Summary** के नीचे या **Shipping Address** के ऊपर)।
7. ऊपर दाईं ओर **Save** पर क्लिक करें।
8. अब अपने स्टोर के फ्रंटएंड पर जाकर किसी प्रोडक्ट को कार्ट में डालें और चेकआउट पेज पर जाएं — आपको विगेट लाइव दिखाई देगा!

---

## 10. ट्रबलशूटिंग एवं अक्सर पूछे जाने वाले सवाल (Troubleshooting & FAQs)

### Q1: विगेट चेकआउट पर दिखाई नहीं दे रहा है, क्यों?
- **कारण 1:** आपने Checkout Editor में ब्लॉक को सेव नहीं किया है (अनुभाग 9 देखें)।
- **कारण 2:** कार्ट में जो प्रोडक्ट है, वह किसी स्पेसिफिक कलेक्शन का हिस्सा नहीं है (केवल 'All' में है)।
- **कारण 3:** कलेक्शन के अन्य सभी प्रोडक्ट्स आउट-ऑफ़-स्टॉक हैं या पहले से ही कार्ट में मौजूद हैं।

### Q2: "Storefront API query returned errors" या परमिशन एरर क्यों आता है?
- `shopify.extension.toml` में `api_access = true` होना अनिवार्य है।
- `shopify.app.toml` में आवश्यक एक्सेस स्कोप्स (जैसे `write_products` या `read_products`) कॉन्फ़िगर होने चाहिए।

### Q3: क्या इसके लिए हमें कोई AWS/Heroku सर्वर होस्ट करना पड़ेगा?
- **नहीं!** यह एक **Extension-Only App** है। इसके सारे बंडल्स सीधे Shopify के हाई-स्पीड CDN पर होस्ट और रन होते हैं।

---

*(यह दस्तावेज़ प्रोजेक्ट के स्रोत कोड के आधार पर तैयार किया गया है)*
