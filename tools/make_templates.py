# Generates the 4 Word templates in server/templates-docx (Party 1 / Party 2 format).
# Run: python3 tools/make_templates.py
from docx import Document
from docx.shared import Pt

OUT = 'server/templates-docx'

P1 = [('Name', '{{owner_name}}'), ("Father's / Husband's Name", '{{owner_relation}}'),
      ('Address', '{{owner_address}}'), ('Mobile', '{{owner_mobile}}'), ('Aadhaar', '{{owner_aadhaar}}')]
P2 = [('Name', '{{tenant_name}}'), ("Father's / Husband's Name", '{{tenant_relation}}'),
      ('Address', '{{tenant_address}}'), ('Mobile', '{{tenant_mobile}}'), ('Aadhaar', '{{tenant_aadhaar}}')]


def para(doc, *runs, style=None):
    p = doc.add_paragraph(style=style)
    for r in runs:
        if isinstance(r, tuple):
            text, fmt = r
            run = p.add_run(text)
            run.bold = 'b' in fmt
            run.italic = 'i' in fmt
        else:
            p.add_run(r)
    return p


def table(doc, header, rows):
    t = doc.add_table(rows=0, cols=len(header))
    t.style = 'Table Grid'
    cells = t.add_row().cells
    for c, h in zip(cells, header):
        c.paragraphs[0].add_run(h).bold = True
    for row in rows:
        cells = t.add_row().cells
        for i, (c, v) in enumerate(zip(cells, row)):
            run = c.paragraphs[0].add_run(v)
            if i == 0 and len(row) > 1:
                run.bold = True
    return t


def build(file, title, subtitle, h, owner_word, tenant_word, premises_word, purpose, property_rows):
    doc = Document()
    doc.styles['Normal'].font.size = Pt(11)
    doc.add_paragraph(title, style='Title')
    para(doc, (subtitle, 'i'))
    para(doc, ('Date: ', 'b'), '{{agreement_date}}')

    para(doc, 'This Rental Agreement is made and executed on {{agreement_date}} by and between the parties '
              'named below. Both parties have entered into this agreement on their own free will and have '
              'agreed to the terms and conditions set out in this document.')

    doc.add_paragraph(f'{h[0]} Party 1 — {owner_word}', style='Heading 2')
    table(doc, ['Particulars', 'Details'], P1)
    para(doc, (f'(hereinafter referred to as “Party 1” or the “{owner_word.split(" ")[0]}”, which expression shall '
               'include their legal heirs, representatives and assigns)', 'i'))

    para(doc, ('AND', 'b'))

    doc.add_paragraph(f'{h[1]} Party 2 — {tenant_word}', style='Heading 2')
    table(doc, ['Particulars', 'Details'], P2)
    para(doc, (f'(hereinafter referred to as “Party 2” or the “{tenant_word.split(" ")[0]}”, which expression shall '
               'include their legal heirs, representatives and assigns)', 'i'))

    doc.add_paragraph(f'{h[2]} The {premises_word}', style='Heading 2')
    para(doc, ('WHEREAS ', 'b'),
         f'Party 1 is the owner of the {premises_word.lower()} situated at {{{{property_address}}}}, '
         f'more fully described below (hereinafter called the “{premises_word}”).')
    para(doc, ('AND WHEREAS ', 'b'),
         f'Party 2 has requested Party 1 to let out the said {premises_word.lower()}, and Party 1 has agreed to let '
         f'it out to Party 2, who shall {purpose}, strictly on the terms and conditions given below.')
    table(doc, ['Particulars', 'Details'], property_rows)

    doc.add_paragraph(f'{h[3]} Terms and Conditions', style='Heading 2')
    para(doc, ('NOW THIS AGREEMENT WITNESSES ', 'b'), 'that both parties agree to the following:')
    para(doc, '{{terms_and_conditions}}')

    doc.add_paragraph(f'{h[4]} Signatures', style='Heading 2')
    para(doc, ('IN WITNESS WHEREOF ', 'b'),
         'both parties have read and understood this agreement and have signed it on the date first mentioned '
         'above, in the presence of the witnesses named below.')
    t = doc.add_table(rows=3, cols=2)
    t.style = 'Table Grid'
    t.cell(0, 0).paragraphs[0].add_run(f'PARTY 1 ({owner_word.upper()})').bold = True
    t.cell(0, 1).paragraphs[0].add_run(f'PARTY 2 ({tenant_word.upper()})').bold = True
    for c in (t.cell(1, 0), t.cell(1, 1)):
        c.paragraphs[0].add_run('Signature:')
    t.cell(2, 0).paragraphs[0].add_run('{{owner_name}}')
    t.cell(2, 1).paragraphs[0].add_run('{{tenant_name}}')
    para(doc, ('Witnesses:', 'b'))
    para(doc, '1. Name & Address: ____________________________________   Signature: ______________')
    para(doc, '2. Name & Address: ____________________________________   Signature: ______________')
    doc.save(f'{OUT}/{file}.docx')


RENT = [('Monthly Rent', '{{monthly_rent}} ({{monthly_rent_words}})'),
        ('Security Deposit', '{{security_deposit}} ({{security_deposit_words}})'),
        ('Agreement Period', '{{agreement_start_date}} to {{agreement_end_date}}'),
        ('Duration', '{{agreement_duration}}')]
PROP = [('Property Address', '{{property_address}}'), ('Property Type', '{{property_type}}'),
        ('Property Details', '{{property_description}}')]

build('house', 'HOUSE RENTAL AGREEMENT', 'Independent House / Villa', ['1.', '2.', '3.', '4.', '5.'],
      'Owner (Landlord)', 'Tenant', 'Property', 'reside in it with their family for residential purposes only',
      PROP + RENT)
build('residential', 'RESIDENTIAL RENTAL AGREEMENT', 'Apartment / Flat / Residential Unit', ['1.', '2.', '3.', '4.', '5.'],
      'Owner (Landlord)', 'Tenant', 'Property', 'reside in it for residential purposes only', PROP + RENT)
build('commercial', 'COMMERCIAL RENTAL AGREEMENT', 'Shop / Office / Godown / Business Premises', ['1.', '2.', '3.', '4.', '5.'],
      'Owner (Lessor)', 'Tenant (Lessee)', 'Premises', 'use it only for the business purpose agreed with Party 1',
      [('Premises Address', '{{property_address}}'), ('Premises Type', '{{property_type}}'),
       ('Premises Details', '{{property_description}}')] + RENT)
build('custom', 'RENTAL AGREEMENT', 'Custom Format', ['I.', 'II.', 'III.', 'IV.', 'V.'],
      'Owner', 'Tenant', 'Property', 'occupy it only for the purpose stated in this agreement', PROP + RENT)
print('ok')
