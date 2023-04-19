from dataclasses import dataclass
from typing import Dict, List, Tuple
import yaml

import openai

@dataclass
class Recipe:
    max_tokens: int
    model: str
    temperature: float
    system_prompt: str
    example_convos: List[Dict[str, str]]
    user_prompt: str
    variables: List[str]

@dataclass
class OpenAIInput:
    max_tokens: int
    model: str
    temperature: float
    messages: List[Dict[str, str]] # user: or assistant: text

@dataclass
class Variables:
    match_name: str
    user_name: str = "{NAME}"
    input_str: str

def read_yaml(path: str) -> Recipe:
    with open(path, "r") as f:
        return Recipe(yaml.safe_load(f))


def replace_variables_in_str(
    input_str: str, variables: Variables
) -> str:
    for key, value in variables.__dict__.items():
        input_str = input_str.replace(f"{{{key}}}", value)
    return input_str

def recipe_to_openai_input(recipe: Recipe, variables: Variables) -> OpenAIInput:
    # check all the variables in the recipe are in the variable dict
    for var in recipe.variables:
        if var not in variables:
            raise ValueError(f"Variable {var} not in variable dict")
    # replace variables in all Recipe strings
    recipe.system_prompt = replace_variables_in_str(recipe.system_prompt, variables)
    recipe.user_prompt = replace_variables_in_str(recipe.user_prompt, variables)
    for i, convo in enumerate(recipe.example_convos):
        recipe.example_convos[i]["user"] = replace_variables_in_str(convo["user"], variables)
        recipe.example_convos[i]["assistant"] = replace_variables_in_str(convo["assistant"], variables)
    
    messages = get_chat_messages(recipe.user_prompt, recipe.system_prompt, recipe.example_convos)
    return OpenAIInput(
        recipe.max_tokens, recipe.model, recipe.temperature, messages
    )

def get_chat_messages(
    input_str: str,
    system_prompt: str | None,
    example_convos: List[Tuple[str, str]] | None,
) -> List[Dict[str, str]]:
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    for tup in example_convos:
        messages.append({"role": "user", "content": tup[0]})
        messages.append({"role": "assistant", "content": tup[1]})
    messages.append({"role": "user", "content": input_str})
    return messages


def chat_completion(openai_input: OpenAIInput) -> str:
    completion = openai.ChatCompletion(**openai_input.__dict__)
    # get the last message from the completion
    return completion.choices[0].message.content