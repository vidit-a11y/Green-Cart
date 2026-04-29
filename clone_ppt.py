"""
Clone LakshaSharmaMidInternshipPPt.pptx formatting → replace text with GreenCart/Vidit content.
Strategy: deep-copy the entire source PPT XML, then patch only text runs.
"""

from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from lxml import etree
import copy, io

SRC = 'LakshaSharmaMidInternshipPPt.pptx'
OUT = 'Vidit_GreenCart_Internship_PPT.pptx'

# ─── open source ───────────────────────────────────────────────────────────
src_prs = Presentation(SRC)
src_slides = list(src_prs.slides)

# ─── helpers ───────────────────────────────────────────────────────────────
RED   = RGBColor(0xDD, 0x1A, 0x22)
BLACK = RGBColor(0x00, 0x00, 0x00)
GREY  = RGBColor(0x33, 0x33, 0x33)
DG44  = RGBColor(0x44, 0x44, 0x44)

def set_run_text(run, text):
    run.text = text

def clear_tf(tf):
    """Remove all paragraphs except the first (which we'll reuse)."""
    from pptx.oxml.ns import qn
    spTree = tf._txBody
    # remove all a:p except first
    paras = spTree.findall(qn('a:p'))
    for p in paras[1:]:
        spTree.remove(p)
    # clear runs in first para
    first = paras[0]
    for r in first.findall(qn('a:r')):
        first.remove(r)
    return first

def copy_run_format(src_run, dst_run):
    """Copy XML of rPr from src run to dst run."""
    from pptx.oxml.ns import qn
    src_rPr = src_run._r.find(qn('a:rPr'))
    dst_r   = dst_run._r
    existing = dst_r.find(qn('a:rPr'))
    if existing is not None:
        dst_r.remove(existing)
    if src_rPr is not None:
        dst_r.insert(0, copy.deepcopy(src_rPr))

def add_para_to_tf(tf, bold_text, regular_text,
                   bold_color=RED, reg_color=GREY,
                   font_size_emu=330200):
    """Append a paragraph with a bold run + a regular run."""
    from pptx.oxml.ns import qn
    from pptx.oxml import parse_xml
    from lxml import etree as ET

    sz_pt = int(font_size_emu / 12700)

    def make_rPr(bold, hex_col):
        col_el = (f'<a:solidFill xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">'
                  f'<a:srgbClr val="{hex_col}"/></a:solidFill>')
        b_attr = ' b="1"' if bold else ''
        return (f'<a:rPr xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"'
                f' lang="en-US" sz="{sz_pt*100}" dirty="0"{b_attr}>'
                f'{col_el}</a:rPr>')

    def make_run(rPr_xml, text):
        ns = 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"'
        safe = text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')
        return ET.fromstring(
            f'<a:r {ns}>{rPr_xml}<a:t>{safe}</a:t></a:r>'
        )

    para_xml = ET.fromstring(
        '<a:p xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"/>'
    )
    if bold_text:
        bold_hex = f"{bold_color[0]:02X}{bold_color[1]:02X}{bold_color[2]:02X}"
        para_xml.append(make_run(make_rPr(True, bold_hex), bold_text))
    if regular_text:
        reg_hex = f"{reg_color[0]:02X}{reg_color[1]:02X}{reg_color[2]:02X}"
        para_xml.append(make_run(make_rPr(False, reg_hex), regular_text))

    tf._txBody.append(para_xml)
    return para_xml


def set_title_shape(shape, new_title):
    """Replace heading text in a shape that has exactly one run."""
    tf = shape.text_frame
    for para in tf.paragraphs:
        full_text = para.text.strip()
        if full_text:
            # clear all runs and set first run to new title
            from pptx.oxml.ns import qn
            runs = para._p.findall(qn('a:r'))
            # keep formatting of first run, set its text
            if runs:
                # remove extra runs
                for r in runs[1:]:
                    para._p.remove(r)
                runs[0].find(qn('a:t')).text = new_title
            return


# ──────────────────────────────────────────────────────────────────────────
# The approach: clone the entire PPTX in memory, then edit text shapes only
# ──────────────────────────────────────────────────────────────────────────

