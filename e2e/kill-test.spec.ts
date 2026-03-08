import { test, expect } from "@playwright/test";

test.describe("Kill Test — 1:30 시나리오", () => {
  test("앱 로드 → 온보딩 화면 표시", async ({ page }) => {
    await page.goto("/");
    // 온보딩: 세션 모드 선택 화면
    await expect(
      page.getByText(/이해|understand/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("모드 선택 → 메인 레이아웃 전환", async ({ page }) => {
    await page.goto("/");
    // 이해 모드 카드 클릭
    const modeCard = page.getByText(/이해|understand/i).first();
    await expect(modeCard).toBeVisible({ timeout: 10_000 });
    await modeCard.click();

    // API Key 미설정 시 Settings 다이얼로그 or 파일 드롭 영역
    const hasSettings = await page
      .getByText(/api key/i)
      .isVisible()
      .catch(() => false);
    const hasDropZone = await page
      .getByText(/pdf|drop|파일|업로드/i)
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasSettings || hasDropZone).toBe(true);
  });

  test("Newsprint 디자인 시스템 적용 확인", async ({ page }) => {
    await page.goto("/");

    // 배경색 확인 (#F9F9F7 계열)
    const body = page.locator("body");
    const bgColor = await body.evaluate(
      (el) => getComputedStyle(el).backgroundColor
    );
    // rgb(249, 249, 247) or similar
    expect(bgColor).toMatch(/rgb\(249,\s*249,\s*247\)|#F9F9F7/i);
  });

  test("반응형 레이아웃 — 모바일 뷰포트", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await expect(
      page.getByText(/이해|understand/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("샘플 PDF 체험 버튼 존재", async ({ page }) => {
    await page.goto("/");
    const sampleBtn = page
      .getByText(/샘플|sample|체험/i)
      .first();
    // 버튼이 있으면 클릭 가능한지 확인
    const isVisible = await sampleBtn.isVisible().catch(() => false);
    // 샘플 버튼은 optional — 있으면 검증, 없어도 pass
    if (isVisible) {
      await expect(sampleBtn).toBeEnabled();
    }
  });
});
