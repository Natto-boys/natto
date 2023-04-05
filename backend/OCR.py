import base64
from google.cloud import vision
from google.oauth2.credentials import Credentials
import io
import math
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
    def get_block_text(block) -> str:
        """Extracts text from a gcp Vision API block"""
        block_text = ""
        for paragraph in block.paragraphs:
            for word in paragraph.words:
                for symbol in word.symbols:
                    block_text += symbol.text
                    if symbol.property.detected_break.type:
                        block_text += " "
        return block_text.strip()

    @staticmethod
    def get_prompt_response_from_blocks(
        blocks, hinge_prompts: List[str] = ALL_PROMPTS
    ) -> str:
        """Heuristic to extract prompt and response from OCR of Hinge profile"""
        prompt_bottom_y = -1
        next_greatest_y = math.inf
        prompt_str = ""
        response_str = ""
        for block in blocks:
            block_text = OCR.get_block_text(block)
            # if block is just prompt, store it, then find response in next greatest y block
            if block_text in hinge_prompts:
                for vertex in block.bounding_box.vertices:
                    if vertex.y > prompt_bottom_y:
                        prompt_bottom_y = vertex.y
                        prompt_str = block_text
                        print(
                            "updating prompt text: "
                            + prompt_str
                            + " "
                            + str(prompt_bottom_y)
                        )
                continue
            # if block is prompt AND more (i.e. response), return both
            for prompt in hinge_prompts:
                if prompt in block_text:
                    print("Found prompt and response in block text: " + block_text)
                    return block_text
            # if have seen just prompt previously, store y coordinates and text to find response
            if prompt_str:
                for vertex in block.bounding_box.vertices:
                    if vertex.y < next_greatest_y and vertex.y > prompt_bottom_y:
                        next_greatest_y = vertex.y
                        response_str = block_text
                        print(
                            "updating response text: "
                            + str(next_greatest_y)
                            + " "
                            + response_str
                        )
        if prompt_str:
            print("Combining prompt and response: ")
            return prompt_str + " " + response_str
        return ""

    @staticmethod
    def read_from_path(path: Path) -> bytes:
        with io.open(path, "rb") as image_file:
            content = image_file.read()
        return content

    @staticmethod
    def base64_to_bytes(base64_string: str) -> bytes:
        return base64.b64decode(base64_string)

    def get_text_from_image(self, content: bytes) -> str:
        image = vision.Image(content=content)
        response = self.client.text_detection(image=image)
        if response.full_text_annotation:
            extract_text = OCR.get_prompt_response_from_blocks(
                response.full_text_annotation.pages[0].blocks  # always first page
            )
            if not extract_text:
                print("No text from heuristic")
            return extract_text
        else:
            print("No text from GCP")
            return ""
