from fastapi import APIRouter
from pydantic import BaseModel
from google import genai
import re
client = genai.Client(api_key="AIzaSyBjg6kpZ8EXKkCg5C6bDS966BavvVJRb1Q")

router = APIRouter()

class SummaryInput(BaseModel):
    transcript: str
    emotions: str
    questions: str
    field: str

@router.post("/summary")
async def summarize(input: SummaryInput):
    score = 0
    feedback = []

    prompt = f"""
    Bạn là một chuyên gia tuyển dụng trong lĩnh vực {input.field}. Hãy đánh giá toàn bộ buổi phỏng vấn dựa trên các thông tin sau:

    1. Danh sách các câu hỏi phỏng vấn đã được hỏi.
    2. Câu trả lời của ứng viên tương ứng với từng câu hỏi.
    3. Cảm xúc của ứng viên trong quá trình trả lời từng câu hỏi, ví dụ: "happy", "nervous", "confident", "sad", "angry", "neutral", "surprise", v.v.

    Yêu cầu:

    - Phân tích từng câu hỏi và câu trả lời tương ứng: đánh giá nội dung trả lời có đúng trọng tâm không, có hiểu biết sâu không, có trình bày logic không.
    - Phân tích cảm xúc trong lúc trả lời: ví dụ nếu thường xuyên lo lắng, bối rối hoặc quá tự tin không đúng lúc, cần ghi nhận.
    - Đưa ra nhận xét tổng thể về kỹ năng chuyên môn, kỹ năng giao tiếp và khả năng ứng xử của ứng viên.
    - Tính điểm tổng thể trên thang điểm 100, chia theo các tiêu chí:
    - Nội dung trả lời (50 điểm)
    - Cách trình bày (20 điểm)
    - Ứng xử cảm xúc (15 điểm)
    - Tác phong và thái độ (15 điểm)

    
    **Xuất kết quả dưới định dạng HTML có thể hiển thị trực tiếp trong thẻ `<div>` ở website. Không bao gồm JSON hay code, chỉ là HTML đẹp có thẻ `<h3>`, `<p>`, `<ul>`, ...**

    Cấu trúc mong muốn:

    <h3>Đánh giá tổng quan</h3>
    <p><strong>Tổng điểm:</strong> ... / 100</p>

    <h4>Chi tiết điểm:</h4>
    <ul>
    <li><strong>Nội dung trả lời:</strong> ... / 50</li>
    <li><strong>Trình bày:</strong> ... / 20</li>
    <li><strong>Cảm xúc:</strong> ... / 15</li>
    <li><strong>Thái độ & tác phong:</strong> ... / 15</li>
    </ul>

    <h4>Nhận xét tổng thể</h4>
    <p>...</p>

    <h4>Đề xuất cải thiện</h4>
    <ul>
    <li>...</li>
    <li>...</li>
    </ul>

    <h4>Phân tích theo câu hỏi</h4>
    <ol>
    <li><strong>Câu hỏi 1:</strong> ...</li>
    <li><strong>Câu hỏi 2:</strong> ...</li>
    </ol>

    Dưới đây là dữ liệu đầu vào:

    Câu hỏi: 
    - {input.questions}

    Câu trả lời:
    - {input.transcript}

    Cảm xúc:
    - {input.emotions}
    """

    response = client.models.generate_content(
        model="gemini-2.0-flash", contents= prompt
    )
    text = response.text
    # Xoá các dấu ```html và ```
    cleaned = re.sub(r"```html|```", "", text).strip()
    
    # Tìm tổng điểm: ví dụ chuỗi "Tổng điểm:</strong> 68 / 100"
    match = re.search(r"Tổng điểm:</strong>\s*(\d+)\s*/\s*(\d+)", cleaned)
    if match:
        score = int(match.group(1))
    else:
        score = None

    # Tổng kết
    return {
        "field": input.field,
        "score": score or "N/A",
        "feedback": cleaned
    }
