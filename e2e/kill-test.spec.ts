import { test, expect } from "@playwright/test";

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
              text: '{"kind":"recall","question":"이 개념의 핵심 원리를 설명해보세요.","targetConcept":"테스트 개념","whyThisMatters":"이해도 확인"}',
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
              text: '{"verdict":"partial","whatWasRight":["부분 정답"],"missingPoints":["빠진 부분"],"followUpQuestion":"핵심 원리를 다시 생각해보세요"}',
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
          content: [
            {
              type: "text",
              text: "모범 답안: 이 개념의 핵심은...",
            },
          ],
          model: "claude-sonnet-4-6",
          stop_reason: "end_turn",
          usage: { input_tokens: 100, output_tokens: 50 },
        }),
      });
    }
  });
}

// Helper: navigate to main view with API key set
async function goToMainWithApiKey(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByText(/이해/i).first().click();

  // Settings → API Key
  await page.getByText("Settings").first().click();
  await expect(page.getByText(/api key/i).first()).toBeVisible({ timeout: 5_000 });
  const apiInput = page.locator('input[type="password"]');
  await apiInput.fill("sk-ant-mock-key");
  await page.getByText("Done").click();
  await expect(page.locator('input[type="password"]')).not.toBeVisible({ timeout: 3_000 });
}

// Helper: load sample PDF and wait for render
async function loadSamplePdf(page: import("@playwright/test").Page) {
  const sampleBtn = page.getByText(/샘플로 체험하기/i);
  await sampleBtn.click();

  // Wait for PdfViewer to render (react-pdf Document loads)
  await page.waitForSelector(".react-pdf__Document", { timeout: 15_000 });
}

// Helper: simulate text selection in PdfViewer via window.getSelection mock + mouseup
async function simulateTextSelection(page: import("@playwright/test").Page) {
  // Find the PDF container and dispatch a mouseup event after mocking getSelection
  await page.evaluate(() => {
    // Create a fake range/rect for the selection
    const container = document.querySelector(".react-pdf__Document");
    if (!container) throw new Error("PDF container not found");

    // Try to find any text layer span
    const textSpan = container.querySelector(".react-pdf__Page__textContent span");
    const targetNode = textSpan || container;

    // Create a range on the target
    const range = document.createRange();
    range.selectNodeContents(targetNode);

    // Override getSelection to return our fake selection
    const originalGetSelection = window.getSelection;
    const fakeSelection = {
      isCollapsed: false,
      toString: () => "This is selected text for testing",
      getRangeAt: () => ({
        getClientRects: () => [{ left: 200, top: 300, right: 400, bottom: 320, width: 200, height: 20 }],
        getBoundingClientRect: () => ({ left: 200, top: 300, right: 400, bottom: 320, width: 200, height: 20 }),
      }),
      rangeCount: 1,
      removeAllRanges: () => {},
      addRange: () => {},
    };
    (window as any).getSelection = () => fakeSelection;

    // Dispatch mouseup on the PDF container's parent (the one with onMouseUp)
    const pdfWrapper = container.closest("[class*='overflow-auto']") || container.parentElement;
    if (pdfWrapper) {
      pdfWrapper.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    }

    // Restore original
    setTimeout(() => {
      (window as any).getSelection = originalGetSelection;
    }, 100);
  });
}