# Save source to bytes, reload as our working copy
buf = io.BytesIO()
src_prs.save(buf)
buf.seek(0)
prs = Presentation(buf)
slides = list(prs.slides)

# ═══════════════════════════════════════════════════════════════════════════
# Content map  (slide_index, shape_name → new content)
# ═══════════════════════════════════════════════════════════════════════════

def patch_title(slide, new_title):
    for shape in slide.shapes:
        if shape.name == 'Rectangle 4' and shape.has_text_frame:
            set_title_shape(shape, new_title)
            return

def patch_textbox(slide, new_paragraphs):
    """
    new_paragraphs: list of (bold_label, regular_text) tuples
    bold_label may be '' for plain paragraphs.
    """
    for shape in slide.shapes:
        if 'TextBox' in shape.name and shape.has_text_frame:
            tf = shape.text_frame
            # determine font size from first existing para
            existing_size = 330200
            for para in tf.paragraphs:
                for run in para.runs:
                    if run.font.size:
                        existing_size = run.font.size
                        break
                else:
                    continue
                break

            # wipe existing paragraphs
            from pptx.oxml.ns import qn
            body = tf._txBody
            for p in body.findall(qn('a:p')):
                body.remove(p)

            for bold_lbl, reg_txt in new_paragraphs:
                add_para_to_tf(tf, bold_lbl, reg_txt,
                               font_size_emu=existing_size)
            return

# ───────────────────────────────────────────────────────────────────────────
# SLIDE 1 — Title Slide  (has background image + logo + name placeholders)
# ───────────────────────────────────────────────────────────────────────────
s1 = slides[0]
for shape in s1.shapes:
    if shape.has_text_frame:
        tf = shape.text_frame
        for para in tf.paragraphs:
            for run in para.runs:
                t = run.text
                if 'Laksha' in t or 'Sharma' in t:
                    run.text = t.replace('Laksha Sharma', 'Vidit').replace('Laksha', 'Vidit').replace('Sharma', '')
                elif 'Astrospace' in t:
                    run.text = t.replace('Astrospace', 'GreenCart')
                elif 'Next.js' in t and 'intern' in t.lower():
                    run.text = 'Full-Stack / MERN Stack Intern'
                elif 'Next.js Developer' in t:
                    run.text = 'Full-Stack / MERN Stack Intern'
                elif 'Mid Internship' in t or 'Mid-Internship' in t:
                    run.text = 'Mid-Review Internship Presentation'
                elif '2024' in t and '2025' not in t:
                    run.text = t.replace('2024', '2026')

# ───────────────────────────────────────────────────────────────────────────
# SLIDE 2 — Contents / Index
# ───────────────────────────────────────────────────────────────────────────
# Title stays "Contents" — no change needed
# Update list items
s2 = slides[1]
patch_textbox(s2, [
    ('', 'Company Profile'),
    ('', 'Internship Role'),
    ('', 'Project Introduction'),
    ('', 'Overall Learning'),
    ('', 'Roles & Responsibilities'),
    ('', 'Tools & Technologies Used'),
    ('', 'Methodology'),
    ('', 'Key Modules Implemented'),
    ('', 'Challenges & Solutions'),
    ('', 'Outcomes & Conclusion'),
])

# ───────────────────────────────────────────────────────────────────────────
# SLIDE 3 — Company Profile
# ───────────────────────────────────────────────────────────────────────────
s3 = slides[2]
patch_title(s3, 'Company Profile')
patch_textbox(s3, [
    ('Company Name: ', 'InTimeTec VisionSoft Private Limited'),
    ('', ''),
    ('Founded: ', '2009'),
    ('', ''),
    ('Headquarters: ', 'Meridian, Idaho, USA'),
    ('', ''),
    ('India Office: ', 'Jaipur, Rajasthan'),
    ('', ''),
    ('Presence: ', '5+ Countries — Global Operations'),
    ('', ''),
    ('Services: ', 'Custom Software Development, AI, Cybersecurity, Cloud, Managed IT, UX/UI Design'),
    ('', ''),
    ('Philosophy: ', 'People First | Creating Abundance'),
    ('', ''),
    ('Website: ', 'www.intimetec.com'),
])

