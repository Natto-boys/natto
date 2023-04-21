import pygsheets

from sheets import get_sheet_as_df, SPREADSHEET_ID, PROMPTS_SHEET_NAME
from data_handlers import Variables

gc = pygsheets.authorize("client_secret.json")

def test_iterate_prompt_sheet():
    sh = gc.open_by_key(SPREADSHEET_ID)
    prompt_df = get_sheet_as_df(sh, PROMPTS_SHEET_NAME)
    names, prompts = [], []
    for _, row in prompt_df.iterrows():
        variables = Variables(match_name=row["name"], input_str=row["prompt"])
        names.append(variables.match_name)
        prompts.append(variables.input_str)
    assert len(set(prompts)) == len(prompt_df)
    assert len(set(names)) == len(prompt_df)