test.describe("Kill Test — E2E Full Flow", () => {
  test("앱 로드 → 온보딩 화면 표시", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByText(/이해|understand/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("모드 선택 → 메인 레이아웃 전환", async ({ page }) => {
    await page.goto("/");
    const modeCard = page.getByText(/이해|understand/i).first();
    await expect(modeCard).toBeVisible({ timeout: 10_000 });
    await modeCard.click();

    // After mode selection, should show FileDropZone with drop text or Settings nav
    await expect(
      page.getByText(/pdf|drop|파일|드롭|Settings/i).first()
    ).toBeVisible({ timeout: 5_000 });
  });

  test("Settings에서 API Key 입력 → 반영", async ({ page }) => {
    await page.goto("/");
    await page.getByText(/이해/i).first().click();

    // Click Settings
    await page.getByText("Settings").first().click();
    await expect(page.getByText(/api key/i).first()).toBeVisible({ timeout: 5_000 });

    // Security warning visible
    await expect(page.getByText(/개인용으로만 사용/)).toBeVisible();

    // Enter API key
    const apiInput = page.locator('input[type="password"]');
    await apiInput.fill("sk-ant-test-key");

    // Click Done
    await page.getByText("Done").click();

    // Dialog should close
    await expect(page.locator('input[type="password"]')).not.toBeVisible({ timeout: 3_000 });

    // Reopen settings — key should be preserved
    await page.getByText("Settings").first().click();
    const savedKey = await page.locator('input[type="password"]').inputValue();
    expect(savedKey).toBe("sk-ant-test-key");
  });

  test("API 에러 시 에러 UI 표시", async ({ page }) => {
    // Mock API to return auth error
    await page.route("https://api.anthropic.com/v1/messages", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({
          type: "error",
          error: {
            type: "authentication_error",
            message: "invalid x-api-key",
          },
        }),
      });
    });

    await page.goto("/");
    await page.getByText(/이해/i).first().click();

    // Set API key
    await page.getByText("Settings").first().click();
    await page.locator('input[type="password"]').fill("sk-ant-bad-key");
    await page.getByText("Done").click();

    // Try to provoke from SidePanel "도발해줘" button
    const provokeBtn = page.getByText("도발해줘");
    await expect(provokeBtn).toBeVisible({ timeout: 5_000 });
    await provokeBtn.click();

    // Select intent (핵심)
    await page.getByText("핵심").click();

    // Should show error message in SidePanel
    await expect(page.getByText(/API Key를 확인|인증|authentication/i).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("전체 플로우: 온보딩 → PDF 로드 → 텍스트 선택 → 도발 → 평가 → 정답 보기", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await mockAnthropicApi(page);

    // 1. Onboarding → mode select
    await page.goto("/");
    await page.getByText(/이해/i).first().click();

    // 2. Set API key
    await page.getByText("Settings").first().click();
    await page.locator('input[type="password"]').fill("sk-ant-mock-key");
    await page.getByText("Done").click();

    // 3. Load sample PDF
    await loadSamplePdf(page);

    // 4. Simulate text selection
    await simulateTextSelection(page);

    // 5. FloatingToolbar should appear → click Provoke
    const provokeBtn = page.getByText("Provoke").first();
    await expect(provokeBtn).toBeVisible({ timeout: 5_000 });
    await provokeBtn.click();

    // 6. Select intent → 핵심
    await page.getByText("핵심").click();

    // 7. Wait for provocation question to appear
    await expect(page.getByText("이 개념의 핵심 원리를 설명해보세요.")).toBeVisible({
      timeout: 15_000,
    });

    // 8. Type answer and select confidence
    await page.locator('textarea[placeholder="답변을 입력하세요..."]').fill("핵심 원리는 테스트입니다.");
    await page.getByText("중간").click();

    // 9. Submit answer
    await page.getByText("제출").click();

    // 10. Wait for evaluation result
    await expect(page.getByText(/partial/i).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("부분 정답")).toBeVisible();

    // 11. Click "정답 보기" to see model answer
    await page.getByText("정답 보기").click();

    // 12. Wait for model answer
    await expect(page.getByText("모범 답안", { exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/이 개념의 핵심은/)).toBeVisible();

    // 13. Save and proceed
    await page.getByText("저장하고 넘어가기").click();

    // 14. Should be in saved/history state
    await expect(page.getByText("도발해줘")).toBeVisible({ timeout: 5_000 });
  });

  test("90초 이내 전체 플로우 완료 (킬 테스트)", async ({ page }) => {
    test.setTimeout(90_000);
    await mockAnthropicApi(page);

    const startTime = Date.now();

    // 1. Onboarding → mode select + API Key setup
    await goToMainWithApiKey(page);

    // 3. PDF 로드 확인
    await loadSamplePdf(page);
    await expect(page.locator(".react-pdf__Document")).toBeVisible();

    // 4. 텍스트 선택
    await simulateTextSelection(page);

    // 5. FloatingToolbar → Provoke 클릭
    const floatingProvoke = page.getByText("Provoke").first();
    await expect(floatingProvoke).toBeVisible({ timeout: 5_000 });
    await floatingProvoke.click();

    // 6. Intent 선택 → SidePanel loading
    await page.getByText("핵심").click();

    // 7. 도발 질문 표시 확인
    await expect(page.getByText("이 개념의 핵심 원리를 설명해보세요.")).toBeVisible({
      timeout: 15_000,
    });

    // 8. 답변 입력 + 제출
    await page.locator('textarea[placeholder="답변을 입력하세요..."]').fill("테스트 답변");
    await page.getByText("중간").click();
    await page.getByText("제출").click();

    // 9. 평가 결과 표시 확인
    await expect(page.getByText(/partial/i).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("부분 정답")).toBeVisible();

    // 10. 정답 보기 → 모범 답안
    await page.getByText("정답 보기").click();
    await expect(page.getByText("모범 답안", { exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/이 개념의 핵심은/)).toBeVisible();

    // 11. 저장하고 넘어가기
    await page.getByText("저장하고 넘어가기").click();

    // 12. 완료 → 도발해줘 버튼 다시 표시
    await expect(page.getByText("도발해줘")).toBeVisible({ timeout: 5_000 });

    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeLessThan(90_000);
  });

  test("Newsprint 디자인 시스템 적용 확인", async ({ page }) => {
    await page.goto("/");
    const body = page.locator("body");
    const bgColor = await body.evaluate(
      (el) => getComputedStyle(el).backgroundColor
    );
    expect(bgColor).toMatch(/rgb\(249,\s*249,\s*247\)|#F9F9F7/i);
  });

  test("반응형 레이아웃 — 모바일 뷰포트", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await expect(
      page.getByText(/이해|understand/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });
});
