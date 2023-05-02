import re
import pytest

from backend.OCR import TIME_REGEX, EXCLUDE_NAMES, check_string_for_exclude

# Define a list of tuples for valid time strings and expected results
VALID_TIME_STRINGS = [
    ("12:34 am", True),
    ("00:00", True),
    (" 23:59", True),
    ("1:23 PM", True),
    ("02:45", True),
    ("40% 10:00", True),
    ("10:00 pm 40%", True),
]

# Define a list of tuples for invalid time strings and expected results
INVALID_TIME_STRINGS = [
    ("12:60", False),
    ("24:00", False),
    ("00:60", False),
    ("1:5", False),
    ("2:345", False),
    ("12:345", False),
    ("1:2", False),
    ("123", False),
    ("12:", False),
    (":34", False),
    ("12:3a", False),
    ("12:3 4", False),
]


@pytest.mark.parametrize(
    "time_string, expected_result", VALID_TIME_STRINGS + INVALID_TIME_STRINGS
)
def test_time_regex(time_string, expected_result):
    match = re.search(TIME_REGEX, time_string)
    if expected_result:
        assert match is not None
    else:
        assert match is None


# pytest unit test for check_string_for_exclude
NAME_STRING_TUPLES = [
    ("Shanti", True),
    ("owen", True),
    (":", False),
    (": ", False),
    ("●●●", False),
    (" ●●●", False),
    ("All (1)", False),
    ("All (50+)", False),
    ("All", True),
]


@pytest.mark.parametrize("name_string, expected_result", NAME_STRING_TUPLES)
def test_check_string_for_exclude(name_string, expected_result):
    assert check_string_for_exclude(name_string, EXCLUDE_NAMES) == expected_result
