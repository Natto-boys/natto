import pytest
from pathlib import Path

from backend.OCR import OCR, read_from_path

IMAGE_DIR = "tests/images/"

IMAGES = [
    ("nina.jpeg", "Nina", "The award I should be nominated for", "Worlds best Kanye West impersonator"),
    ("eleanor.jpeg", "< Eleanor", "Worst idea I've ever had", "attempt to explain my postdoc to the fam"), # has typo in name
    ("judith.jpeg", "Judith", "I won't shut up about", "The film Aftersun - I saw X the cinema a few weeks ago and it floored H"), # has typos in response
    ("S.png", "S", "Best travel story", "missed my flight to mykonos from grabbing a breakfast burrito"),
    ("maxine.jpeg", "Maxine", "Dating me is like", "cracking your back X"), # has typo in response
    ("karoline.jpeg", "Karoline", "I go crazy for", "Pasta & Campari"),
    ("rachael.jpeg", "Rachael", "All I ask is that you", "Are a sillybilly and also like a northern accent"), # missing  🖖🏾 at end
    # Won't get prompt from this as their like appears above profile
    # ("rachael2.jpeg", "Rachael", "My best Dad joke", "What do you call a Russian with 3 testicles? ........Hudyanick Abolockov!!!!!!!!!!"),
]

@pytest.mark.parametrize(
    "image_path, name, prompt, response", IMAGES
)
def test_image_ocr(image_path, name, prompt, response):
    ocr = OCR()
    image_bytes = read_from_path(Path(IMAGE_DIR + image_path))
    image_text = ocr.get_text_from_image(image_bytes)
    assert image_text.name == name
    assert image_text.prompt == prompt
    assert image_text.response == response