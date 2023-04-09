import base64
from google.cloud import vision
from google.oauth2.credentials import Credentials
import io
import math
import json
from dataclasses import dataclass
import re

from typing import Dict, List, Tuple
from pathlib import Path
from decouple import config

from hinge_prompts import ALL_PROMPTS

# Regex to capture 12 or 24 hour time from OCR
TIME_REGEX = r"([0-1]?[0-9]|2[0-3]):[0-5][0-9]"
EXCLUDE_NAMES = [":", "..."]

@dataclass
class ImageText:
    """OCR results for image"""
    name: str = ""
    prompt: str = ""
    response: str = ""


def get_bounding_box_ys(vertices: List) -> Tuple[int]:
    """Returns the min and max y coordinates of a bounding box"""
    ys = [vertex.y for vertex in vertices]
    return min(ys), max(ys)


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
    ) -> Tuple[str]:
        """
        Heuristic to extract prompt and response from OCR of Hinge profile
        Returns (prompt, response) tuple
        """
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
                            + str(prompt_bottom_y)
                            + " "
                            + prompt_str
                        )
                continue
            # if block is prompt AND more (i.e. response), return both
            for prompt in hinge_prompts:
                if prompt in block_text:
                    print("Found prompt and response in block text: " + block_text)
                    return prompt, block_text.replace(prompt, "").strip()
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
        return prompt_str, response_str

    @staticmethod
    def get_name_from_blocks(
        blocks, name_exclude_list: List[str] = EXCLUDE_NAMES
    ) -> str:
        """
        Find time string e.g. "20:18" and then return next greatest y block, which should be name
        """
        header_bottom_y = -1
        next_greatest_y = math.inf
        header_str = ""
        name_str = ""
        search_additional_header = False
        # find time string, and save its y position
        for block in blocks:
            block_text = OCR.get_block_text(block)
            if re.search(TIME_REGEX, block_text):
                header_str = block_text
                _, header_bottom_y = get_bounding_box_ys(block.bounding_box.vertices)
                print("updating time text: " + str(header_bottom_y) + " " + header_str)
                search_additional_header = True
                break
        # return if no time string found
        else:
            return ""
        # extend the header bottom y to include any additional text overlapping the time
        while search_additional_header:
            for block in blocks:
                block_text = OCR.get_block_text(block)
                block_min_y, block_max_y = get_bounding_box_ys(
                    block.bounding_box.vertices
                )
                if block_min_y <= header_bottom_y and block_max_y > header_bottom_y:
                    header_bottom_y = block_max_y
            else:
                search_additional_header = False
        # from the header str, find the next greatest y block, which should be the name
        for block in blocks:
            block_text = OCR.get_block_text(block)
            block_min_y, block_max_y = get_bounding_box_ys(block.bounding_box.vertices)
            # exclude mistaken OCR that has same y as name
            if (
                block_text not in name_exclude_list
                and block_min_y > header_bottom_y
                and block_min_y < next_greatest_y
            ):
                next_greatest_y = block_min_y
                name_str = block_text
                print("updating name text: " + str(next_greatest_y) + " " + name_str)
        return name_str

    @staticmethod
    def read_from_path(path: Path) -> bytes:
        with io.open(path, "rb") as image_file:
            content = image_file.read()
        return content

    @staticmethod
    def base64_to_bytes(base64_string: str) -> bytes:
        return base64.b64decode(base64_string)

    def get_text_from_image(self, content: bytes) -> ImageText:
        image = vision.Image(content=content)
        response = self.client.text_detection(image=image)
        if response.full_text_annotation:
            blocks = response.full_text_annotation.pages[0].blocks  # always first page
            prompt, response = OCR.get_prompt_response_from_blocks(blocks)                
            name = OCR.get_name_from_blocks(blocks)
            return ImageText(name, prompt, response)
        else:
            print("No text from GCP")
            return ImageText()
