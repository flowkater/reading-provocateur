## 이슈 2: 멀티 AI 프로바이더 지원

### 현재 상태

```typescript
// anthropic-provider.ts
export class AnthropicProvider implements AiProvider {
  private client: Anthropic;
  constructor(apiKey: string, model: string = "claude-sonnet-4-6") {
    this.client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  }
}
```

- Anthropic SDK 직접 사용 (`@anthropic-ai/sdk`)
- `dangerouslyAllowBrowser: true`로 브라우저 직접 호출
- 다른 프로바이더 지원 없음

### 필요한 프로바이더

| 프로바이더           | SDK/API             | 모델                                | 용도        |
| -------------------- | ------------------- | ----------------------------------- | ----------- |
| **Anthropic** (현재) | `@anthropic-ai/sdk` | claude-sonnet-4-6, claude-haiku-4-5 | 기본        |
| **OpenAI**           | `openai` SDK        | gpt-4o, gpt-4o-mini                 | 대안        |
| **Qwen (DashScope)** | DashScope REST API  | qwen-plus, qwen-turbo               | 저비용 대안 |

### 설계

#### AiProvider 인터페이스 (이미 존재)

```typescript
// ai-provider.ts — 이미 추상화되어 있음
export interface AiProvider {
  generateProvocation(input: ProvocationInput): Promise<ProvocationPayload>;
  evaluateAnswer(input: EvaluateAnswerInput): Promise<EvaluationPayload>;
  generateModelAnswer(input: ModelAnswerInput): Promise<string>;
}
```

**좋은 소식**: `AiProvider` 인터페이스가 이미 분리되어 있으므로, 새 프로바이더 추가는 **구현체만 만들면 됨**.

#### 추가할 구현체

```
src/lib/
├── ai-provider.ts              ← 인터페이스 (기존)
├── anthropic-provider.ts       ← 기존
├── openai-provider.ts          ← 신규
└── dashscope-provider.ts       ← 신규
```

#### OpenAI Provider

```typescript
// openai-provider.ts
import OpenAI from "openai";

export class OpenAIProvider implements AiProvider {
  private client: OpenAI;

  constructor(apiKey: string, model: string = "gpt-4o") {
    this.client = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true,
    });
  }

  async generateProvocation(
    input: ProvocationInput
  ): Promise<ProvocationPayload> {
    // OpenAI는 response_format: { type: "json_object" } 지원
    // → JSON 강제 가능, callWithJsonRetry 대신 네이티브 JSON mode
    const response = await this.client.chat.completions.create({
      model: this.model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: input.system },
        { role: "user", content: input.user },
      ],
    });
    return ProvocationPayloadSchema.parse(
      JSON.parse(response.choices[0].message.content!)
    );
  }
  // ... evaluateAnswer, generateModelAnswer 동일 패턴
}
```

#### DashScope Provider

```typescript
// dashscope-provider.ts
export class DashScopeProvider implements AiProvider {
  private apiKey: string;
  private model: string;
  private baseUrl = "https://dashscope.aliyuncs.com/compatible-mode/v1";

  constructor(apiKey: string, model: string = "qwen-plus") {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateProvocation(
    input: ProvocationInput
  ): Promise<ProvocationPayload> {
    // DashScope는 OpenAI-compatible API
    // fetch로 직접 호출 (SDK 의존 추가 없이)
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: input.system },
          { role: "user", content: input.user },
        ],
      }),
    });
    const data = await response.json();
    return ProvocationPayloadSchema.parse(
      JSON.parse(data.choices[0].message.content)
    );
  }
}
```

#### Settings UI 변경

```
┌─────────────────────────────────┐
│ ⚙️ 설정                         │
│                                 │
│ AI 프로바이더: [Anthropic ▾]     │
│               ┌──────────────┐  │
│               │ ✓ Anthropic  │  │
│               │   OpenAI     │  │
│               │   DashScope  │  │
│               └──────────────┘  │
│                                 │
│ API Key: [sk-ant-...        ]   │  ← 프로바이더별 키
│                                 │
│ 모델:    [claude-sonnet-4-6 ▾]  │  ← 프로바이더별 모델 목록
│          ┌───────────────────┐  │
│          │ claude-sonnet-4-6 │  │
│          │ claude-haiku-4-5  │  │
│          └───────────────────┘  │
│                                 │
│ [💾 키 기억하기]                  │
│                                 │
│ [저장]                           │
└─────────────────────────────────┘
```

#### CORS 고려사항

| 프로바이더 | 브라우저 직접 호출              | 비고                   |
| ---------- | ------------------------------- | ---------------------- |
| Anthropic  | `dangerouslyAllowBrowser: true` | ⚠️ 실제 검증 필요      |
| OpenAI     | `dangerouslyAllowBrowser: true` | SDK 지원               |
| DashScope  | `fetch` 직접 호출               | ⚠️ CORS 헤더 확인 필요 |

**CORS 실패 시 대안**: Vite dev proxy → 배포 시 CF Worker proxy

#### 구현 순서

```
1. openai-provider.ts 작성 + 테스트 (S)
2. dashscope-provider.ts 작성 + 테스트 (S)
3. SettingsDialog에 프로바이더 선택 드롭다운 추가 (S)
4. useSettings에 provider 상태 추가 (S)
5. ReadingView에서 provider에 따라 Provider 인스턴스 생성 (S)
6. store.ts에 provider별 API Key 저장 (S)
```

총 노력: **M** (각 S × 6 = 반나절~1일)
