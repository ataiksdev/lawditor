"""
generate_report.py
==================
Called by the Next.js API route: python3 scripts/generate_report.py <input.json> <output.pdf>

The input JSON must match the schema returned by Claude's audit endpoint:
{
  "app_name": str,
  "risk_overall": "HIGH" | "MEDIUM" | "LOW",
  "executive_summary": str,
  "findings": [
    {
      "id": str,
      "title": str,
      "risk": "HIGH" | "MEDIUM" | "LOW",
      "issue": str,
      "applicable_law": [str],
      "impact": str,
      "actions": [str]
    }
  ],
  "required_documents": [str],
  "next_steps": [str]
}
"""

import sys
import json
from datetime import datetime

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table,
    TableStyle, HRFlowable, PageBreak
)

# ── CLI args ─────────────────────────────────────────────────────────────────
if len(sys.argv) != 3:
    print("Usage: python3 generate_report.py <input.json> <output.pdf>")
    sys.exit(1)

INPUT_JSON = sys.argv[1]
OUTPUT_PDF = sys.argv[2]

with open(INPUT_JSON, "r") as f:
    data = json.load(f)

# ── Validate expected fields, apply safe defaults ───────────────────────────
app_name     = data.get("app_name", "Unknown App")
risk_overall = data.get("risk_overall", "HIGH")
summary      = data.get("executive_summary", "No summary provided.")
findings     = data.get("findings", [])
req_docs     = data.get("required_documents", [])
next_steps   = data.get("next_steps", [])
audit_date   = datetime.now().strftime("%d %B %Y").lstrip("0") if sys.platform == "win32" else datetime.now().strftime("%-d %B %Y")

# ── Dimensions ───────────────────────────────────────────────────────────────
W, H = A4
CONTENT_W = W - 4 * cm

# ── Colours ──────────────────────────────────────────────────────────────────
DARK   = colors.HexColor("#0F172A")
MID    = colors.HexColor("#334155")
LIGHT  = colors.HexColor("#64748B")
ACCENT = colors.HexColor("#2563EB")
PALE   = colors.HexColor("#F1F5F9")
BORDER = colors.HexColor("#CBD5E1")

RISK_COLOR = {
    "HIGH":   colors.HexColor("#DC2626"),
    "MEDIUM": colors.HexColor("#D97706"),
    "LOW":    colors.HexColor("#16A34A"),
}
RISK_BG = {
    "HIGH":   colors.HexColor("#FEE2E2"),
    "MEDIUM": colors.HexColor("#FEF3C7"),
    "LOW":    colors.HexColor("#DCFCE7"),
}

# ── Style helpers ─────────────────────────────────────────────────────────────
def S(name, **kw):
    return ParagraphStyle(name, **kw)

style_h1    = S("h1",   fontName="Helvetica-Bold", fontSize=16, leading=22,
                textColor=ACCENT, spaceBefore=18, spaceAfter=6)
style_body  = S("body", fontName="Helvetica",      fontSize=9.5, leading=14,
                textColor=DARK,  spaceAfter=6, alignment=TA_JUSTIFY)
style_small = S("sm",   fontName="Helvetica",      fontSize=8,  leading=12,
                textColor=LIGHT, spaceAfter=4)
style_label = S("lbl",  fontName="Helvetica-Bold", fontSize=9,  leading=12,
                textColor=LIGHT, spaceAfter=0)
style_cell  = S("cell", fontName="Helvetica",      fontSize=9,  leading=13,
                textColor=DARK,  spaceAfter=0)
style_bold_cell = S("bcell", fontName="Helvetica-Bold", fontSize=9, leading=13,
                    textColor=DARK, spaceAfter=0)
style_cover_tag = S("ctag",  fontName="Helvetica-Bold", fontSize=10, leading=14,
                    textColor=ACCENT, alignment=TA_CENTER)
style_cover_title = S("cttl", fontName="Helvetica-Bold", fontSize=30, leading=38,
                      textColor=DARK,  alignment=TA_CENTER, spaceAfter=8)
