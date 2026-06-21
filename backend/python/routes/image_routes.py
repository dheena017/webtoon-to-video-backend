"""
backend/python/routes/image_routes.py
─────────────────────────────────────────────────────────────────────────────
Unified router for all image manipulation operations: editing, stitching,
transforming, splitting, bubble-cleaning, and ZIP packaging.
─────────────────────────────────────────────────────────────────────────────
"""

import time
import logging
import io
import os
import tempfile
import zipfile
import asyncio
from typing import List, Optional, Literal, Dict, Any
from fastapi import APIRouter, HTTPException, Response, Query, Body, Path, Request
from pydantic import BaseModel, Field
from PIL import Image

import utils.image_utils as img_utils
from utils.cache import stitched_cache, edit_history, zip_cache
from services.cleaner import remove_speech_bubbles

logger = logging.getLogger("anivox.routes.image_routes")
router = APIRouter()

# ─── Schemas ──────────────────────────────────────────────────────────────────

class EditImageRequest(BaseModel):
    url: str
    cropTop: Optional[float] = 0.0
    cropBottom: Optional[float] = 0.0
    cropLeft: Optional[float] = 0.0
    cropRight: Optional[float] = 0.0
    autoTrim: Optional[bool] = True
    sensitivity: Optional[float] = None
    padding: Optional[int] = None
    backgroundColorMode: Optional[str] = "auto"
    rotate: Optional[float] = 0.0
    flipHorizontal: Optional[bool] = False
    aspectRatio: Optional[str] = "free"
    outputFormat: Optional[str] = "jpeg"
    cropQuality: Optional[int] = 90

class UndoCropRequest(BaseModel):
    url: str

class TransformImageRequest(BaseModel):
    url: str
    type: Literal["rotate", "flip"]
    value: str

class StitchImagesRequest(BaseModel):
    url1: Optional[str] = None
    url2: Optional[str] = None
    imageUrl1: Optional[str] = None
    imageUrl2: Optional[str] = None
    urls: Optional[List[str]] = None
    layout: Optional[Literal["vertical", "horizontal"]] = "vertical"
    spacing: Optional[int] = 0
    spacingColor: Optional[str] = "white"
    scaleToFit: Optional[bool] = True
    alignMode: Optional[Literal["center", "start", "end"]] = "center"
    padding: Optional[int] = 0

class SplitImagesRequest(BaseModel):
    url: str
    splitLines: List[float]

class DownloadZipRequest(BaseModel):
    urls: List[str]
    url: Optional[str] = None

class RemoveBubblesRequest(BaseModel):
    url: str
    method: Optional[str] = "auto"
    sensitivity: Optional[float] = 50.0
    dilation: Optional[int] = -1
    inpaint_radius: Optional[int] = 3
    detection_style: Optional[str] = "all"


# ─── Image Editing & Transform Routes ──────────────────────────────────────────

