#!/usr/bin/env python3
"""JPEG/PNG → WebP 批量压缩脚本。

默认行为：
    输入  : ../fang/images/work01
    输出  : 网站/assets/projects/dakafeng
    质量  : 90 (高质量，肉眼几乎无损)
    method: 6 (压缩努力级别最高，体积最小，速度较慢)
    保持原尺寸，不缩放
    跳过已存在的 .webp 文件 (使用 --force 可覆盖)

用法：
    cd 网站
    python3 scripts/compress-images.py
    python3 scripts/compress-images.py --quality 88 --force
    python3 scripts/compress-images.py --input /some/dir --output /other/dir
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print(
        "× 需要 Pillow 库，请先安装：python3 -m pip install --user Pillow",
        file=sys.stderr,
    )
    sys.exit(1)

SUPPORTED_SUFFIXES = {".jpg", ".jpeg", ".png"}

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_DIR = SCRIPT_DIR.parent
DEFAULT_INPUT = PROJECT_DIR.parent / "fang" / "images" / "work01"
DEFAULT_OUTPUT = PROJECT_DIR / "assets" / "projects" / "dakafeng"


def human_size(num_bytes: int) -> str:
    units = ["B", "KB", "MB", "GB"]
    size = float(num_bytes)
    for unit in units:
        if size < 1024 or unit == units[-1]:
            return f"{size:6.1f} {unit}"
        size /= 1024
    return f"{size:6.1f} GB"


def compress_one(src: Path, dst: Path, quality: int, method: int) -> tuple[int, int]:
    """压缩一张图片，返回 (源大小, 目标大小)。保持原始像素尺寸。"""
    with Image.open(src) as im:
        im.load()
        # 旋转修正：根据 EXIF 的 Orientation 真实写入像素，避免 WebP 丢方向信息
        try:
            from PIL import ImageOps

            im = ImageOps.exif_transpose(im)
        except Exception:
            pass

        if im.mode == "P":
            im = im.convert("RGBA" if "transparency" in im.info else "RGB")
        elif im.mode == "LA":
            im = im.convert("RGBA")
        elif im.mode == "CMYK":
            im = im.convert("RGB")

        dst.parent.mkdir(parents=True, exist_ok=True)
        im.save(
            dst,
            format="WEBP",
            quality=quality,
            method=method,
        )

    return src.stat().st_size, dst.stat().st_size


def main() -> int:
    parser = argparse.ArgumentParser(
        description="JPEG/PNG → WebP 批量压缩，保持原始像素尺寸。",
    )
    parser.add_argument("--input", default=str(DEFAULT_INPUT), help="源图片目录")
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT), help="WebP 输出目录")
    parser.add_argument("--quality", type=int, default=90, help="质量 0-100，默认 90")
    parser.add_argument(
        "--method",
        type=int,
        default=6,
        choices=range(0, 7),
        help="压缩努力级别 0-6，默认 6",
    )
    parser.add_argument(
        "--force", action="store_true", help="覆盖已存在的 .webp 文件"
    )
    args = parser.parse_args()

    src_dir = Path(args.input).resolve()
    dst_dir = Path(args.output).resolve()

    if not src_dir.is_dir():
        print(f"× 输入目录不存在: {src_dir}", file=sys.stderr)
        return 1

    files = sorted(
        p for p in src_dir.iterdir() if p.suffix.lower() in SUPPORTED_SUFFIXES
    )
    if not files:
        print(f"⚠ 没有找到要压缩的图片: {src_dir}")
        return 0

    print(f"输入  : {src_dir}")
    print(f"输出  : {dst_dir}")
    print(f"质量  : {args.quality}    方法: {args.method}    强制覆盖: {args.force}")
    print("-" * 76)

    total_src = total_dst = 0
    converted = skipped = failed = 0

    for src in files:
        dst = dst_dir / (src.stem + ".webp")
        if dst.exists() and not args.force:
            print(f"=  跳过   {src.name}  → 已存在 {dst.name}")
            skipped += 1
            continue

        try:
            src_size, dst_size = compress_one(src, dst, args.quality, args.method)
        except Exception as exc:  # noqa: BLE001
            print(f"×  失败   {src.name}: {exc}", file=sys.stderr)
            failed += 1
            continue

        total_src += src_size
        total_dst += dst_size
        converted += 1
        ratio = (1 - dst_size / src_size) * 100 if src_size else 0
        print(
            f"+  {src.name:42} {human_size(src_size)} → {human_size(dst_size)}  (-{ratio:5.1f}%)"
        )

    print("-" * 76)
    print(f"转换 {converted} 张，跳过 {skipped} 张，失败 {failed} 张")
    if total_src:
        saved = (1 - total_dst / total_src) * 100
        print(
            f"总计 {human_size(total_src)} → {human_size(total_dst)}    节省 {saved:.1f}%"
        )

    return 0 if failed == 0 else 2


if __name__ == "__main__":
    sys.exit(main())
