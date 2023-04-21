import pytest

from data_handlers import read_yaml, recipe_to_openai_input, replace_variables_in_str, Variables
from tests.fixtures import temp_yaml_file, TEST_VARIABLES

def test_read_yaml(temp_yaml_file):
    recipe = read_yaml(temp_yaml_file)
    assert recipe.max_tokens == 100
    assert recipe.model == "gpt-3.5-turbo"
    assert recipe.temperature == 0.9
    assert recipe.system_prompt == "System prompt"
    assert recipe.user_prompt == "{match_name} prompt"
    assert recipe.example_convos == [{"input": "1", "output": "2"}]
    assert recipe.variables == ["match_name", "input_str", "user_name"]

@pytest.mark.parametrize(
    "to_change_str, variables, expected",
    [
        ("Hello {user_name}", TEST_VARIABLES, "Hello name2"),
        ("Hello {match_name}", TEST_VARIABLES, "Hello name1"),
        ("Hello {match_name} {input_str}", TEST_VARIABLES, "Hello name1 hoo boo doo"),
    ]
)
def test_replace_variables_in_str(to_change_str, variables, expected):
    assert replace_variables_in_str(to_change_str, variables) == expected

# def test_replace_variables_in_str_error():
#     variables = Variables("match_name", "input_str", "user_name")
#     with pytest.raises(ValueError):
#         replace_variables_in_str("Hello {NAME} {INPUT_STR}", variables)

def test_recipe_to_openai_input(temp_yaml_file, variables: Variables = TEST_VARIABLES):
    recipe = read_yaml(temp_yaml_file)
    openai_input = recipe_to_openai_input(recipe, variables)
    assert openai_input.max_tokens == 100
    assert openai_input.model == "gpt-3.5-turbo"
    assert openai_input.temperature == 0.9
    assert openai_input.messages == [
        {"role": "system", "content":"System prompt"},
        {"role": "user", "content":"1"},
        {"role": "assistant", "content": "2"},
        {"role": "user", "content": "name1 prompt"},
    ]