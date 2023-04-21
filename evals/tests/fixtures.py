from data_handlers import Variables
import pytest
import yaml

TEST_VARIABLES = Variables(match_name="name1", input_str="hoo boo doo", user_name="name2")

@pytest.fixture
def temp_yaml_file(tmp_path):
    data = {
        'max_tokens': 100,
        "model": "gpt-3.5-turbo",
        "temperature": 0.9,
        "system_prompt": "System prompt",
        "user_prompt": "{match_name} prompt",
        "example_convos": [
         {"input": "1", "output": "2"},
        ],
        "variables": ["match_name", "input_str", "user_name"]
    }
    file_path = tmp_path / 'data.yaml'
    with open(file_path, 'w') as file:
        yaml.dump(data, file)
    return file_path