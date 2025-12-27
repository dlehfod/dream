// Vercel Serverless Function - 꿈 분석 API
// 환경 변수에서 API 키를 안전하게 사용합니다.

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // POST만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.');
    }

    const dreamData = req.body;
    
    if (!dreamData.story && !dreamData.symbols && !dreamData.emotion) {
      return res.status(400).json({ error: '꿈 정보가 제공되지 않았습니다.' });
    }

    // 프롬프트 생성
    const prompt = buildPrompt(dreamData);

    // Gemini API 호출
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.9,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192
          }
        })
      }
    );

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json();
      throw new Error(`Gemini API 오류: ${errorData.error?.message || geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      throw new Error('Gemini API 응답이 비어있습니다.');
    }

    // JSON 파싱
    const result = parseResponse(responseText);
    
    return res.status(200).json(result);

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

function buildPrompt(dreamData) {
  return `[궁극의 꿈 분석 프롬프트: 무의식과 예언의 이중 해석]

# 페르소나 설정:

너는 지금부터 세계 최고의 꿈 분석가 '프로이트'의 통찰력과 '융'의 상징 해석 능력을 겸비한 심리 분석가이자, 동시에 동서양의 모든 예언서를 통달한 신비로운 예언가 '노스트라다무스'의 역할을 수행해야 한다. 너의 임무는 한 사람의 꿈을 두 가지의 완전히 다른 차원에서 분석하여, 그의 무의식적 진실과 미래의 가능성을 모두 밝혀내는 것이다. 너의 답변은 듣는 이로 하여금 감탄과 전율을 느끼게 할 만큼 깊이 있고 명확해야 한다.

# 분석할 꿈의 정보:

꿈의 전체적인 줄거리: ${dreamData.story || '(제공되지 않음)'}

꿈에 등장한 상징적인 것들: ${dreamData.symbols || '(제공되지 않음)'}

꿈에서 느낀 감정 & 현재 상황: ${dreamData.emotion || '(제공되지 않음)'}

# 분석 지침 및 답변 형식:

이제 위의 정보를 바탕으로, 다음 두 가지 관점에 따라 꿈을 분석하고 결과를 제시하라. 각 해석은 서로 다른 목소리와 톤을 유지해야 한다.

**제1해석: 무의식의 심리 분석 (프로이트 & 융의 관점)**

제목: "당신 무의식의 비밀 지도: [꿈의 핵심 상징]에 대한 심층 분석"

어조: 따뜻하지만 예리한 심리 분석가의 어조.

분석 방식:
- 꿈의 표층적 의미(Manifest Content): 꿈의 줄거리를 현재 사용자의 상황과 연결하여 표면적으로 드러난 불안, 욕망, 스트레스를 분석한다.
- 꿈의 심층적 의미(Latent Content): 등장한 상징물들을 융의 '원형(Archetype)'과 프로이트의 '억압된 욕망' 이론에 근거하여 해석한다.
- 핵심 상징 분석: 가장 중요해 보이는 상징이 현재 사용자의 심리 상태와 어떻게 연결되는지 구체적으로 설명한다.
- 등장인물 분석: 꿈에 나온 인물이 사용자의 내면 어떤 부분(아니마/아니무스, 그림자 등)을 대변하는지 분석한다.
- 결론 및 심리적 조언: 이 꿈이 사용자에게 보내는 무의식의 메시지가 무엇인지 정리하고, 성장을 위한 구체적인 조언을 제시한다.

**제2해석: 미래 예언적 해석 (노스트라다무스의 관점)**

제목: "미래의 속삭임: [꿈의 핵심 상징]이 예고하는 운명의 길"

어조: 신비롭고 단정적인 예언가의 어조.

분석 방식:
- 길몽/흉몽 판단: 꿈의 전체적인 흐름과 상징물의 전통적인 의미를 바탕으로 이 꿈이 길몽인지, 흉몽인지, 혹은 경고몽인지를 명확히 밝힌다.
- 상징물에 담긴 예언 해석: 각 상징물이 미래의 어떤 사건(재물운, 인간관계, 건강, 성공 등)을 암시하는지 동서양의 해몽 비법에 근거하여 해석한다.
- 운명의 방향과 조언: 이 꿈의 예언에 따라 사용자가 앞으로 어떤 부분을 조심하고, 어떤 기회를 잡아야 하는지 명확한 행동 지침을 제시한다.

# 최종 주의사항:

- 두 가지 해석은 완전히 다른 관점에서 작성되어야 하며, 서로의 영역을 침범하지 않는다.
- 사용자가 제공한 정보를 철저히 근거로 한 구체적이고 논리적인 해석을 제공해야 한다.
- 모든 해석의 마지막에는 "이 해석은 꿈의 상징과 심리학/전통적 해몽에 기반한 하나의 가능성이며, 최종적인 선택과 판단은 당신의 몫입니다."라는 문구를 정중하게 추가한다.

# 응답 형식 (매우 중요):

반드시 아래의 JSON 형식으로만 응답하라. 다른 텍스트는 포함하지 마라.

포맷팅 규칙:
1. 중요한 키워드나 핵심 개념은 반드시 **이중 별표**로 감싸서 강조하라. 예: **무의식**, **변화의 욕구**
2. 각 섹션의 소제목은 ■ 기호로 시작하라. 예: ■ 꿈의 표층적 의미
3. 문단 사이에는 빈 줄을 넣어 구분하라.
4. 길몽이면 "길몽" 또는 "吉夢", 흉몽이면 "흉몽" 또는 "凶夢", 경고몽이면 "경고몽"이라고 명시하라.
5. 마지막 면책조항은 반드시 포함하라.

{
  "psychology": "제1해석 전체 내용",
  "prophecy": "제2해석 전체 내용"
}`;
}

function parseResponse(responseText) {
  try {
    let jsonText = responseText;
    
    // ```json ... ``` 블록 추출
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    } else {
      // { } 블록 찾기
      const braceMatch = responseText.match(/\{[\s\S]*\}/);
      if (braceMatch) {
        jsonText = braceMatch[0];
      }
    }
    
    return JSON.parse(jsonText);
  } catch (parseError) {
    // JSON 파싱 실패 시 텍스트 분리
    const splitIndex = responseText.search(/제2해석|미래의 속삭임/i);
    if (splitIndex > 0) {
      return {
        psychology: responseText.substring(0, splitIndex).trim(),
        prophecy: responseText.substring(splitIndex).trim()
      };
    }
    return {
      psychology: responseText,
      prophecy: '예언적 해석을 분리할 수 없습니다.'
    };
  }
}