@router.post("/edit-image", summary="Crop, rotate, and auto-trim an image panel")
async def edit_image(body: EditImageRequest):
    logger.info(f"[Image Edit] Request received for URL: {body.url[:60]}...")
    try:
        resolved = await img_utils.resolve_image_to_buffer(body.url)
        img_buffer = resolved["data"]
        content_type = resolved["contentType"]

        def edit_sync():
            nonlocal img_buffer, content_type
            # Apply rotation if requested
            rotate_angle = body.rotate
            if rotate_angle and rotate_angle != 0:
                img = Image.open(io.BytesIO(img_buffer))
                img = img.rotate(rotate_angle, expand=True)
                out = io.BytesIO()
                img.save(out, format=img.format or 'JPEG')
                img_buffer = out.getvalue()

            # Apply horizontal flip
            if body.flipHorizontal:
                img = Image.open(io.BytesIO(img_buffer))
                img = img.transpose(Image.FLIP_LEFT_RIGHT)
                out = io.BytesIO()
                img.save(out, format=img.format or 'JPEG')
                img_buffer = out.getvalue()

            # Crop percent-based boxes
            if body.cropTop > 0 or body.cropBottom > 0 or body.cropLeft > 0 or body.cropRight > 0:
                img = Image.open(io.BytesIO(img_buffer))
                w, h = img.size
                
                top_px = int(round((body.cropTop / 100) * h))
                bot_px = int(round((body.cropBottom / 100) * h))
                left_px = int(round((body.cropLeft / 100) * w))
                right_px = int(round((body.cropRight / 100) * w))

                crop_w = w - left_px - right_px
                crop_h = h - top_px - bot_px
                if crop_w > 10 and crop_h > 10:
                    img_cropped = img.crop((left_px, top_px, left_px + crop_w, top_px + crop_h))
                    out = io.BytesIO()
                    img_cropped.save(out, format=img.format or 'JPEG')
                    img_buffer = out.getvalue()

            # Auto trim borders
            if body.autoTrim:
                trimmed = img_utils.crop_auto_borders(
                    img_buffer,
                    tighter=True,
                    crop_padding=body.padding,
                    sensitivity=body.sensitivity,
                    background_color_mode=body.backgroundColorMode,
                    aspect_ratio=body.aspectRatio,
                    output_format=body.outputFormat,
                    crop_quality=body.cropQuality
                )
                img_buffer = trimmed["data"]
                content_type = trimmed["content_type"]
            return img_buffer, content_type

        img_buffer, content_type = await asyncio.to_thread(edit_sync)

        # Cache in memory
        unique_id = f"merged_{int(time.time() * 1000)}_cropped"
        new_url = f"/api/stitch-images/cached/{unique_id}"
        
        stitched_cache.set(unique_id, {"data": img_buffer, "content_type": content_type})
        # Save recipe for re-generation
        recipe = {
            "type": "edit",
            "url": body.url,
            "cropTop": body.cropTop,
            "cropBottom": body.cropBottom,
            "cropLeft": body.cropLeft,
            "cropRight": body.cropRight,
            "autoTrim": body.autoTrim,
            "sensitivity": body.sensitivity,
            "padding": body.padding,
            "backgroundColorMode": body.backgroundColorMode,
            "rotate": body.rotate,
            "flipHorizontal": body.flipHorizontal,
            "aspectRatio": body.aspectRatio,
            "outputFormat": body.outputFormat,
            "cropQuality": body.cropQuality
        }
        edit_history.set(new_url, recipe)

        logger.info(f"[Image Edit] Successfully edited image. Cached as: {new_url}")
        return {"success": True, "url": new_url}
    except Exception as e:
        logger.error(f"[Edit API] Error editing image frame: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Image frame editing failed: {e}")


@router.post("/undo-crop", summary="Restore previous crop state of an edited image")
async def undo_crop(body: UndoCropRequest):
    prev = edit_history.get(body.url)
    if not prev:
        raise HTTPException(status_code=404, detail="No previous crop state found in session history.")
    return {"success": True, "previous_url": prev}


@router.post("/transform-image", summary="Rotate or flip image frame")
async def transform_image(body: TransformImageRequest):
    logger.info(f"[Transform] Request: {body.type} {body.value} for {body.url[:60]}...")
    try:
        resolved = await img_utils.resolve_image_to_buffer(body.url)
        img = Image.open(io.BytesIO(resolved["data"]))

        if body.type == "rotate":
            degrees = int(body.value)
            if degrees not in (90, -90, 180):
                raise HTTPException(status_code=400, detail="Invalid rotation angle. Use 90, -90, or 180.")
            img = img.rotate(degrees, expand=True)
        elif body.type == "flip":
            if body.value == "h":
                img = img.transpose(Image.FLIP_LEFT_RIGHT)
            elif body.value == "v":
                img = img.transpose(Image.FLIP_TOP_BOTTOM)
            else:
                raise HTTPException(status_code=400, detail="Invalid flip axis. Use 'h' or 'v'.")

        out = io.BytesIO()
        img.save(out, format="JPEG", quality=92)
        out_bytes = out.getvalue()

        unique_id = f"transform_{int(time.time() * 1000)}"
        proxy_url = f"/api/stitch-images/cached/{unique_id}"

        stitched_cache.set(unique_id, {"data": out_bytes, "content_type": "image/jpeg"})
        # Save recipe
        recipe = {
            "type": "transform",
            "url": body.url,
            "transform_type": body.type,
            "value": body.value
        }
        edit_history.set(proxy_url, recipe)

        logger.info(f"[Transform] Successfully transformed image. Cached as: {proxy_url}")
        return {"success": True, "url": proxy_url}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Transform API] Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ─── Image Merging & Stacking Routes ───────────────────────────────────────────

