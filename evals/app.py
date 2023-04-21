import streamlit as st
import pygsheets
from argparse import ArgumentParser

from sheets import SPREADSHEET_ID, get_sheet_as_df, save_df_to_sheet

OPTIONS = ["Funny", "Unsure", "Not Funny"]

gc = pygsheets.authorize("client_secret.json")

args = ArgumentParser()
args.add_argument("--sheet", type=str)


def label_rows(df):
    """
    A function that takes a DataFrame and allows users to label each row.
    """
    df["label"] = ""
    for name, prompt in df[["name", "prompt"]].drop_duplicates().values:
        df_subset = df[(df["name"] == name) & (df["prompt"] == prompt)]
        df_subset = df_subset.sample(frac=1)  # shuffle
        # display each row of the subset, with a box to label it
        st.write(f"## {name}")
        st.write(f"**{prompt}**")
        for i, row in df_subset.iterrows():
            st.write(row["completion"])
            label = st.selectbox("label", OPTIONS, key=i, index=1)
            df.loc[i, "label"] = label

    return df


if __name__ == "__main__":
    args, _ = args.parse_known_args()
    sheet_name = args.sheet
    sh = gc.open_by_key(SPREADSHEET_ID)
    prompt_df = get_sheet_as_df(sh, sheet_name)
    with st.form(key="my_form"):
        label_df = label_rows(prompt_df)
        # TODO: save DF on every click not at end
        submit_button = st.form_submit_button(label="Submit")
        if submit_button:
            save_df_to_sheet(sh, label_df, sheet_name)
            st.write("labels saved to google sheets")
