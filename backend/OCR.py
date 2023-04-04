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
        # cred_json.pop("type") # not accepted by Credentials
        self._creds = Credentials.from_authorized_user_info(cred_json)
        self.client = vision.ImageAnnotatorClient(credentials=self._creds)

    @staticmethod
    def extract_prompt_from_ocr_text(
        ocr_text: str, hinge_prompts: List[str] = ALL_PROMPTS
    ) -> str:
        """Heuristic to extract prompt and response from OCR text of Hinge profile"""
        text_list = ocr_text.split("\n")
        start_index, n = -1, len(text_list)
        for i in range(n):
            if text_list[i] in hinge_prompts:
                start_index = i
            # return concatendated string if reach a line that is len <=1
            if start_index > -1 and len(text_list[i]) <= 1:
                return " ".join(text_list[start_index:i])
        # return all text to end of string if no line is len <=1
        if start_index > -1:
            return " ".join(text_list[start_index:])
        else:
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
        full_text = response.text_annotations[0].description
        return OCR.extract_prompt_from_ocr_text(full_text)