# ───────────────────────────────────────────────────────────────────────────
# SLIDE 4 — About the Project
# ───────────────────────────────────────────────────────────────────────────
s4 = slides[3]
patch_title(s4, 'Project Introduction — GreenCart')
patch_textbox(s4, [
    ('Project Name: ', 'GreenCart — Agricultural Marketplace Platform'),
    ('', ''),
    ('Overview: ', 'A full-stack TypeScript platform connecting rural farmers directly to urban consumers, eliminating intermediary chains and ensuring fair farm-gate pricing.'),
    ('', ''),
    ('Problem Statement: ', 'Farmers receive only 30–40% of retail price due to long supply-chain intermediaries. Consumers pay inflated prices for fresh produce.'),
    ('', ''),
    ('Solution: ', 'Direct digital marketplace with dynamic farm-gate pricing, geo-fenced delivery radius, transparent order tracking, and Razorpay payment integration.'),
    ('', ''),
    ('Portals: ', 'Farmer Portal | Consumer Portal | Admin Panel'),
    ('', ''),
    ('Tech Stack: ', 'React.js · Node.js · Express · MongoDB · TypeScript · Razorpay · Google Maps API · Cloudinary'),
])

# ───────────────────────────────────────────────────────────────────────────
# SLIDE 5 — Overall Learning
# ───────────────────────────────────────────────────────────────────────────
s5 = slides[4]
patch_title(s5, 'Overall Learning')
patch_textbox(s5, [
    ('Full-Stack TypeScript: ', 'Gained end-to-end TypeScript expertise — monorepo setup, shared type packages, and strict typing across React frontend and Express backend.'),
    ('', ''),
    ('System Design: ', 'Designed a scalable architecture handling multi-role users, geospatial data, dynamic pricing, payment workflows, and recurring subscriptions.'),
    ('', ''),
    ('Product Thinking: ', 'Translated ambiguous requirements ("fair prices for farmers") into concrete, measurable technical features.'),
    ('', ''),
    ('Technical Problem-Solving: ', 'Real-world debugging (GeoJSON type bug, pricing edge cases, payment state machine) built systematic, independent root-cause analysis skills.'),
    ('', ''),
    ('Global Dev Standards: ', 'Immersed in InTimeTec\'s international code quality, documentation, and communication expectations across a global client portfolio.'),
    ('', ''),
    ('Agile Practices: ', 'Sprint planning, Git branching strategy, code reviews, and iterative milestone delivery.'),
])

# ───────────────────────────────────────────────────────────────────────────
# SLIDE 6 — Internship Role
# ───────────────────────────────────────────────────────────────────────────
s6 = slides[5]
patch_title(s6, 'Internship Role')
patch_textbox(s6, [
    ('Name: ', 'Vidit'),
    ('', ''),
    ('Role: ', 'Full-Stack / MERN Stack Intern'),
    ('', ''),
    ('Organisation: ', 'InTimeTec VisionSoft Private Limited, Jaipur'),
    ('', ''),
    ('Duration: ', 'January 6, 2026 – July 6, 2026  (6 Months)'),
    ('', ''),
    ('Mid-Review: ', 'April 2026'),
    ('', ''),
    ('Domain: ', 'Agricultural Technology / E-Commerce'),
    ('', ''),
    ('Reporting: ', 'Under the guidance of Faculty Internship Guide & Industrial Guide'),
])

# ───────────────────────────────────────────────────────────────────────────
# SLIDE 7 — Roles & Responsibilities
# ───────────────────────────────────────────────────────────────────────────
s7 = slides[6]
patch_title(s7, 'Roles & Responsibilities')
patch_textbox(s7, [
    ('Frontend Development & UI:', ''),
    ('  ', 'Built Farmer, Consumer & Admin portals in React.js + TypeScript (Vite). Implemented Home, Featured Products, Registration, and Login UI.'),
    ('', ''),
    ('• Backend Logic & API Design:', ''),
    ('  ', 'Designed RESTful APIs with Node.js/Express, JWT authentication, role-based middleware, and Mongoose ODM across 9 MongoDB collections.'),
    ('', ''),
    ('• Dynamic Pricing Engine:', ''),
    ('  ', 'Developed a 4-factor weighted scoring engine (demand, freshness, stock, seasonal) with organic 2× price cap enforcement.'),
    ('', ''),
    ('• Geo-Fencing & Payments:', ''),
    ('  ', 'Integrated Google Maps API + MongoDB 2dsphere for delivery radius. Implemented Razorpay escrow-style payment workflow with idempotent webhooks.'),
])

