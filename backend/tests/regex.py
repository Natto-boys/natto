import re
import pytest

from backend.OCR import TIME_REGEX, EXCLUDE_NAMES, REMOVE_NAMES, check_string_for_exclude, remove_from_string


@pytest.mark.parametrize(
    "time_string, expected_result", [
    ("12:34 am", True),
    ("00:00", True),
    (" 23:59", True),
    ("1:23 PM", True),
    ("02:45", True),
    ("40% 10:00", True),
    ("10:00 pm 40%", True),
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
])
def test_time_regex(time_string, expected_result):
    match = re.search(TIME_REGEX, time_string)
    if expected_result:
        assert match is not None
    else:
        assert match is None


# pytest unit test for check_string_for_exclude
@pytest.mark.parametrize("name_string, expected_result", [
    ("Shanti", True),
    ("owen", True),
    (":", False),
    (": ", False),
    ("●●●", False),
    (" ●●●", False),
    ("All (1)", True),
    ("All (50+)", True),
    ("All", True),
])
def test_check_string_for_exclude(name_string, expected_result):
    assert check_string_for_exclude(name_string, EXCLUDE_NAMES) == expected_result


# test for remove_from_string
@pytest.mark.parametrize("name_string, expected_result", [
    ("Shanti", "Shanti"),
    ("owen", "owen"),
    (":", ":"),
    ("All (1)", ""),
    ("All (50+)", ""),
    ("All (23) Jessica", "Jessica"),
    ("All (50+) abe", "abe"),
])
def test_remove_from_string(name_string, expected_result):
    assert remove_from_string(name_string, REMOVE_NAMES) == expected_result