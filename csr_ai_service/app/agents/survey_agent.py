"""问卷生成 Agent — 调用通义千问根据活动信息自动生成问卷题目"""

import json
import logging
import httpx

from config import DASHSCOPE_API_KEY

logger = logging.getLogger(__name__)

DASHSCOPE_TEXT_API = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"


async def generate_survey(activity_name: str, activity_description: str,
                           template_type: str) -> dict:
    """
    调用通义千问 API 根据活动信息生成问卷。

    Args:
        activity_name: 活动名称
        activity_description: 活动描述
        template_type: 活动模板类型 (BASIC/DONATION/VOLUNTEER/CHECKIN/CUSTOM)

    Returns:
        包含 title、description、questions 的字典
    """
    logger.info("开始生成问卷: activity=%s, type=%s", activity_name, template_type)

    system_prompt = """你是一个专业的CSR活动问卷设计专家。根据提供的活动信息，生成一份结构化的反馈问卷。

要求：
1. 生成一个简洁的问卷标题（不超过30字）
2. 生成一段简短的问卷说明（不超过100字）
3. 生成5-8道题目，混合使用以下题型：
   - RATING: 评分题（1-5分），用于评估满意度、体验等
   - CHOICE: 单选题，提供2-5个选项
   - TEXT: 文本题，用于收集开放性反馈
4. 题目应围绕活动组织、内容质量、参与体验、改进建议等方面
5. 至少包含2道RATING题、1道CHOICE题、1道TEXT题
6. 每道题标注required（必填/非必填），建议大部分为必填

请严格按照以下JSON格式输出，不要包含任何其他内容：
{
  "title": "问卷标题",
  "description": "问卷说明",
  "questions": [
    {
      "questionText": "题目内容",
      "questionType": "RATING",
      "options": null,
      "required": true
    },
    {
      "questionText": "题目内容",
      "questionType": "CHOICE",
      "options": ["选项A", "选项B", "选项C"],
      "required": true
    },
    {
      "questionText": "题目内容",
      "questionType": "TEXT",
      "options": null,
      "required": false
    }
  ]
}"""

    user_prompt = f"""请为以下CSR活动设计反馈问卷：

活动名称：{activity_name}
活动类型：{template_type}
活动描述：{activity_description if activity_description else "无"}"""

    payload = {
        "model": "qwen-plus",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.7,
        "max_tokens": 2000,
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {DASHSCOPE_API_KEY}",
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(DASHSCOPE_TEXT_API, json=payload, headers=headers)

        if resp.status_code != 200:
            error_msg = f"通义千问 API 返回 HTTP {resp.status_code}: {resp.text}"
            logger.error(error_msg)
            raise RuntimeError(error_msg)

        data = resp.json()
        choices = data.get("choices", [])
        if not choices:
            raise RuntimeError(f"API 返回成功但无 choices: {data}")

        content = choices[0].get("message", {}).get("content", "")
        if not content:
            raise RuntimeError(f"API 返回成功但无 content: {data}")

        # 清理可能的 markdown 代码块标记
        content = content.strip()
        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()

        result = json.loads(content)
        logger.info("问卷生成成功: title=%s, questions=%d",
                     result.get("title"), len(result.get("questions", [])))
        return result

    except json.JSONDecodeError as e:
        logger.error("AI 返回内容 JSON 解析失败: %s, content=%s", e, content)
        raise RuntimeError(f"AI 返回内容格式异常: {e}")
    except RuntimeError:
        raise
    except Exception as e:
        error_msg = f"问卷生成异常: {e}"
        logger.error(error_msg)
        raise RuntimeError(error_msg) from e