@router.post("/merge-images", summary="Stitch multiple panels vertically/horizontally")
@router.post("/stitch-images")
async def merge_images(body: StitchImagesRequest):
    logger.info(f"[Merge] Request received for {len(body.urls) if body.urls else 2} images.")
    try:
        # Build URLs
        urls = body.urls
        if not urls:
            img1 = body.imageUrl1 or body.url1
            img2 = body.imageUrl2 or body.url2
            if img1 and img2:
                urls = [img1, img2]
                
        if not urls or len(urls) < 2:
            raise HTTPException(status_code=400, detail="At least 2 image URLs are required.")

        # Resolve image buffers
        resolved = [await img_utils.resolve_image_to_buffer(u) for u in urls]

        # Use our centralized stitching utility
        merged_bytes = await asyncio.to_thread(
            img_utils.stitch_images_together,
            image_buffers=[r["data"] for r in resolved],
            layout=body.layout,
            spacing=body.spacing,
            spacing_color=body.spacingColor,
            scale_to_fit=body.scaleToFit,
            align_mode=body.alignMode,
            padding=body.padding
        )

        unique_id = f"merged_{int(time.time() * 1000)}_merged"
        new_url = f"/api/stitch-images/cached/{unique_id}"

        stitched_cache.set(unique_id, {"data": merged_bytes, "content_type": "image/png"})
        # Save recipe
        recipe = {
            "type": "merge",
            "urls": urls,
            "layout": body.layout,
            "spacing": body.spacing,
            "spacing_color": body.spacingColor,
            "scale_to_fit": body.scaleToFit,
            "align_mode": body.alignMode,
            "padding": body.padding
        }
        edit_history.set(new_url, recipe)

        logger.info(f"[Merge] Successfully stitched images. Cached as: {new_url}")
        return {"success": True, "url": new_url}
    except Exception as e:
        logger.error(f"[Merge API] Error stitching images: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Image merging failed: {e}")


