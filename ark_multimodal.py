"""
火山方舟 ARK 多模态图文对话封装（OpenAI 兼容 SDK）
===================================================
使用 openai Python SDK 调用 Doubao-vision-pro-32k 视觉模型。
支持流式输出与一次性返回两种模式。

环境变量:
  ARK_API_KEY  - 火山方舟的 API Key（必填）
  ARK_ENDPOINT - API 基础地址（可选，默认 https://ark.cn-beijing.volces.com/api/v3）
  ARK_MODEL   - 推理接入点 ID（可选，默认 ep-20260706162916-cwsp4）

重要:
  model 参数必须使用火山方舟后台生成的 ep-xxx 推理接入点 ID，
  禁止填写原始模型名 doubao-vision-pro-32k。
"""

import os
import base64
from openai import OpenAI

# ============================================================
# 配置
# ============================================================
ARK_API_KEY  = os.environ.get("ARK_API_KEY", "")
ARK_ENDPOINT = os.environ.get("ARK_ENDPOINT", "https://ark.cn-beijing.volces.com/api/v3")
# ⚠️ 替换为你在火山方舟后台为 Doubao-vision-pro-32k 创建的推理接入点 ID
ARK_MODEL    = os.environ.get("ARK_MODEL", "ep-20260706162916-cwsp4")

if not ARK_API_KEY:
    raise ValueError("请设置环境变量 ARK_API_KEY")

# ============================================================
# 客户端初始化
# ============================================================
client = OpenAI(
    api_key=ARK_API_KEY,
    base_url=ARK_ENDPOINT,
)


# ============================================================
# 构建多模态消息
# ============================================================
def build_multimodal_content(prompt_text: str, image_path: str = None, image_url: str = None) -> list:
    """
    构建多模态 content 数组（text + image_url）。

    参数:
      prompt_text: 文本提示词
      image_path:  本地图片路径（与 image_url 二选一）
      image_url:   图片网络 URL（与 image_path 二选一）
    """
    content = [{"type": "text", "text": prompt_text}]

    if image_path:
        with open(image_path, "rb") as f:
            img_data = base64.b64encode(f.read()).decode("utf-8")
        ext = os.path.splitext(image_path)[1].lstrip(".").lower()
        if ext == "jpg": ext = "jpeg"
        img_url = f"data:image/{ext};base64,{img_data}"
        content.append({"type": "image_url", "image_url": {"url": img_url, "detail": "high"}})
    elif image_url:
        content.append({"type": "image_url", "image_url": {"url": image_url, "detail": "high"}})
    else:
        raise ValueError("请提供 image_path 或 image_url")

    return content


# ============================================================
# 一次性返回（非流式）
# ============================================================
def describe_image(
    prompt_text: str,
    image_path: str = None,
    image_url: str = None,
    max_tokens: int = 4096,
    temperature: float = 0.3,
) -> str:
    """
    调用视觉模型生成图片描述（一次性完整返回）。
    """
    content = build_multimodal_content(prompt_text, image_path, image_url)

    resp = client.chat.completions.create(
        model=ARK_MODEL,
        messages=[{"role": "user", "content": content}],
        max_tokens=max_tokens,
        temperature=temperature,
        stream=False,
    )

    return resp.choices[0].message.content


# ============================================================
# 流式输出
# ============================================================
def describe_image_stream(
    prompt_text: str,
    image_path: str = None,
    image_url: str = None,
    max_tokens: int = 4096,
    temperature: float = 0.3,
):
    """
    调用视觉模型生成图片描述（流式逐段返回）。
    使用 yield 逐块输出内容。
    """
    content = build_multimodal_content(prompt_text, image_path, image_url)

    stream = client.chat.completions.create(
        model=ARK_MODEL,
        messages=[{"role": "user", "content": content}],
        max_tokens=max_tokens,
        temperature=temperature,
        stream=True,
    )

    for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta


# ============================================================
# 构建提示词（使用你的模板）
# ============================================================
PROMPT_TEMPLATE = (
    '请用JSON格式详细描述这幅图。\n'
    '要求：\n'
    '1. 保留人物种族、性别、年龄、外貌特征、无纹身，动作、表情、姿态\n'
    '2. 保留场景环境\n'
    '3. 保留构图方式\n'
    '4. 保留镜头语言\n'
    '5. 保留光影氛围\n'
    '6. 保留色彩风格\n'
    '但不要描述人物当前上衣穿着的服装。请将服装上衣的描述替换为以下产品：\n'
    '"{product}"\n'
    '输出完整中文版JSON。'
)


def build_prompt(product: str = "上衣：图中的上衣") -> str:
    """构建提示词，product 为要替换的产品描述"""
    return PROMPT_TEMPLATE.format(product=product)


# ============================================================
# 使用示例
# ============================================================
if __name__ == "__main__":
    import sys

    prompt = build_prompt("上衣：图中的上衣")

    if len(sys.argv) > 1:
        image_input = sys.argv[1]
        is_url = image_input.startswith("http://") or image_input.startswith("https://")
        use_stream = "--stream" in sys.argv

        if use_stream:
            print("=== 流式输出 ===")
            result = ""
            for chunk in describe_image_stream(
                prompt_text=prompt,
                image_url=image_input if is_url else None,
                image_path=None if is_url else image_input,
            ):
                print(chunk, end="", flush=True)
                result += chunk
            print()
        else:
            print("=== 一次性输出 ===")
            result = describe_image(
                prompt_text=prompt,
                image_url=image_input if is_url else None,
                image_path=None if is_url else image_input,
            )
            print(result)
    else:
        print("用法: python ark_multimodal.py <图片路径或URL> [--stream]", file=sys.stderr)
        print("示例:", file=sys.stderr)
        print("  python ark_multimodal.py ./demo.jpg", file=sys.stderr)
        print("  python ark_multimodal.py https://example.com/photo.jpg --stream", file=sys.stderr)
        sys.exit(1)
