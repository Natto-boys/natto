# CLI script that takes list of yaml files and writes the output to a Google Sheet
import sys
import openai
import pandas as pd
import pygsheets
from argparse import ArgumentParser
from evals.data_handlers import OpenAIInput, Variables, recipe_to_openai_input, read_yaml


SPREADSHEET_ID="1Z"
PROMPTS_SHEET_NAME="Prompts"
WRITE_SHEET_NAME="Sheet1"

def chat_completion(openai_input: OpenAIInput) -> str:
    completion = openai.ChatCompletion(**openai_input.__dict__)
    return completion.choices[0].message.content

gc = pygsheets.authorize("client_secret.json")

args = ArgumentParser()
args.add_argument("recipes", nargs="+")


if __name__ == "__main__":
    args = args.parse_args()
    # read in prompts from prompt sheet
    sh = gc.open_by_key(SPREADSHEET_ID)
    wks = sh.worksheet_by_title(PROMPTS_SHEET_NAME)
    prompts = wks.get_as_df() # TODO: make sure this has name and prompt
    # prompts = wks.get_all_values()
    filled_dfs = []
    for path in args.recipes:
        recipe = read_yaml(f"recipes/{path}.yml")
        filled_df = prompts.copy()
        completions, openai_inputs = [], []
        for _, row in prompts.iterrows():
            variables = Variables(row["name"], input_str=row["prompt"])
            openai_input = recipe_to_openai_input(recipe, variables)
            completion = chat_completion(openai_input)
            completions.append(completion)
            openai_inputs.append(openai_input)
        filled_df["completion"] = completions
        filled_df["messages"] = [input.messages for input in openai_inputs]
        filled_dfs.append(filled_df)
    total_df = pd.concat(filled_dfs)
    # write total_df to sheet







    sh = gc.open_by_key(SPREADSHEET_ID)
    wks = sh.worksheet_by_title(SHEET_NAME)
    wks.update_value("A1", "Hello World!")
    print(wks.get_value("A1"))
    print(wks.get_values("A1", "B1"))
    print(wks.get_all_values())