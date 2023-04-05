import base64
from google.cloud import vision
from google.oauth2.credentials import Credentials
import io
import json

from typing import List
from pathlib import Path
from decouple import config

from hinge_prompts import ALL_PROMPTS


class OCR:
    def __init__(self) -> None:
        cred_bytes = base64.b64decode(config("GCP_CRED_JSON_BASE64"))
        cred_json = json.loads(cred_bytes.decode("utf-8"))
        self._creds = Credentials.from_authorized_user_info(cred_json)
        self.client = vision.ImageAnnotatorClient(credentials=self._creds)

    @staticmethod
    def extract_prompt_from_full_text(
        full_text_annotation, hinge_prompts: List[str] = ALL_PROMPTS
    ) -> str:
        """Heuristic to extract prompt and response from OCR of Hinge profile"""
        for page in full_text_annotation.pages:
            for block in page.blocks:
                block_text = ""
                for paragraph in block.paragraphs:
                    for word in paragraph.words:
                        for symbol in word.symbols:
                            block_text += symbol.text
                            if symbol.property.detected_break.type:
                                block_text += " "
                for prompt in hinge_prompts:
                    if prompt in block_text:
                        return block_text
        return ""

    @staticmethod
    def read_from_path(path: Path) -> bytes:
        with io.open(path, "rb") as image_file:
            content = image_file.read()
        return content

    @staticmethod
    def base64_to_bytes(base64_string: str) -> bytes:
        return base64.b64decode(base64_string)

    def get_prompt_text(self, content: bytes) -> str:
        image = vision.Image(content=content)
        response = self.client.text_detection(image=image)
        if response.full_text_annotation:
            extract_text = OCR.extract_prompt_from_full_text(
                response.full_text_annotation
            )
            if not extract_text:
                print("No text from heuristic")
            return extract_text
        else:
            print("No text from GCP")
            return ""