style_cover_sub = S("csub",   fontName="Helvetica",      fontSize=13, leading=18,
                    textColor=MID,   alignment=TA_CENTER, spaceAfter=4)

def HR():
    return HRFlowable(width="100%", thickness=0.5, color=BORDER, spaceAfter=6, spaceBefore=2)

def section_rule():
    return HRFlowable(width="100%", thickness=1.5, color=ACCENT, spaceAfter=8, spaceBefore=4)

def sp(n=8):
    return Spacer(1, n)

def risk_badge_text(level):
    c = RISK_COLOR.get(level, LIGHT)
    # ReportLab requires plain 6-digit hex without '#' prefix in inline markup
    hex_val = c.hexval().replace("0x", "").upper().zfill(6)
    return f'<font color="#{hex_val}"><b>{level}</b></font>'

def safe_hex(c):
    """Return clean 6-char hex string for a ReportLab color, safe for inline markup."""
    return c.hexval().replace("0x", "").upper().zfill(6)

# ── Page callbacks ────────────────────────────────────────────────────────────
def on_page(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(LIGHT)
    if doc.page > 1:
        canvas.setStrokeColor(BORDER)
        canvas.setLineWidth(0.5)
        canvas.line(2*cm, H - 1.6*cm, W - 2*cm, H - 1.6*cm)
        canvas.drawString(2*cm, H - 1.4*cm, f"Legal Compliance Audit — {app_name}")
        canvas.drawRightString(W - 2*cm, H - 1.4*cm, audit_date)
    canvas.setStrokeColor(BORDER)
    canvas.line(2*cm, 1.8*cm, W - 2*cm, 1.8*cm)
    canvas.drawString(2*cm, 1.3*cm, "AI-assisted analysis — For review by qualified legal counsel")
    canvas.drawRightString(W - 2*cm, 1.3*cm, f"Page {doc.page}")
    canvas.restoreState()

# ── Build story ───────────────────────────────────────────────────────────────
doc = SimpleDocTemplate(
    OUTPUT_PDF, pagesize=A4,
    leftMargin=2*cm, rightMargin=2*cm,
    topMargin=2.4*cm, bottomMargin=2.4*cm
)
story = []

# ── COVER ─────────────────────────────────────────────────────────────────────
story.append(sp(40))
story.append(Paragraph("LEGAL COMPLIANCE AUDIT", style_cover_tag))
story.append(sp(6))
story.append(Paragraph(app_name, style_cover_title))
story.append(sp(10))
story.append(Paragraph(
    "Nigerian Data Protection &nbsp;·&nbsp; Consumer Law &nbsp;·&nbsp; E-Commerce Regulations",
    style_cover_sub
))
story.append(sp(18))

overall_bg  = RISK_BG.get(risk_overall, PALE)
overall_col = RISK_COLOR.get(risk_overall, DARK)

meta_rows = [
    ["Date of Audit",  audit_date],
    ["Jurisdiction",   "Nigeria (primary) + International overlay"],
    ["Overall Risk",   risk_overall],
    ["Prepared by",    "LegalAudit SaaS — For review by qualified counsel"],
]
meta_tbl = Table(meta_rows, colWidths=[5.5*cm, 10.5*cm])
meta_style = [
    ("FONTNAME",     (0,0),(-1,-1), "Helvetica"),
    ("FONTNAME",     (0,0),(0,-1),  "Helvetica-Bold"),
    ("FONTSIZE",     (0,0),(-1,-1), 9),
    ("TEXTCOLOR",    (0,0),(0,-1),  ACCENT),
    ("TEXTCOLOR",    (1,0),(1,-1),  DARK),
    ("ROWBACKGROUNDS",(0,0),(-1,-1), [PALE, colors.white]),
    ("GRID",         (0,0),(-1,-1), 0.4, BORDER),
    ("TOPPADDING",   (0,0),(-1,-1), 6),
    ("BOTTOMPADDING",(0,0),(-1,-1), 6),
    ("LEFTPADDING",  (0,0),(-1,-1), 10),
]
# Highlight the risk row
risk_row_idx = 2
meta_style.append(("BACKGROUND",  (1, risk_row_idx),(1, risk_row_idx), overall_bg))
meta_style.append(("TEXTCOLOR",   (1, risk_row_idx),(1, risk_row_idx), overall_col))
meta_style.append(("FONTNAME",    (1, risk_row_idx),(1, risk_row_idx), "Helvetica-Bold"))
meta_tbl.setStyle(TableStyle(meta_style))
story.append(meta_tbl)
story.append(PageBreak())

# ── 1. Executive Summary ───────────────────────────────────────────────────────
story.append(Paragraph("1. Executive Summary", style_h1))
story.append(section_rule())
story.append(Paragraph(summary, style_body))
story.append(sp(8))

# ── 2. Risk Rating Table ───────────────────────────────────────────────────────
story.append(Paragraph("2. Risk Rating Summary", style_h1))
story.append(section_rule())

risk_header = [
    Paragraph("#",               style_bold_cell),
    Paragraph("Compliance Area", style_bold_cell),
    Paragraph("Risk",            style_bold_cell),
    Paragraph("Key Issue",       style_bold_cell),
]
risk_data = [risk_header]
for i, f in enumerate(findings):
    risk_data.append([
        Paragraph(f.get("id", str(i+1)), style_cell),
        Paragraph(f.get("title", ""), style_cell),
        Paragraph(risk_badge_text(f.get("risk", "MEDIUM")), style_cell),
        Paragraph(f.get("issue", "")[:120] + ("..." if len(f.get("issue","")) > 120 else ""), style_cell),
    ])

risk_tbl = Table(risk_data, colWidths=[1.2*cm, 5*cm, 2.2*cm, 8.1*cm])
risk_ts = [
    ("FONTNAME",     (0,0),(-1,0),  "Helvetica-Bold"),
    ("FONTSIZE",     (0,0),(-1,-1), 8.5),
    ("BACKGROUND",   (0,0),(-1,0),  DARK),
    ("TEXTCOLOR",    (0,0),(-1,0),  colors.white),
    ("GRID",         (0,0),(-1,-1), 0.4, BORDER),
    ("TOPPADDING",   (0,0),(-1,-1), 5),
    ("BOTTOMPADDING",(0,0),(-1,-1), 5),
    ("LEFTPADDING",  (0,0),(-1,-1), 6),
    ("VALIGN",       (0,0),(-1,-1), "TOP"),
    ("ROWBACKGROUNDS",(0,1),(-1,-1), [PALE, colors.white]),
]
for i, f in enumerate(findings, 1):
    lvl = f.get("risk", "MEDIUM")
    risk_ts.append(("BACKGROUND", (2, i),(2, i), RISK_BG.get(lvl, PALE)))
risk_tbl.setStyle(TableStyle(risk_ts))
story.append(risk_tbl)
story.append(PageBreak())

# ── 3. Detailed Findings ───────────────────────────────────────────────────────
story.append(Paragraph("3. Detailed Findings &amp; Recommendations", style_h1))
story.append(section_rule())

for f in findings:
    lvl   = f.get("risk", "MEDIUM")
    rc    = RISK_COLOR.get(lvl, DARK)
    rb    = RISK_BG.get(lvl, PALE)
    rhex  = safe_hex(rc)
    fid   = f.get("id", "")
    title = f.get("title", "")

    # Header row
    hdr_data = [[
        Paragraph(f'<font color="#{safe_hex(colors.white)}"><b>{fid}</b></font>',
                  S("fh_id", fontName="Helvetica-Bold", fontSize=9, leading=12,
                    textColor=colors.white, spaceAfter=0)),
        Paragraph(f'<font color="#{safe_hex(colors.white)}"><b>{title}</b></font>',
                  S("fh_t", fontName="Helvetica-Bold", fontSize=10, leading=13,
                    textColor=colors.white, spaceAfter=0)),
        Paragraph(f'<font color="#{rhex}"><b>{lvl}</b></font>',
                  S("fh_r", fontName="Helvetica-Bold", fontSize=9, leading=12,
                    textColor=rc, spaceAfter=0, alignment=TA_CENTER)),
    ]]
    hdr_tbl = Table(hdr_data, colWidths=[1.4*cm, 12.6*cm, 2.5*cm])
    hdr_tbl.setStyle(TableStyle([
        ("BACKGROUND",    (0,0),(1,0), DARK),
        ("BACKGROUND",    (2,0),(2,0), rb),
        ("TOPPADDING",    (0,0),(-1,-1), 7),
        ("BOTTOMPADDING", (0,0),(-1,-1), 7),
        ("LEFTPADDING",   (0,0),(-1,-1), 8),
        ("VALIGN",        (0,0),(-1,-1), "MIDDLE"),
    ]))
    story.append(hdr_tbl)

    # Detail rows: Issue, Applicable Law, Impact, Recommended Actions
    def detail_row(label, content_para, bg=PALE):
        row = Table(
            [[Paragraph(f"<b>{label}</b>",
                        S("dlbl", fontName="Helvetica-Bold", fontSize=8.5,
                          textColor=ACCENT, spaceAfter=0)),
              content_para]],
            colWidths=[2.4*cm, 14.1*cm]
        )
        row.setStyle(TableStyle([
            ("BACKGROUND",    (0,0),(-1,-1), bg),
            ("TOPPADDING",    (0,0),(-1,-1), 5),
            ("BOTTOMPADDING", (0,0),(-1,-1), 5),
            ("LEFTPADDING",   (0,0),(-1,-1), 8),
            ("VALIGN",        (0,0),(-1,-1), "TOP"),
            ("GRID",          (0,0),(-1,-1), 0.3, BORDER),
        ]))
        return row

    # Issue
    story.append(detail_row(
        "Issue",
        Paragraph(f.get("issue", ""), S("fi", fontName="Helvetica", fontSize=8.5,
                                         leading=13, textColor=DARK, spaceAfter=0,
                                         alignment=TA_JUSTIFY)),
        bg=PALE
    ))

    # Applicable Law
    laws = f.get("applicable_law", [])
    law_text = "<br/>".join([f"• {l}" for l in laws])
    story.append(detail_row(
        "Applicable Law",
        Paragraph(law_text, S("fl", fontName="Helvetica", fontSize=8.5,
                               leading=13, textColor=DARK, spaceAfter=0)),
        bg=colors.white
    ))

    # Impact
    story.append(detail_row(
        "Impact",
        Paragraph(f.get("impact", ""), S("fim", fontName="Helvetica", fontSize=8.5,
                                          leading=13, textColor=DARK, spaceAfter=0,
                                          alignment=TA_JUSTIFY)),
        bg=PALE
    ))

    # Actions
    actions = f.get("actions", [])
    actions_text = "<br/>".join([f"<b>{i+1}.</b>  {a}" for i, a in enumerate(actions)])
    story.append(detail_row(
        "Actions",
        Paragraph(actions_text, S("fa", fontName="Helvetica", fontSize=8.5,
                                   leading=13, textColor=DARK, spaceAfter=0)),
        bg=colors.HexColor("#F0FDF4")
    ))

    story.append(sp(12))

story.append(PageBreak())

# ── 4. Required Documents ──────────────────────────────────────────────────────
story.append(Paragraph("4. Required Legal Documents", style_h1))
story.append(section_rule())

if req_docs:
    doc_rows = [[
        Paragraph("#",        style_bold_cell),
        Paragraph("Document", style_bold_cell),
    ]]
    for i, d in enumerate(req_docs):
        doc_rows.append([
            Paragraph(str(i+1), style_cell),
            Paragraph(d, style_cell),
        ])
    doc_tbl = Table(doc_rows, colWidths=[1*cm, 15.5*cm])
    doc_tbl.setStyle(TableStyle([
        ("FONTNAME",     (0,0),(-1,0),  "Helvetica-Bold"),
        ("FONTSIZE",     (0,0),(-1,-1), 9),
        ("BACKGROUND",   (0,0),(-1,0),  DARK),
        ("TEXTCOLOR",    (0,0),(-1,0),  colors.white),
        ("ROWBACKGROUNDS",(0,1),(-1,-1), [PALE, colors.white]),
        ("GRID",         (0,0),(-1,-1), 0.4, BORDER),
        ("TOPPADDING",   (0,0),(-1,-1), 6),
        ("BOTTOMPADDING",(0,0),(-1,-1), 6),
        ("LEFTPADDING",  (0,0),(-1,-1), 8),
    ]))
    story.append(doc_tbl)
else:
    story.append(Paragraph("No required documents identified.", style_body))

story.append(sp(16))

# ── 5. Next Steps ──────────────────────────────────────────────────────────────
story.append(Paragraph("5. Prioritised Next Steps", style_h1))
story.append(section_rule())

if next_steps:
    for i, step in enumerate(next_steps):
        priority_color = RISK_COLOR["HIGH"] if i < 3 else (RISK_COLOR["MEDIUM"] if i < 6 else RISK_COLOR["LOW"])
        hex_p = safe_hex(priority_color)
        row = Table(
            [[Paragraph(f'<font color="#{hex_p}"><b>{i+1}</b></font>',
                        S("nsn", fontName="Helvetica-Bold", fontSize=11, leading=14,
                          textColor=priority_color, spaceAfter=0, alignment=TA_CENTER)),
              Paragraph(step, S("nst", fontName="Helvetica", fontSize=9.5, leading=14,
                                 textColor=DARK, spaceAfter=0))]],
            colWidths=[1*cm, 15.5*cm]
        )
        row.setStyle(TableStyle([
            ("BACKGROUND",    (0,0),(-1,-1), PALE if i % 2 == 0 else colors.white),
            ("TOPPADDING",    (0,0),(-1,-1), 6),
            ("BOTTOMPADDING", (0,0),(-1,-1), 6),
            ("LEFTPADDING",   (0,0),(-1,-1), 8),
            ("VALIGN",        (0,0),(-1,-1), "MIDDLE"),
            ("LINEBELOW",     (0,0),(-1,-1), 0.3, BORDER),
        ]))
        story.append(row)
else:
    story.append(Paragraph("No next steps identified.", style_body))

story.append(sp(20))

# ── Disclaimer ─────────────────────────────────────────────────────────────────
disc_tbl = Table(
    [[Paragraph(
        "<b>Disclaimer:</b> This report was generated by an AI-assisted legal analysis tool and does "
        "not constitute formal legal advice. All findings, risk ratings, and recommendations should be "
        "reviewed by a qualified Nigerian lawyer before any legal action is taken or any documents are "
        "published. Legal requirements in Nigeria are subject to change — platform operators should "
        "monitor NDPC publications and seek periodic compliance reviews.",
        S("disc", fontName="Helvetica-Oblique", fontSize=8, leading=12,
          textColor=LIGHT, spaceAfter=0, alignment=TA_JUSTIFY)
    )]],
    colWidths=[CONTENT_W]
)
disc_tbl.setStyle(TableStyle([
    ("BACKGROUND",    (0,0),(-1,-1), PALE),
    ("TOPPADDING",    (0,0),(-1,-1), 8),
    ("BOTTOMPADDING", (0,0),(-1,-1), 8),
    ("LEFTPADDING",   (0,0),(-1,-1), 12),
    ("RIGHTPADDING",  (0,0),(-1,-1), 12),
    ("BOX",           (0,0),(-1,-1), 0.5, BORDER),
]))
story.append(disc_tbl)

# ── Render ─────────────────────────────────────────────────────────────────────
doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
print(f"PDF written to: {OUTPUT_PDF}")