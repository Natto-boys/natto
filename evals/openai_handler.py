from typing import List
import openai
from data_handlers import OpenAIInput

def chat_completion(openai_input: OpenAIInput, n: int) -> List[str]:
    completion = openai.ChatCompletion.create(**openai_input.__dict__, n=n)
    print(completion)
    return [c.message.content for c in completion.choices]