from typing import List
import pandas as pd
import pygsheets
import git
from argparse import ArgumentParser
from data_handlers import Variables, recipe_to_openai_input, read_yaml
from sheets import get_sheet_as_df
from openai_handler import chat_completion
from sheets import SPREADSHEET_ID, PROMPTS_SHEET_NAME

from uuid import uuid4

repo = git.Repo(search_parent_directories=True)

gc = pygsheets.authorize("client_secret.json")

args = ArgumentParser()
args.add_argument("--recipes", type=str, nargs="+")
args.add_argument("-n", type=int, default=2, nargs="?")


def generate_label_df(recipes: List[str], n: int):
    """
    Takes a list of recipes and generates a DataFrame with n completions for each prompt.
    TODO: better to always join on name and prompt, so not messy to rely on index?
    """
    filled_dfs = []
    for name in recipes:
        recipe = read_yaml(f"recipes/{name}.yml")
        filled_df = prompt_df.copy()
        filled_df["recipe"] = name
        indices, completions, openai_inputs = [], [], []
        for i, row in prompt_df.iterrows():
            variables = Variables(match_name=row["name"], input_str=row["prompt"])
            openai_input = recipe_to_openai_input(recipe, variables)
            completion = chat_completion(openai_input, n)
            completions.extend(completion)
            openai_inputs.extend([openai_input.messages] * n)
            indices.extend([i] * n)
        completion_df = pd.DataFrame(
            data={
                "completion": completions,
                "openai_input": openai_inputs,
                "index": indices,
            }
        )
        completion_df.set_index("index", inplace=True)
        filled_df = filled_df.join(completion_df)  # 1 to n
        filled_df.reset_index(inplace=True)
        filled_dfs.append(filled_df)
    return pd.concat(filled_dfs, ignore_index=True)


if __name__ == "__main__":
    args, _ = args.parse_known_args()
    run_id = str(uuid4())[:7]
    sha = repo.head.object.hexsha

    # read in prompts from prompt sheet
    sh = gc.open_by_key(SPREADSHEET_ID)
    prompt_df = get_sheet_as_df(sh, PROMPTS_SHEET_NAME)
    prompt_df["commit"] = sha
    experiment_wks = sh.add_worksheet(run_id)

    label_df = generate_label_df(args.recipes, args.n)
    experiment_wks.set_dataframe(label_df, (1, 1))
    print(
        f"Generated {len(label_df)} completions for {len(prompt_df)} prompts and {len(args.recipes)} recipes in sheet {run_id}."
    )
