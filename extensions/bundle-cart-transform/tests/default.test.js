import path from "path";
import fs from "fs";
import { describe, beforeAll, test, expect } from "vitest";
import { buildFunction, getFunctionInfo, loadSchema, loadInputQuery, loadFixture, validateTestAssets, runFunction } from "@shopify/shopify-function-test-helpers";

describe("Default Integration Test", () => {
  let schema;
  let functionDir;
  let functionInfo;
  let schemaPath;
  let targeting;
  let functionRunnerPath;
  let wasmPath;

  beforeAll(async () => {
    functionDir = path.dirname(__dirname);
    await buildFunction(functionDir);
    functionInfo = await getFunctionInfo(functionDir);
    ({ schemaPath, functionRunnerPath, wasmPath, targeting } = functionInfo);
    schema = await loadSchema(schemaPath);
  }, 45000);

  const fixturesDir = path.join(__dirname, "fixtures");
  const fixtureFiles = fs
    .readdirSync(fixturesDir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => path.join(fixturesDir, file));

  fixtureFiles.forEach((fixtureFile) => {
    test(`runs ${path.relative(fixturesDir, fixtureFile)}`, async () => {
      const fixture = await loadFixture(fixtureFile);
      const targetInputQueryPath = targeting[fixture.target].inputQueryPath;
      const inputQueryAST = await loadInputQuery(targetInputQueryPath);

      const validationResult = await validateTestAssets({ schema, fixture, inputQueryAST });
      expect(validationResult.inputQuery.errors).toEqual([]);
      expect(validationResult.inputFixture.errors).toEqual([]);
      expect(validationResult.outputFixture.errors).toEqual([]);

      const runResult = await runFunction(fixture, functionRunnerPath, wasmPath, targetInputQueryPath, schemaPath);
      expect(runResult.error).toBeNull();
      expect(runResult.result.output).toEqual(fixture.expectedOutput);
    }, 10000);
  });
});

describe("cleanShopifyCdnImageUrl Unit Tests", () => {
  test("cleans Shopify CDN URLs without explicit resizing suffix", async () => {
    const { cleanShopifyCdnImageUrl } = await import("../src/cart_transform_run.ts");

    // 1. Valid original URL without resizing parameters
    expect(
      cleanShopifyCdnImageUrl("https://cdn.shopify.com/s/files/1/0818/7271/5874/files/theme_cover_image.jpg")
    ).toBe("https://cdn.shopify.com/s/files/1/0818/7271/5874/files/theme_cover_image.jpg");

    // 2. Strips ?width=800 resizing parameter
    expect(
      cleanShopifyCdnImageUrl("https://cdn.shopify.com/s/files/1/0818/7271/5874/files/theme_cover_image.jpg?v=1730000000&width=800")
    ).toBe("https://cdn.shopify.com/s/files/1/0818/7271/5874/files/theme_cover_image.jpg?v=1730000000");

    // 3. Strips legacy filename resizing suffix like _800x800
    expect(
      cleanShopifyCdnImageUrl("https://cdn.shopify.com/s/files/1/0818/7271/5874/files/daily-essentials-bundle_800x800.png")
    ).toBe("https://cdn.shopify.com/s/files/1/0818/7271/5874/files/daily-essentials-bundle.png");

    // 4. Prepend https: to protocol-relative URLs
    expect(
      cleanShopifyCdnImageUrl("//cdn.shopify.com/s/files/1/0818/7271/5874/files/daily-essentials-bundle.png")
    ).toBe("https://cdn.shopify.com/s/files/1/0818/7271/5874/files/daily-essentials-bundle.png");

    // 5. Rejects non-Shopify CDN domains
    expect(cleanShopifyCdnImageUrl("https://external-domain.com/image.jpg")).toBeNull();
  });
});

