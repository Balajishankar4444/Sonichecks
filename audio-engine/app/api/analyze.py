import os
import re
import uuid
import shutil
import asyncio
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Response, status
from fastapi.responses import JSONResponse

from ..config import TEMP_UPLOAD_DIR, MAX_FILE_SIZE_BYTES, ALLOWED_EXTENSIONS
from ..models.results import (
    BatchQCResult,
    FileQCResult,
    BatchSummary,
    QCProfile,
    QCStatus
)
from ..analyzer.file_info import extract_file_info
from ..analyzer.loader import load_audio_file
from ..analyzer.loudness import calculate_loudness
from ..analyzer.peaks import analyze_peaks
from ..analyzer.clipping import detect_clipping
from ..analyzer.silence import analyze_silence
from ..analyzer.consistency import check_batch_consistency
from ..analyzer.qc_engine import get_profile, evaluate_file_qc, BUILTIN_PROFILES
from ..reports.pdf_generator import generate_pdf_report
from ..reports.csv_generator import generate_csv_report

router = APIRouter(prefix="/api", tags=["QC Analysis"])

def sanitize_filename(filename: str) -> str:
    # Keep only safe alphanumeric chars, dots, dashes, underscores
    cleaned = os.path.basename(filename)
    cleaned = re.sub(r'[^a-zA-Z0-9._\-\s]', '', cleaned)
    return cleaned if cleaned else f"audio_{uuid.uuid4().hex[:8]}.wav"

def process_file_synchronously(temp_path: Path, original_filename: str, profile: QCProfile) -> FileQCResult:
    file_id = str(uuid.uuid4())
    try:
        # 1. Metadata info
        file_info = extract_file_info(temp_path)
        file_info.filename = original_filename
        
        # 2. Audio sample data
        audio_data, sample_rate = load_audio_file(temp_path)
        
        # 3. Deterministic analysis pipelines
        loudness = calculate_loudness(audio_data, sample_rate)
        peaks = analyze_peaks(audio_data, sample_rate)
        clipping = detect_clipping(audio_data)
        silence = analyze_silence(audio_data, sample_rate)
        
        # 4. Evaluate against QC Profile
        result = evaluate_file_qc(
            file_id=file_id,
            file_info=file_info,
            loudness=loudness,
            peaks=peaks,
            clipping=clipping,
            silence=silence,
            profile=profile
        )
        return result
    finally:
        # Safe cleanup
        if temp_path.exists():
            try:
                os.remove(temp_path)
            except Exception:
                pass

@router.get("/profiles")
async def list_qc_profiles():
    return [p.model_dump() for p in BUILTIN_PROFILES.values()]

@router.post("/analyze", response_model=FileQCResult)
async def analyze_file(
    file: UploadFile = File(...),
    profile_id: Optional[str] = Form("standard")
):
    safe_name = sanitize_filename(file.filename or "uploaded_file.wav")
    ext = Path(safe_name).suffix.lower()
    
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported format '{ext}'. Supported formats: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    # Save to isolated temp file
    temp_filename = f"{uuid.uuid4().hex}_{safe_name}"
    temp_path = TEMP_UPLOAD_DIR / temp_filename

    try:
        size = 0
        with open(temp_path, "wb") as f:
            while chunk := await file.read(1024 * 1024):  # 1MB chunks
                size += len(chunk)
                if size > MAX_FILE_SIZE_BYTES:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"File exceeds maximum allowed size of {MAX_FILE_SIZE_BYTES // (1024*1024)}MB."
                    )
                f.write(chunk)

        if size == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty (0 bytes)."
            )

        profile = get_profile(profile_id)
        loop = asyncio.get_running_loop()
        result = await loop.run_in_executor(
            None, 
            process_file_synchronously, 
            temp_path, 
            safe_name, 
            profile
        )
        return result

    except HTTPException:
        if temp_path.exists():
            os.remove(temp_path)
        raise
    except Exception as e:
        if temp_path.exists():
            os.remove(temp_path)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unable to analyze audio file '{safe_name}'. {str(e)}"
        )

