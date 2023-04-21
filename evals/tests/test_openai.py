
from tests.fixtures import temp_yaml_file, TEST_VARIABLES
from data_handlers import read_yaml, recipe_to_openai_input
from openai_handler import chat_completion

def test_openai_completion(temp_yaml_file):
    recipe = read_yaml(temp_yaml_file)
    openai_input = recipe_to_openai_input(recipe, TEST_VARIABLES)
    completion = chat_completion(openai_input, n=1)
    assert completion