@router.get("/merge-images/cached/{cache_id}", include_in_schema=False)
@router.get("/stitch-images/cached/{cache_id}", summary="Retrieve stitched cached panel image")
async def get_cached_stitch(cache_id: str = Path(...)):
    cached = stitched_cache.get(cache_id)
    if cached:
        return Response(
            content=cached["data"],
            media_type=cached["content_type"],
            headers={"Cache-Control": "public, max-age=86400"}
        )

    # Standardize on stitch-images prefix for lookups
    cached_url_key = f"/api/stitch-images/cached/{cache_id}"

    # Try alternate prefix for legacy lookups
    legacy_url_key = f"/api/merge-images/cached/{cache_id}"

    # Fallback 1: edit_history (Recipe-based recovery)
    recipe = edit_history.get(cached_url_key) or edit_history.get(legacy_url_key)

    # Fallback 2: SQLite panels table (Simple URL fallback)
    simple_url = None
    if not recipe:
        try:
            import database.db as db
            simple_url = db.get_panel_original_url(cached_url_key) or db.get_panel_original_url(legacy_url_key)
        except Exception:
            pass

    # Recovery Logic
    try:
        recovered_data = None
        content_type = "image/jpeg"

        if recipe and isinstance(recipe, dict):
            logger.info(f"[Cache] MISS for {cache_id} — Regenerating from recipe: {recipe.get('type')}")
            rtype = recipe.get("type")

            if rtype == "edit":
                # Re-run edit_image logic (simplified)
                resolved = await img_utils.resolve_image_to_buffer(recipe["url"])
                img_buffer = resolved["data"]
                content_type = resolved["contentType"]

                def edit_sync():
                    nonlocal img_buffer, content_type
                    img = Image.open(io.BytesIO(img_buffer))
                    # rotate
                    if recipe.get("rotate"):
                        img = img.rotate(recipe["rotate"], expand=True)
                    # flip
                    if recipe.get("flipHorizontal"):
                        img = img.transpose(Image.FLIP_LEFT_RIGHT)
                    # crop
                    if any(recipe.get(k, 0) > 0 for k in ("cropTop", "cropBottom", "cropLeft", "cropRight")):
                        w, h = img.size
                        t = int(round((recipe.get("cropTop", 0) / 100) * h))
                        b = int(round((recipe.get("cropBottom", 0) / 100) * h))
                        l = int(round((recipe.get("cropLeft", 0) / 100) * w))
                        r = int(round((recipe.get("cropRight", 0) / 100) * w))
                        if (w - l - r) > 10 and (h - t - b) > 10:
                            img = img.crop((l, t, w - r, h - b))

                    # Handle aspect ratio adjustment if needed
                    if recipe.get("aspectRatio") and recipe.get("aspectRatio") != "free":
                        # simplified aspect ratio adjustment logic
                        target_w = recipe.get("targetWidth")
                        target_h = recipe.get("targetHeight")
                        if target_w and target_h:
                            img = img_utils.resize_and_pad_pil(img, target_w, target_h)

                    out = io.BytesIO()
                    img.save(out, format=img.format or 'JPEG')
                    img_buffer = out.getvalue()

                    if recipe.get("autoTrim"):
                        trimmed = img_utils.crop_auto_borders(
                            img_buffer,
                            tighter=True,
                            crop_padding=recipe.get("padding"),
                            sensitivity=recipe.get("sensitivity"),
                            background_color_mode=recipe.get("backgroundColorMode"),
                            aspect_ratio=recipe.get("aspectRatio"),
                            output_format=recipe.get("outputFormat"),
                            crop_quality=recipe.get("cropQuality")
                        )
                        img_buffer = trimmed["data"]
                        content_type = trimmed["content_type"]

                    # Final resize/pad if target dimensions provided and not already done
                    if recipe.get("targetWidth") and recipe.get("targetHeight"):
                        img_final = Image.open(io.BytesIO(img_buffer))
                        if img_final.size != (recipe["targetWidth"], recipe["targetHeight"]):
                            img_final = img_utils.resize_and_pad_pil(img_final, recipe["targetWidth"], recipe["targetHeight"])
                            out_final = io.BytesIO()
                            img_final.save(out_final, format='JPEG', quality=recipe.get("cropQuality", 90))
                            img_buffer = out_final.getvalue()

                    return img_buffer, content_type

                recovered_data, content_type = await asyncio.to_thread(edit_sync)

            elif rtype == "transform":
                resolved = await img_utils.resolve_image_to_buffer(recipe["url"])
                img = Image.open(io.BytesIO(resolved["data"]))
                if recipe["transform_type"] == "rotate":
                    img = img.rotate(int(recipe["value"]), expand=True)
                elif recipe["transform_type"] == "flip":
                    axis = Image.FLIP_LEFT_RIGHT if recipe["value"] == "h" else Image.FLIP_TOP_BOTTOM
                    img = img.transpose(axis)
                out = io.BytesIO()
                img.save(out, format="JPEG", quality=92)
                recovered_data = out.getvalue()
                content_type = "image/jpeg"

            elif rtype == "merge":
                resolved = [await img_utils.resolve_image_to_buffer(u) for u in recipe["urls"]]
                recovered_data = await asyncio.to_thread(
                    img_utils.stitch_images_together,
                    image_buffers=[r["data"] for r in resolved],
                    layout=recipe["layout"],
                    spacing=recipe["spacing"],
                    spacing_color=recipe["spacing_color"],
                    scale_to_fit=recipe["scale_to_fit"],
                    align_mode=recipe["align_mode"],
                    padding=recipe["padding"]
                )
                content_type = "image/png"

            elif rtype == "split":
                resolved = await img_utils.resolve_image_to_buffer(recipe["url"])
                img = Image.open(io.BytesIO(resolved["data"]))
                w, h = img.size
                t_pct, b_pct = recipe["range"]
                t_px = int(round((t_pct / 100.0) * h))
                b_px = int(round((b_pct / 100.0) * h))
                seg_img = img.crop((0, t_px, w, b_px))
                out = io.BytesIO()
                seg_img.save(out, format="JPEG", quality=90)
                recovered_data = out.getvalue()
                content_type = "image/jpeg"

            elif rtype == "clean":
                resolved = await img_utils.resolve_image_to_buffer(recipe["url"])
                with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_in:
                    tmp_in.write(resolved["data"])
                    tmp_in_path = tmp_in.name
                tmp_out_path = tmp_in_path.replace(".png", "_out.png")
                try:
                    await asyncio.to_thread(
                        remove_speech_bubbles,
                        image_path=tmp_in_path,
                        output_path=tmp_out_path,
                        method=recipe.get("method"),
                        sensitivity=recipe.get("sensitivity"),
                        dilation=recipe.get("dilation"),
                        inpaint_radius=recipe.get("inpaint_radius"),
                        detection_style=recipe.get("detection_style")
                    )
                    with open(tmp_out_path, "rb") as f:
                        recovered_data = f.read()
                    content_type = resolved["contentType"]
                finally:
                    for p in (tmp_in_path, tmp_out_path):
                        if os.path.exists(p): os.remove(p)

        elif simple_url:
            logger.info(f"[Cache] MISS for {cache_id} — re-fetching simple URL: {simple_url[:60]}")
            resolved = await img_utils.resolve_image_to_buffer(simple_url)
            recovered_data = resolved["data"]
            content_type = resolved.get("contentType", "image/jpeg")

        if recovered_data:
            stitched_cache.set(cache_id, {"data": recovered_data, "content_type": content_type})
            return Response(
                content=recovered_data,
                media_type=content_type,
                headers={"Cache-Control": "public, max-age=86400"}
            )
    except Exception as e:
        logger.error(f"[Cache Recovery] Failed for {cache_id}: {e}", exc_info=True)

    raise HTTPException(status_code=404, detail="Stitched resource expired or not found.")


