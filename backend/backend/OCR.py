import base64
from google.cloud import vision
from google.cloud.vision_v1.types import TextAnnotation
from google.oauth2.credentials import Credentials
import io
import math
import json
from dataclasses import dataclass
import re

from typing import Dict, List, Tuple
from pathlib import Path
from decouple import config

from backend.data.hinge_prompts import ALL_PROMPTS

# Regex to capture 12 or 24 hour time from OCR
TIME_REGEX = r"\b([0-1]?[0-9]|2[0-3]):[0-5][0-9]\b"
# Exclude strings that contain these from being a name (can appear near name)
EXCLUDE_NAMES = [
    r":",
    r"●●●",
]
# Remove the below from potential name strings
REMOVE_NAMES = [
    r"All \(\d+\+?\)"  # appears above name on profiles that already liked you
]


@dataclass
class ImageText:
    """OCR results for image"""

    name: str = ""
    prompt: str = ""
    response: str = ""


def read_from_path(path: Path) -> bytes:
    with io.open(path, "rb") as image_file:
        content = image_file.read()
    return content


def base64_to_bytes(base64_string: str) -> bytes:
    return base64.b64decode(base64_string)


def get_bounding_box_ys(vertices: List) -> Tuple[int]:
    """Returns the min and max y coordinates of a bounding box"""
    ys = [vertex.y for vertex in vertices]
    return min(ys), max(ys)


def check_string_for_exclude(name_str: str, exclude_list: List[str]) -> bool:
    """returns True if name_str does not contain any of the regexes in exclude_list"""
    for regex in exclude_list:
        if re.search(regex, name_str):
            return False
    return True


def remove_from_string(name_str: str, remove_list: List[str]) -> str:
    """Removes any regexes in remove_list from name_str"""
    for regex in remove_list:
        name_str = re.sub(regex, "", name_str)
    return name_str.strip()


class OCR:
    def __init__(self) -> None:
        cred_bytes = base64.b64decode(config("GCP_CRED_JSON_BASE64"))
        cred_json = json.loads(cred_bytes.decode("utf-8"))
        self._creds = Credentials.from_authorized_user_info(cred_json)
        self.client = vision.ImageAnnotatorClient(credentials=self._creds)

    @staticmethod
    def get_block_text(block) -> str:
        """Extracts text from a gcp Vision API block"""
        # TODO: handle line breaks differently?
        # breaks = TextAnnotation.DetectedBreak.BreakType
        # line_breaks = [breaks.LINE_BREAK, breaks.EOL_SURE_SPACE]
        block_text = ""
        for paragraph in block.paragraphs:
            for word in paragraph.words:
                for symbol in word.symbols:
                    block_text += symbol.text
                    if symbol.property.detected_break.type:
                        block_text += " "
        return block_text.strip()

    @staticmethod
    def get_prompt_response(
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
                prompt_str = block_text
                _, prompt_bottom_y = get_bounding_box_ys(block.bounding_box.vertices)
                print(
                    "updating prompt text: " + str(prompt_bottom_y) + " " + prompt_str
                )
                continue
            # if block is prompt AND more (i.e. response), return both
            for prompt in hinge_prompts:
                if prompt in block_text:
                    print("Found prompt and response in block text: " + block_text)
                    return prompt, block_text.replace(prompt, "").strip()
        # if haven't found response, find the text block below the prompt to use as response
        if prompt_str and not response_str:
            for block in blocks:
                block_min_y, _ = get_bounding_box_ys(block.bounding_box.vertices)
                if block_min_y < next_greatest_y and block_min_y > prompt_bottom_y:
                    next_greatest_y = block_min_y
                    response_str = OCR.get_block_text(block)
                    print(
                        "updating response text: "
                        + str(next_greatest_y)
                        + " "
                        + response_str
                    )
        return prompt_str, response_str

    @staticmethod
    def get_status_bar_y(blocks, time_regex: str = TIME_REGEX) -> int | None:
        """
        Find time string e.g. "20:18", and any y overlapping text. Return max y.
        """
        header_bottom_y = -1
        header_str = ""
        # find time string, and save its y position
        for block in blocks:
            block_text = OCR.get_block_text(block)
            if re.search(time_regex, block_text):
                header_str = block_text
                _, header_bottom_y = get_bounding_box_ys(block.bounding_box.vertices)
                print("updating status bar: " + str(header_bottom_y) + " " + header_str)
                break
        # return if no time string found
        else:
            return None
        # extend the header bottom y to include any additional text overlapping the time
        for block in blocks:
            block_text = OCR.get_block_text(block)
            block_min_y, block_max_y = get_bounding_box_ys(block.bounding_box.vertices)
            if block_min_y <= header_bottom_y and block_max_y > header_bottom_y:
                header_bottom_y = block_max_y
                print("updating status bar: " + str(header_bottom_y) + " " + block_text)
        return header_bottom_y

    @staticmethod
    def get_name(
        blocks,
        name_exclude_list: List[str] = EXCLUDE_NAMES,
        remove_list: List[str] = REMOVE_NAMES,
    ) -> str:
        """
        Find next greatest y block from the status bar, which should be name
        """
        next_greatest_y = math.inf
        name_str = ""
        header_bottom_y = OCR.get_status_bar_y(blocks)
        if not header_bottom_y:
            print("No time string found")
            return ""
        # from the header str, find the next greatest y block, which should be the name
        for block in blocks:
            block_text = OCR.get_block_text(block)
            block_min_y, _ = get_bounding_box_ys(block.bounding_box.vertices)
            # remove text from blocks
            block_text = remove_from_string(block_text, remove_list)
            if block_text == "":
                continue
            elif (
                # exclude mistaken OCR that has same y as name
                check_string_for_exclude(block_text, name_exclude_list)
                and block_min_y > header_bottom_y
                and block_min_y < next_greatest_y
            ):
                next_greatest_y = block_min_y
                name_str = block_text
                print("updating name text: " + str(next_greatest_y) + " " + name_str)
            # elif not check_string_for_exclude(block_text, name_exclude_list):
            #     print("Excluding name: " + block_text)
        return name_str

    def get_text_from_image(self, content: bytes) -> ImageText:
        image = vision.Image(content=content)
        response = self.client.text_detection(image=image)
        if response.full_text_annotation:
            blocks = response.full_text_annotation.pages[0].blocks  # always first page
            prompt, response = OCR.get_prompt_response(blocks)
            name = OCR.get_name(blocks)
            return ImageText(name, prompt, response)
        else:
            print("No text from GCP")
            return ImageText()
