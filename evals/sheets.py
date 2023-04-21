import pandas as pd
from pygsheets import spreadsheet

SPREADSHEET_ID="1bv-5buDx8mqsfPL9S2LE4BQtU_TuDnWEf7uL5YQLi68" # in URL
PROMPTS_SHEET_NAME="prompts"


def get_sheet_as_df(sh: spreadsheet, sheet_name: str) -> pd.DataFrame:
    wks = sh.worksheet_by_title(sheet_name)
    return wks.get_as_df()

def save_df_to_sheet(sh: spreadsheet, df: pd.DataFrame, sheet_name: str) -> None:
    wks = sh.worksheet_by_title(sheet_name)
    wks.set_dataframe(df, (1,1))