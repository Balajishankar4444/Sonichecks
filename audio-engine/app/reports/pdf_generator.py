import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
    KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from ..models.results import BatchQCResult, QCStatus

def generate_pdf_report(batch_result: BatchQCResult) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#0f172a"),
        fontName='Helvetica-Bold'
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#64748b"),
        fontName='Helvetica'
    )
    
    section_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontSize=13,
        leading=17,
        textColor=colors.HexColor("#1e293b"),
        fontName='Helvetica-Bold',
        spaceBefore=12,
        spaceAfter=6
    )

    cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#334155")
    )
    
    cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=cell_style,
        fontName='Helvetica-Bold'
    )

    story = []

    # 1. Header Banner
    header_data = [
        [
            Paragraph("<b>SONICHECKS</b> &bull; Audio Quality Control Report", title_style),
            Paragraph(f"<b>Date:</b> {datetime.now().strftime('%Y-%m-%d %H:%M')}<br/><b>Batch ID:</b> {batch_result.batch_id[:8]}", subtitle_style)
        ]
    ]
    header_table = Table(header_data, colWidths=[360, 180])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0ea5e9"), spaceBefore=2, spaceAfter=12))

    # 2. Executive Summary Box
    status_bg = "#ecfdf5" if batch_result.overall_status == QCStatus.PASS else ("#fffbeb" if batch_result.overall_status == QCStatus.WARNING else "#fef2f2")
    status_color = "#059669" if batch_result.overall_status == QCStatus.PASS else ("#d97706" if batch_result.overall_status == QCStatus.WARNING else "#dc2626")
    
    verdict_text = f"<font size='14' color='{status_color}'><b>OVERALL VERDICT: {batch_result.overall_status.value}</b></font>"
    summary_html = f"""
    <b>Profile:</b> {batch_result.profile_name}<br/>
    <b>Total Files Checked:</b> {batch_result.summary.total_files} &nbsp;|&nbsp; 
    <b>Passed:</b> <font color='#059669'>{batch_result.summary.passed}</font> &nbsp;|&nbsp; 
    <b>Warnings:</b> <font color='#d97706'>{batch_result.summary.warnings}</font> &nbsp;|&nbsp; 
    <b>Failed:</b> <font color='#dc2626'>{batch_result.summary.failed}</font><br/>
    <b>Average Loudness:</b> {batch_result.summary.avg_lufs if batch_result.summary.avg_lufs is not None else 'N/A'} LUFS &nbsp;|&nbsp; 
    <b>Highest Peak:</b> {batch_result.summary.highest_true_peak_dbtp if batch_result.summary.highest_true_peak_dbtp is not None else 'N/A'} dBTP &nbsp;|&nbsp; 
    <b>Total Duration:</b> {round(batch_result.summary.total_duration_seconds, 1)}s
    """

    summary_box_data = [
        [Paragraph(verdict_text, styles['Normal'])],
        [Paragraph(summary_html, cell_style)]
    ]
    summary_box = Table(summary_box_data, colWidths=[540])
    summary_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor(status_bg)),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor(status_color)),
        ('PADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (0, 0), 4),
    ]))
    story.append(summary_box)
    story.append(Spacer(1, 14))

    # 3. Consistency Alerts (if any)
    if batch_result.consistency_issues:
        story.append(Paragraph("Batch Consistency Observations", section_style))
        cons_rows = []
        for issue in batch_result.consistency_issues:
            cons_rows.append([
                Paragraph(f"<b>⚠ {issue.metric}</b>", cell_bold),
                Paragraph(issue.message, cell_style)
            ])
        cons_table = Table(cons_rows, colWidths=[140, 400])
        cons_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#fffbeb")),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#fde68a")),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#fef3c7")),
            ('PADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(cons_table)
        story.append(Spacer(1, 14))

    # 4. Detailed File Inspections
    story.append(Paragraph("Inspected Audio Files", section_style))

    for f in batch_result.files:
        f_color = "#059669" if f.overall_status == QCStatus.PASS else ("#d97706" if f.overall_status == QCStatus.WARNING else "#dc2626")
        
        if f.file_info is not None:
            file_header = [
                Paragraph(f"<b>{f.filename}</b> ({f.file_info.format} &bull; {f.file_info.sample_rate/1000}kHz &bull; {f.file_info.bit_depth or 'N/A'}-bit &bull; {f.file_info.channel_layout})", cell_bold),
                Paragraph(f"<font color='{f_color}'><b>{f.overall_status.value}</b></font>", ParagraphStyle('RightStatus', parent=cell_bold, alignment=2))
            ]
            
            metrics_rows = [
                [
                    Paragraph("<b>Integrated Loudness</b>", cell_style),
                    Paragraph(f"{f.loudness.integrated_lufs} LUFS" if f.loudness and f.loudness.integrated_lufs is not None else "N/A", cell_style),
                    Paragraph("<b>True Peak</b>", cell_style),
                    Paragraph(f"{f.peaks.true_peak_dbtp} dBTP" if f.peaks else "N/A", cell_style),
                ],
                [
                    Paragraph("<b>Sample Peak</b>", cell_style),
                    Paragraph(f"{f.peaks.sample_peak_dbfs} dBFS" if f.peaks else "N/A", cell_style),
                    Paragraph("<b>Clipping</b>", cell_style),
                    Paragraph(f"{'Detected (' + str(f.clipping.clipped_samples) + ' smp)' if f.clipping and f.clipping.clipping_detected else 'None'}", cell_style),
                ],
                [
                    Paragraph("<b>Head / Tail Silence</b>", cell_style),
                    Paragraph(f"{f.silence.leading_silence_sec}s / {f.silence.trailing_silence_sec}s" if f.silence else "N/A", cell_style),
                    Paragraph("<b>Duration</b>", cell_style),
                    Paragraph(f"{round(f.file_info.duration_seconds, 2)}s", cell_style),
                ]
            ]
            
            if f.fix_summary:
                fixes_text = "<br/>".join([f"&bull; {fix}" for fix in f.fix_summary])
                metrics_rows.append([
                    Paragraph("<font color='#dc2626'><b>Required Actions:</b></font>", cell_style),
                    Paragraph(f"<font color='#dc2626'>{fixes_text}</font>", cell_style),
                    "", ""
                ])
        else:
            file_header = [
                Paragraph(f"<b>{f.filename}</b> (Error reading file)", cell_bold),
                Paragraph(f"<font color='{f_color}'><b>{f.overall_status.value}</b></font>", ParagraphStyle('RightStatus', parent=cell_bold, alignment=2))
            ]
            metrics_rows = [
                [
                    Paragraph("<font color='#dc2626'><b>Error Detail:</b></font>", cell_style),
                    Paragraph(f"<font color='#dc2626'>{f.error_message or 'Unable to analyze file.'}</font>", cell_style),
                    "", ""
                ]
            ]

        card_table = Table(
            [
                file_header,
                [Table(metrics_rows, colWidths=[125, 135, 125, 135]), ""]
            ], 
            colWidths=[400, 140]
        )
        card_table.setStyle(TableStyle([
            ('SPAN', (0, 1), (1, 1)),
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ('LINEBELOW', (0, 0), (1, 0), 0.5, colors.HexColor("#e2e8f0")),
            ('PADDING', (0, 0), (-1, -1), 6),
        ]))

        story.append(KeepTogether([
            card_table,
            Spacer(1, 8)
        ]))

    # 5. Footer note
    story.append(Spacer(1, 14))
    story.append(Paragraph(
        "<i>Generated deterministically by Sonichecks Audio Engine (ITU-R BS.1770-4 / EBU R128 compliance algorithms).</i>",
        subtitle_style
    ))

    doc.build(story)
    return buffer.getvalue()
