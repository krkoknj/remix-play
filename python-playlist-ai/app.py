# ai_service/app.py
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict
import uvicorn
from transformers import pipeline

# 1) Pydantic 모델 정의
class Playlist(BaseModel):
    songs: List[str]

# 2) FastAPI 앱 생성
app = FastAPI(
    title="Music Recommendation API",
    version="0.1.0"
)

# 3) 추천 파이프라인 초기화
#    - 'gpt2'는 text2text-generation에서 지원되지 않으므로, T5 계열 모델 사용
recommender = pipeline(
    task="text2text-generation",
    model="t5-small"
)

# 4) 추천 엔드포인트
@app.post(
    "/recommend",
    response_model=List[Dict[str, str]],
    summary="Recommend songs based on a playlist",
    description="Given a list of songs (artist - title), returns a list of recommended songs."
)
async def recommend(data: Playlist):
    # 프롬프트 생성
    prompt = (
        "다음 플레이리스트를 기반으로 5곡 추천해줘:\n" +
        "\n".join(data.songs)
    )
    # 모델 추론
    result = recommender(prompt, max_length=200)
    # 생성된 텍스트 파싱
    generated = result[0]["generated_text"]
    lines = generated.split("\n")

    recommendations = []
    for line in lines:
        if " - " in line:
            artist, title = line.split(" - ", 1)
            recommendations.append({
                "artist": artist.strip(),
                "title": title.strip()
            })
    return recommendations

# 5) uvicorn으로 실행
if __name__ == "__main__":
    # 포트 충돌 시 다른 포트를 지정하거나, 기존 프로세스를 종료하세요
    uvicorn.run(app, host="0.0.0.0", port=8000)

@app.get("/health")
async def health():
    return "OK"