@router.post("/analyze/batch", response_model=BatchQCResult)
async def analyze_batch(
    files: List[UploadFile] = File(...),
    profile_id: Optional[str] = Form("standard")
):
    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No files were provided for analysis."
        )

    if len(files) > 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Batch limit exceeded. Maximum 50 files per batch."
        )

    profile = get_profile(profile_id)
    saved_temp_files = []

    try:
        # Save all uploaded files safely
        for file in files:
            safe_name = sanitize_filename(file.filename or f"audio_{uuid.uuid4().hex[:6]}.wav")
            ext = Path(safe_name).suffix.lower()
            
            if ext not in ALLOWED_EXTENSIONS:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"File '{safe_name}' has unsupported format '{ext}'."
                )

            temp_filename = f"{uuid.uuid4().hex}_{safe_name}"
            temp_path = TEMP_UPLOAD_DIR / temp_filename
            
            size = 0
            with open(temp_path, "wb") as f:
                while chunk := await file.read(1024 * 1024):
                    size += len(chunk)
                    if size > MAX_FILE_SIZE_BYTES:
                        raise HTTPException(
                            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                            detail=f"File '{safe_name}' exceeds size limit."
                        )
                    f.write(chunk)

            if size == 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"File '{safe_name}' is empty."
                )

            saved_temp_files.append((temp_path, safe_name))

        # Process batch with controlled concurrency (e.g. 4 parallel workers)
        loop = asyncio.get_running_loop()
        file_results: List[FileQCResult] = []

        for temp_path, safe_name in saved_temp_files:
            res = await loop.run_in_executor(
                None,
                process_file_synchronously,
                temp_path,
                safe_name,
                profile
            )
            file_results.append(res)

        # Cross-file consistency analysis
        consistency_issues = check_batch_consistency(file_results)

        # Compute summary
        passed_count = sum(1 for f in file_results if f.overall_status == QCStatus.PASS)
        warn_count = sum(1 for f in file_results if f.overall_status == QCStatus.WARNING)
        failed_count = sum(1 for f in file_results if f.overall_status == QCStatus.FAIL)

        valid_lufs = [f.loudness.integrated_lufs for f in file_results if f.loudness.integrated_lufs is not None and f.loudness.integrated_lufs > -60.0]
        avg_lufs = round(sum(valid_lufs) / len(valid_lufs), 1) if valid_lufs else None

        valid_peaks = [f.peaks.true_peak_dbtp for f in file_results]
        max_tp = max(valid_peaks) if valid_peaks else None
        total_duration = sum(f.file_info.duration_seconds for f in file_results)

        # Batch overall status
        if failed_count > 0:
            batch_status = QCStatus.FAIL
        elif warn_count > 0 or consistency_issues:
            batch_status = QCStatus.WARNING
        else:
            batch_status = QCStatus.PASS

        batch_result = BatchQCResult(
            batch_id=str(uuid.uuid4()),
            created_at=datetime.now(timezone.utc).isoformat(),
            profile_id=profile.profile_id,
            profile_name=profile.name,
            files=file_results,
            consistency_issues=consistency_issues,
            summary=BatchSummary(
                total_files=len(file_results),
                passed=passed_count,
                warnings=warn_count,
                failed=failed_count,
                avg_lufs=avg_lufs,
                highest_true_peak_dbtp=max_tp,
                total_duration_seconds=round(total_duration, 2)
            ),
            overall_status=batch_status
        )

        return batch_result

    finally:
        # Guarantee cleanup of all remaining temp files
        for temp_path, _ in saved_temp_files:
            if temp_path.exists():
                try:
                    os.remove(temp_path)
                except Exception:
                    pass

@router.post("/export/pdf")
async def export_pdf(result: BatchQCResult):
    try:
        pdf_bytes = generate_pdf_report(result)
        filename = f"sonichecks_qc_report_{result.batch_id[:8]}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF report: {str(e)}")

@router.post("/export/csv")
async def export_csv(result: BatchQCResult):
    try:
        csv_text = generate_csv_report(result)
        filename = f"sonichecks_qc_{result.batch_id[:8]}.csv"
        return Response(
            content=csv_text,
            media_type="text/csv",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate CSV report: {str(e)}")
