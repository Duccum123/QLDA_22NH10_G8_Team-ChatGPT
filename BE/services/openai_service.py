from google import genai
import re

client = genai.Client(api_key="AIzaSyBjg6kpZ8EXKkCg5C6bDS966BavvVJRb1Q")

def generate_questions(field: str):
    prompt = f"Hãy tạo 5 câu hỏi phỏng vấn {field} bằng tiếng Việt. Trả kết quả dưới dạng chuỗi văn bản, trong đó mỗi câu hỏi bắt đầu bằng số thứ tự (ví dụ: 1. , 2. , 3. ...) để tôi có thể dễ dàng tách từng câu hỏi."
    response = client.models.generate_content(
        model="gemini-2.0-flash", contents= prompt
    )
    cau_hoi = [line.strip().strip('"') for line in response.text.split('\n') if line.strip()]
    return cau_hoi