# ─── Image Splitting Route ─────────────────────────────────────────────────────

@router.post("/execute-splits", summary="Split strip image into separate panels")
async def execute_splits(body: SplitImagesRequest):
    logger.info(f"[Split] Request received for URL: {body.url[:60]}... with {len(body.splitLines)} split lines.")
    try:
        resolved = await img_utils.resolve_image_to_buffer(body.url)
        img = Image.open(io.BytesIO(resolved["data"]))
        w, h = img.size

        if w <= 0 or h <= 0:
            raise HTTPException(status_code=400, detail="Unable to read image dimensions.")

        ys = [max(0.0, min(100.0, float(n))) for n in body.splitLines]
        # Include edges, sort, and remove duplicates
        boundaries = sorted(list(set([0.0] + ys + [100.0])))

        min_segment_height_px = 20
        urls = []

        def split_sync():
            res_urls = []
            for i in range(len(boundaries) - 1):
                top_pct = boundaries[i]
                bot_pct = boundaries[i + 1]

                seg_top_px = int(round((top_pct / 100.0) * h))
                seg_bot_px = int(round((bot_pct / 100.0) * h))
                seg_h_px = seg_bot_px - seg_top_px

                if seg_h_px < min_segment_height_px:
                    continue

                seg_img = img.crop((0, seg_top_px, w, seg_top_px + seg_h_px))
                out = io.BytesIO()
                seg_img.save(out, format="JPEG", quality=90)
                seg_bytes = out.getvalue()

                # Trim margins conservatively
                try:
                    trimmed = img_utils.crop_auto_borders(
                        seg_bytes,
                        tighter=True,
                        crop_padding=0,
                        sensitivity=30.0,
                        background_color_mode='auto',
                        aspect_ratio='free',
                        output_format='jpeg',
                        crop_quality=90
                    )
                    seg_bytes = trimmed["data"]
                except Exception:
                    pass

                cache_id = f"split_{int(time.time() * 1000)}_{i}"
                new_url = f"/api/stitch-images/cached/{cache_id}"

                stitched_cache.set(cache_id, {"data": seg_bytes, "content_type": "image/jpeg"})
                # Save recipe
                recipe = {
                    "type": "split",
                    "url": body.url,
                    "range": (top_pct, bot_pct)
                }
                edit_history.set(new_url, recipe)
                res_urls.append(new_url)
            return res_urls

        urls = await asyncio.to_thread(split_sync)
        logger.info(f"[Split] Successfully split image into {len(urls)} segments.")
        return {"success": True, "urls": urls}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Split API] failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ─── ZIP Packager Routes ────────────────────────────────────────────────────────
