"""Prompt 构建与清洗测试"""

import pytest
from app.utils.prompt_builder import (
    sanitize_user_prompt,
    build_poster_prompt,
    STYLE_PROMPTS,
    ACTIVITY_TYPE_PROMPTS,
    UNSAFE_PATTERNS,
    MAX_USER_PROMPT_LENGTH,
)


class TestSanitizeUserPrompt:
    """用户提示词清洗测试"""

    def test_empty_input(self):
        assert sanitize_user_prompt("") == ""
        assert sanitize_user_prompt(None) == ""

    def test_normal_text_passes_through(self):
        text = "A beautiful sunset over the ocean"
        assert sanitize_user_prompt(text) == text

    def test_script_tags_removed(self):
        # 正则 <script[^>]*>.*?</script> 会移除整个 script 块（含内容），这是正确的安全行为
        assert sanitize_user_prompt('<script>alert("xss")</script>hello') == 'hello'

    def test_html_tags_removed(self):
        assert sanitize_user_prompt("<b>bold</b> text") == "bold text"

    def test_javascript_protocol_removed(self):
        assert sanitize_user_prompt('javascript:alert(1)') == 'alert(1)'

    def test_event_handlers_removed(self):
        result = sanitize_user_prompt('onclick=evil() safe text')
        # on\w+\s*= pattern matches event handlers followed by =
        assert 'evil()' in result
        assert 'onclick=' not in result

    def test_combined_unsafe_patterns(self):
        dirty = '<a href="javascript:void(0)" onclick="steal()">Click</a>'
        result = sanitize_user_prompt(dirty)
        assert "<a" not in result
        assert "</a>" not in result
        assert "javascript:" not in result
        assert "onclick=" not in result

    def test_truncation_on_long_input(self):
        long_text = "A" * (MAX_USER_PROMPT_LENGTH + 100)
        result = sanitize_user_prompt(long_text)
        assert len(result) == MAX_USER_PROMPT_LENGTH

    def test_whitespace_trim(self):
        assert sanitize_user_prompt("  hello  ") == "hello"


class TestBuildPosterPrompt:
    """海报 prompt 构建测试"""

    def test_basic_prompt_structure(self):
        prompt = build_poster_prompt(
            activity_name="Test Activity",
            activity_type="BASIC",
            style="minimalist",
        )
        assert "Test Activity" in prompt
        assert "CSR" in prompt
        assert "poster" in prompt.lower()
        assert "minimalist" in prompt

    def test_unknown_style_falls_back_to_minimalist(self):
        prompt = build_poster_prompt(
            activity_name="Test",
            activity_type="BASIC",
            style="nonexistent_style",
        )
        # Should fall back to minimalist keywords
        assert "clean lines" in prompt

    def test_unknown_activity_type_falls_back_to_basic(self):
        prompt = build_poster_prompt(
            activity_name="Test",
            activity_type="NONEXISTENT",
            style="minimalist",
        )
        assert "corporate social responsibility" in prompt.lower()

    def test_user_prompt_appended(self):
        prompt = build_poster_prompt(
            activity_name="Test",
            activity_type="BASIC",
            style="minimalist",
            user_prompt="Make it blue",
        )
        assert "Make it blue" in prompt
        assert "Additional instructions" in prompt

    def test_user_prompt_sanitized_in_build(self):
        prompt = build_poster_prompt(
            activity_name="Test",
            activity_type="BASIC",
            style="minimalist",
            user_prompt='<script>evil()</script>Make it green',
        )
        assert "<script>" not in prompt
        assert "evil()" not in prompt
        assert "Make it green" in prompt

    def test_all_known_styles_have_prompt_fragments(self):
        for style in ["minimalist", "watercolor", "3d", "cartoon", "chinese", "realistic"]:
            assert style in STYLE_PROMPTS, f"Style '{style}' missing from STYLE_PROMPTS"

    def test_all_activity_types_have_prompt_fragments(self):
        for atype in ["BASIC", "DONATION", "VOLUNTEER", "CHECKIN", "CUSTOM"]:
            assert atype in ACTIVITY_TYPE_PROMPTS, f"Activity type '{atype}' missing from ACTIVITY_TYPE_PROMPTS"

    def test_donation_prompt_includes_charity(self):
        prompt = build_poster_prompt(
            activity_name="Donation Drive",
            activity_type="DONATION",
            style="minimalist",
        )
        assert "charity" in prompt.lower() or "donation" in prompt.lower() or "giving" in prompt.lower()

    def test_volunteer_prompt_includes_teamwork(self):
        prompt = build_poster_prompt(
            activity_name="Cleanup Day",
            activity_type="VOLUNTEER",
            style="minimalist",
        )
        assert "volunteer" in prompt.lower() or "community" in prompt.lower()

    def test_chinese_style_includes_traditional(self):
        prompt = build_poster_prompt(
            activity_name="Spring Festival",
            activity_type="BASIC",
            style="chinese",
        )
        assert "Chinese" in prompt or "traditional" in prompt.lower()
