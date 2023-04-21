from dataclasses import dataclass
from typing import Dict, List, Tuple
import yaml

@dataclass
class Recipe:
    max_tokens: int
    model: str
    temperature: float
    user_prompt: str
    variables: List[str]
    system_prompt: str
    example_convos: List[Dict[str, str]]

@dataclass
class OpenAIInput:
    max_tokens: int
    model: str
    temperature: float
    messages: List[Dict[str, str]] # user: or assistant: text

@dataclass
class Variables:
    match_name: str
    input_str: str
    user_name: str = "{NAME}"

def read_yaml(path: str) -> Recipe:
    with open(path, "r") as f:
        return Recipe(**yaml.safe_load(f))


def replace_variables_in_str(
    input_str: str, variables: Variables
) -> str:
    for key, value in variables.__dict__.items():
        input_str = input_str.replace(f"{{{key}}}", value)
    return input_str

def recipe_to_openai_input(recipe: Recipe, variables: Variables) -> OpenAIInput:
    # check all the variables in the recipe are present
    if set(variables.__dict__.keys()) != set(recipe.variables):
            raise ValueError(f"recipe and variables not the same")
    # replace variables in all Recipe strings
    system_prompt = replace_variables_in_str(recipe.system_prompt, variables)
    user_prompt = replace_variables_in_str(recipe.user_prompt, variables)
    example_convos = []
    for convo in recipe.example_convos:
        example_convos.append(
            {
                "input": replace_variables_in_str(convo["input"], variables),
                "output": replace_variables_in_str(convo["output"], variables),
            }
        )
    
    messages = get_chat_messages(user_prompt, system_prompt, example_convos)
    return OpenAIInput(
        recipe.max_tokens, recipe.model, recipe.temperature, messages
    )

def get_chat_messages(
    input_str: str,
    system_prompt: str,
    example_convos: List[Tuple[str, str]],
) -> List[Dict[str, str]]:
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    for convo in example_convos:
        messages.append({"role": "user", "content": convo['input']})
        messages.append({"role": "assistant", "content": convo['output']})
    messages.append({"role": "user", "content": input_str})
    return messages