@router.post("/download-zip", summary="Create ZIP archive containing storyboard panels")
async def download_zip(body: DownloadZipRequest):
    logger.info(f"[ZIP API] Request received for {len(body.urls)} image URLs. url={body.url}")
    try:
        # Resolve all buffers asynchronously first
        resolved_buffers = []
        for url in body.urls:
            try:
                resolved = await img_utils.resolve_image_to_buffer(url)
                resolved_buffers.append(resolved)
            except Exception as ex:
                logger.warning(f"[ZIP API] Failed to resolve URL: {url} | {ex}")

        # Package ZIP in-memory on a background thread
        def generate_zip_sync():
            zip_buffer = io.BytesIO()
            with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
                for idx, resolved in enumerate(resolved_buffers):
                    ext = "jpg"
                    ct = resolved.get("content_type") or resolved.get("contentType") or ""
                    if "png" in ct:
                        ext = "png"
                    elif "webp" in ct:
                        ext = "webp"
                    elif "gif" in ct:
                        ext = "gif"
                        
                    filename = f"panel_{idx + 1:03d}.{ext}"
                    zip_file.writestr(filename, resolved["data"])
            return zip_buffer.getvalue()

        zip_bytes = await asyncio.to_thread(generate_zip_sync)
        
        # Build custom filename
        zip_filename = "comic_panels_archive.zip"
        if body.url:
            try:
                import re
                from utils.url_utils import parse_webtoon_url
                
                parsed = parse_webtoon_url(body.url)
                
                def make_safe_filename(name: str) -> str:
                    cleaned = re.sub(r'[^\w\s-]', '', name)
                    cleaned = re.sub(r'[-\s]+', '_', cleaned)
                    return cleaned.strip('_')
                
                source = make_safe_filename(parsed.get("source_name", "Source"))
                title = make_safe_filename(parsed.get("title", "Manhwa"))
                episode = make_safe_filename(parsed.get("episode", "Chapter"))
                
                if source or title or episode:
                    parts = []
                    if source and source.lower() != "custom_source" and source.lower() != "custom":
                        parts.append(source)
                    if title and title.lower() != "custom_storyboard" and title.lower() != "comic":
                        parts.append(title)
                    if episode and episode.lower() != "dynamic_chapter":
                        parts.append(episode)
                    
                    if parts:
                        zip_filename = "_".join(parts) + ".zip"
            except Exception as e:
                logger.warning(f"[ZIP API] Failed to construct safe filename from URL: {e}")

        zip_id = f"zip_{int(time.time() * 1000)}"
        zip_cache.set(zip_id, {"data": zip_bytes, "filename": zip_filename})

        logger.info(f"[ZIP API] Successfully generated ZIP archive with ID: {zip_id}, filename: {zip_filename}")
        return {"success": True, "downloadUrl": f"/api/download-zip/get/{zip_id}", "filename": zip_filename}
    except Exception as e:
        logger.error(f"[ZIP API Error] Generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"ZIP packaging failed: {e}")


@router.get("/download-zip/get/{zip_id}", summary="Download packaged ZIP archive")
async def get_download_zip(zip_id: str = Path(...)):
    cached = zip_cache.get(zip_id)
    if not cached:
        raise HTTPException(
            status_code=404, 
            detail="The requested ZIP archive has expired or was not found. Please package again."
        )
        
    if isinstance(cached, dict):
        buffer = cached["data"]
        filename = cached.get("filename", "comic_panels_archive.zip")
    else:
        buffer = cached
        filename = "comic_panels_archive.zip"
        
    return Response(
        content=buffer,
        media_type="application/zip",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )
# ─── Speech Bubble Removal Route (migrated from Express image/cleanup.ts) ──────

@router.post("/remove-speech-bubbles", summary="Inpaint speech bubbles out of a panel image")
async def bubble_cleaning(body: RemoveBubblesRequest):
    logger.info(f"[Bubble Cleaner] Request received for URL: {body.url[:60]}...")
    try:
        # 1. Resolve image
        resolved = await img_utils.resolve_image_to_buffer(body.url)
        content_type = resolved["contentType"]
        
        # 2. Write to temp file
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_in:
            tmp_in.write(resolved["data"])
            tmp_in_path = tmp_in.name
            
        tmp_out_path = tmp_in_path.replace(".png", "_out.png")
        
        try:
            # 3. Call services/cleaner remove_speech_bubbles directly (no subprocess!)
            detected = await asyncio.to_thread(
                remove_speech_bubbles,
                image_path=tmp_in_path,
                output_path=tmp_out_path,
                method=body.method,
                sensitivity=body.sensitivity,
                dilation=body.dilation,
                inpaint_radius=body.inpaint_radius,
                detection_style=body.detection_style
            )
            
            with open(tmp_out_path, "rb") as f:
                cleaned_bytes = f.read()
                
            cache_id = f"merged_{int(time.time() * 1000)}_cleaned"
            new_url = f"/api/stitch-images/cached/{cache_id}"
            
            stitched_cache.set(cache_id, {"data": cleaned_bytes, "content_type": content_type})
            # Save recipe
            recipe = {
                "type": "clean",
                "url": body.url,
                "method": body.method,
                "sensitivity": body.sensitivity,
                "dilation": body.dilation,
                "inpaint_radius": body.inpaint_radius,
                "detection_style": body.detection_style
            }
            edit_history.set(new_url, recipe)
            
            logger.info(f"[Bubble Cleaner] Successfully cleaned bubbles. Cached as: {new_url}")
            return {"success": True, "url": new_url}
        finally:
            # Cleanup temp files
            for p in (tmp_in_path, tmp_out_path):
                try:
                    if os.path.exists(p):
                        os.remove(p)
                except OSError:
                    pass
    except Exception as e:
        logger.error(f"[Bubble Cleaner API Error] failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Speech bubble cleaning failed: {e}")
