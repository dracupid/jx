import cv2
import numpy as np
import argparse
from skimage.metrics import (
    structural_similarity as ssim,
    peak_signal_noise_ratio as psnr,
)
from PIL import Image
import pillow_heif  # 支持 HEIC/AVIF
import imageio  # 生成 GIF

# 注册 HEIC/AVIF 解码器
pillow_heif.register_heif_opener()


def read_image(path):
    """读取 jpg/png/heic/avif，返回 numpy (BGR)"""
    try:
        img = Image.open(path).convert("RGB")
        img = np.array(img)[:, :, ::-1]  # RGB -> BGR
    except Exception as e:
        raise RuntimeError(f"无法读取图片 {path}: {e}")
    return img


def make_diff_visualization(img1, img2, diff_map, mode="heatmap"):
    """
    根据模式生成差异可视化
    mode = heatmap | abs | mask
    """
    if mode == "heatmap":
        diff_map = np.clip((1 - diff_map) * 3, 0, 1)  # 放大差异
        heatmap = cv2.applyColorMap((diff_map * 255).astype("uint8"), cv2.COLORMAP_JET)
        overlay = cv2.addWeighted(img1, 0.7, heatmap, 0.3, 0)
        return overlay

    elif mode == "abs":
        return cv2.absdiff(img1, img2)

    elif mode == "mask":
        diff = cv2.absdiff(img1, img2)
        gray_diff = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY)
        _, mask = cv2.threshold(gray_diff, 25, 255, cv2.THRESH_BINARY)
        highlight = img1.copy()
        highlight[mask > 0] = [0, 0, 255]
        return highlight

    else:
        raise ValueError(f"未知模式: {mode}")


def compare_images(
    img1_path,
    img2_path,
    resize=False,
    diff_out=None,
    side_by_side=None,
    mode="heatmap",
    gif_out=None,
):
    img1 = read_image(img1_path)
    img2 = read_image(img2_path)

    # 如果尺寸不同，是否自动缩放
    if img1.shape != img2.shape:
        if resize:
            h, w = img1.shape[:2]
            img2 = cv2.resize(img2, (w, h))
            print(f"提示: 已将 {img2_path} resize 到 {w}x{h}")
        else:
            raise ValueError("两张图片尺寸不同，请加上 --resize 参数自动缩放。")

    # 转灰度
    gray1 = cv2.cvtColor(img1, cv2.COLOR_BGR2GRAY)
    gray2 = cv2.cvtColor(img2, cv2.COLOR_BGR2GRAY)

    # MSE
    mse = np.mean((gray1 - gray2) ** 2)

    # SSIM + 差异图
    ssim_value, diff_map = ssim(gray1, gray2, full=True)

    # 差异可视化
    vis = make_diff_visualization(img1, img2, diff_map, mode)

    if diff_out:
        cv2.imwrite(diff_out, vis)
        print(f"差异图已保存到 {diff_out} (模式: {mode})")

    # 并排对比
    if side_by_side:
        h = max(img1.shape[0], img2.shape[0], vis.shape[0])
        pad = lambda im: cv2.copyMakeBorder(
            im, 0, h - im.shape[0], 0, 0, cv2.BORDER_CONSTANT, value=(0, 0, 0)
        )
        side_by_side_img = np.hstack((pad(img1), pad(img2), pad(vis)))
        cv2.imwrite(side_by_side, side_by_side_img)
        print(f"并排对比图已保存到 {side_by_side} (模式: {mode})")

    # 动态 GIF
    if gif_out:
        frames = [
            cv2.cvtColor(img1, cv2.COLOR_BGR2RGB),
            cv2.cvtColor(img2, cv2.COLOR_BGR2RGB),
        ]
        imageio.mimsave(gif_out, frames, duration=0.6)  # 每 0.6 秒切换
        print(f"闪烁对比 GIF 已保存到 {gif_out}")

    # PSNR
    psnr_value = psnr(gray1, gray2)

    return mse, ssim_value, psnr_value


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="比较两张图片质量 (支持 JPG/PNG/HEIC/AVIF)"
    )
    parser.add_argument("img1", help="第一张图片路径")
    parser.add_argument("img2", help="第二张图片路径")
    parser.add_argument(
        "--resize", action="store_true", help="当尺寸不同时自动缩放第二张图片"
    )
    parser.add_argument("--diff", help="输出差异图路径 (PNG/JPG)")
    parser.add_argument("--side-by-side", help="输出拼接对比图路径 (PNG/JPG)")
    parser.add_argument(
        "--mode",
        choices=["heatmap", "abs", "mask"],
        default="heatmap",
        help="差异可视化模式",
    )
    parser.add_argument("--gif", help="输出闪烁对比 GIF 路径")
    args = parser.parse_args()

    mse, ssim_value, psnr_value = compare_images(
        args.img1,
        args.img2,
        resize=args.resize,
        diff_out=args.diff,
        side_by_side=args.side_by_side,
        mode=args.mode,
        gif_out=args.gif,
    )

    print("对比结果：")
    print(f"  MSE  = {mse:.4f}   （越小越好，0 表示完全相同）")
    print(f"  SSIM = {ssim_value:.4f} （越接近 1 越好）")
    print(f"  PSNR = {psnr_value:.2f} dB （越大越好，>40 基本无差异）")
