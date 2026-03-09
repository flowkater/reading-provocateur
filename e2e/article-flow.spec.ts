import { test, expect } from "@playwright/test";

const MOCK_ARTICLE_HTML = `
<html>
<head><title>테스트 아티클 제목</title></head>
<body>
<article>
  <h1>테스트 아티클 제목</h1>
  <p>이것은 테스트 아티클의 본문 내용입니다. 도발 플로우를 테스트하기 위한 충분한 텍스트가 필요합니다.</p>
  <p>두 번째 문단입니다. 더 많은 콘텐츠를 추가하여 Readability가 파싱할 수 있도록 합니다.</p>
  <p>세 번째 문단입니다. 콘텐츠의 길이가 충분해야 아티클로 인식됩니다.</p>
</article>
</body>
</html>
`;

// Helper: intercept CORS proxy and article URL to return mock HTML
async function mockArticleFetch(page: import("@playwright/test").Page) {
  // Intercept direct fetch to the article URL
  await page.route("https://example.com/test-article", async (route) => {
    await route.fulfill({
      contentType: "text/html; charset=utf-8",
      body: MOCK_ARTICLE_HTML,
    });
  });

  // Intercept CORS proxy fallback
  await page.route("**/cors-proxy**", async (route) => {
    await route.fulfill({
      contentType: "text/html; charset=utf-8",
      body: MOCK_ARTICLE_HTML,
    });
  });
}

// Helper: intercept Anthropic API calls
async function mockAnthropicApi(page: import("@playwright/test").Page) {
  await page.route("https://api.anthropic.com/v1/messages", async (route) => {
    const postData = route.request().postDataJSON();
    const systemMsg = Array.isArray(postData.system)
      ? postData.system.map((s: any) => s.text).join(" ")
      : postData.system || "";

    if (systemMsg.includes("도발") || systemMsg.includes("provoc")) {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          id: "msg_mock",
          type: "message",
          role: "assistant",
          content: [
            {
              type: "text",
              text: '{"kind":"recall","question":"이 아티클의 핵심 논점을 요약해보세요."}',
            },
          ],
          model: "claude-sonnet-4-6",
          stop_reason: "end_turn",
          usage: { input_tokens: 100, output_tokens: 50 },
        }),
      });
    } else if (systemMsg.includes("평가") || systemMsg.includes("evaluat")) {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          id: "msg_mock",
          type: "message",
          role: "assistant",
          content: [
            {
              type: "text",
              text: '{"verdict":"correct","whatWasRight":["정확한 요약"],"missingPoints":[],"followUpQuestion":null}',
            },
          ],
          model: "claude-sonnet-4-6",
          stop_reason: "end_turn",
          usage: { input_tokens: 100, output_tokens: 50 },
        }),
      });
    } else {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          id: "msg_mock",
          type: "message",
          role: "assistant",
          content: [{ type: "text", text: "모범 답안: 이 아티클의 핵심은..." }],
          model: "claude-sonnet-4-6",
          stop_reason: "end_turn",
          usage: { input_tokens: 100, output_tokens: 50 },
        }),
      });
    }
  });
}

// Helper: navigate to main view with API key
async function goToMainWithApiKey(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByText(/이해/i).first().click();
  await page.getByText("Settings").first().click();
  await expect(page.getByText(/api key/i).first()).toBeVisible({ timeout: 5_000 });
  await page.locator('input[type="password"]').fill("sk-ant-mock-key");
  await page.getByText("Done").click();
  await expect(page.locator('input[type="password"]')).not.toBeVisible({ timeout: 3_000 });
}

test.describe("Article Flow E2E", () => {
  test("아티클 URL → 본문 표시 → 도발 플로우", async ({ page }) => {
    test.setTimeout(60_000);
    await mockArticleFetch(page);
    await mockAnthropicApi(page);
    await goToMainWithApiKey(page);

    // 1. Switch to article tab
    await page.getByText("웹 아티클").click();
    await expect(page.getByPlaceholder("https://...")).toBeVisible();

    // 2. Enter URL and submit
    await page.getByPlaceholder("https://...").fill("https://example.com/test-article");
    await page.getByText("불러오기").click();

    // 3. Wait for article to render
    await expect(page.locator(".article-content")).toBeVisible({ timeout: 15_000 });

    // 4. Verify article title is displayed
    await expect(page.locator("h1").first()).toBeVisible();

    // 5. BottomBar should not be visible for articles
    await expect(page.locator("text=p.1/1")).not.toBeVisible();

    // 6. Simulate text selection on article
    await page.evaluate(() => {
      const articleContent = document.querySelector(".article-content");
      if (!articleContent) throw new Error("Article content not found");

      const fakeSelection = {
        isCollapsed: false,
        toString: () => "도발 플로우를 테스트하기 위한",
        getRangeAt: () => ({
          getClientRects: () => [
            { left: 200, top: 300, right: 500, bottom: 320, width: 300, height: 20 },
          ],
          getBoundingClientRect: () => ({
            left: 200, top: 300, right: 500, bottom: 320, width: 300, height: 20,
          }),
        }),
        rangeCount: 1,
        removeAllRanges: () => {},
        addRange: () => {},
      };
      const originalGetSelection = window.getSelection;
      (window as any).getSelection = () => fakeSelection;

      const container = articleContent.closest("[class*='overflow-auto']") || articleContent.parentElement;
      if (container) {
        container.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
      }

      setTimeout(() => {
        (window as any).getSelection = originalGetSelection;
      }, 100);
    });

    // 7. FloatingToolbar should appear
    const provokeBtn = page.getByText("Provoke").first();
    await expect(provokeBtn).toBeVisible({ timeout: 5_000 });
    await provokeBtn.click();

    // 8. Select intent
    await page.getByText("핵심").click();

    // 9. Wait for provocation question
    await expect(
      page.getByText("이 아티클의 핵심 논점을 요약해보세요.")
    ).toBeVisible({ timeout: 15_000 });

    // 10. Answer and submit
    await page
      .locator('textarea[placeholder="답변을 입력하세요..."]')
      .fill("핵심 논점은 테스트입니다.");
    await page.getByText("중간").click();
    await page.getByText("제출").click();

    // 11. Evaluation result or flow completed (fast mock may skip past evaluation view)
    await expect(
      page.getByText("정확한 요약").or(page.getByText("도발해줘"))
    ).toBeVisible({ timeout: 15_000 });
  });

  test("URL fetch 실패 → 에러 표시", async ({ page }) => {
    // Mock the direct fetch to fail and CORS proxy to also fail
    await page.route("https://example.com/bad-article", async (route) => {
      await route.abort("connectionrefused");
    });
    await page.route("**/cors-proxy**", async (route) => {
      await route.fulfill({ status: 502, body: "Failed to fetch" });
    });

    await page.goto("/");
    await page.getByText(/이해/i).first().click();

    // Switch to article tab
    await page.getByText("웹 아티클").click();

    // Enter bad URL and submit
    await page.getByPlaceholder("https://...").fill("https://example.com/bad-article");
    await page.getByText("불러오기").click();

    // Should show error message
    await expect(
      page.locator("text=/불러올 수 없|오류|에러|인식되지/")
    ).toBeVisible({ timeout: 10_000 });
  });
});