# ───────────────────────────────────────────────────────────────────────────
# SLIDE 8 — Tools & Technologies
# ───────────────────────────────────────────────────────────────────────────
s8 = slides[7]
patch_title(s8, 'Tools & Technologies Used')
patch_textbox(s8, [
    ('Frontend / Web Apps: ', 'React.js 18, TypeScript 5.x, Vite 5.x, React Router v6, Axios'),
    ('', ''),
    ('Backend Architecture: ', 'Node.js v20 LTS, Express 4.x, TypeScript, JWT, Mongoose 8.x'),
    ('', ''),
    ('Database & Storage: ', 'MongoDB 7.0 (Atlas), 2dsphere Indexing, GeoJSON, Cloudinary CDN'),
    ('', ''),
    ('APIs & Integrations: ', 'Google Maps API v3, Razorpay SDK, node-schedule, Cloudinary Node SDK'),
    ('', ''),
    ('Testing & QA: ', 'Jest, Supertest, Postman, TypeScript static type checking'),
    ('', ''),
    ('DevOps & Deployment: ', 'Git / GitHub, Vercel (Frontend), Render (Backend), MongoDB Atlas'),
])

# ───────────────────────────────────────────────────────────────────────────
# SLIDE 9 — Methodology
# ───────────────────────────────────────────────────────────────────────────
s9 = slides[8]
patch_title(s9, 'Methodology')
patch_textbox(s9, [
    ('1. TypeScript Monorepo & System Design:', ' Setting up the monorepo with a shared types package, ensuring strict end-to-end type safety across the React frontend and Express backend from day one.'),
    ('', ''),
    ('2. Core Module Development:', ' Building authentication, product management, cart, and order APIs iteratively. Each module was tested with Postman and Jest/Supertest before integration.'),
    ('', ''),
    ('3. Advanced Feature Engineering:', ' Implementing the Dynamic Pricing Engine (weighted scoring), Geo-Fencing Delivery Radius (MongoDB 2dsphere + Google Maps API), and Razorpay escrow payment state machine.'),
    ('', ''),
    ('4. Testing & Quality Assurance:', ' Unit + integration testing across 6 modules — 17 test cases, 100% pass rate at mid-review. TypeScript static checks served as compile-time regression prevention.'),
])

# ───────────────────────────────────────────────────────────────────────────
# SLIDE 10 — Gallery (screenshots) — keep as-is or add placeholder text
# ───────────────────────────────────────────────────────────────────────────
s10 = slides[9]
# Update just the title
patch_title(s10, 'GreenCart — UI Screenshots')

# ───────────────────────────────────────────────────────────────────────────
# SLIDE 11 — Outcomes & Conclusion
# ───────────────────────────────────────────────────────────────────────────
s11 = slides[10]
patch_title(s11, 'Outcomes & Conclusion')
patch_textbox(s11, [
    ('Outcomes:', ''),
    ('', 'Successfully built a production-ready TypeScript agricultural marketplace with Dynamic Pricing Engine, Geo-Fencing Delivery, and Razorpay payment integration — 17 test cases, 100% pass rate.'),
    ('', 'Delivered complete Farmer, Consumer & Admin portals in React.js; RESTful Node.js/Express backend with JWT auth; MongoDB with 9 collections and 2dsphere geospatial indexing.'),
    ('', ''),
    ('Conclusion:', ''),
    ('', 'The six-month internship at InTimeTec VisionSoft, Jaipur (Jan–Jul 2026) provided exceptional technical and professional growth. Building GreenCart from requirements gathering to a tested, deployment-ready platform — while working to InTimeTec\'s global engineering standards — has permanently raised the bar for code quality, system thinking, and professional communication.'),
])

# ─── save ──────────────────────────────────────────────────────────────────
prs.save(OUT)
print(f"✅  Saved: {OUT}  ({len(slides)} slides)")
