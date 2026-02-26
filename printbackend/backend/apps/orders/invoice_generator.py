"""
PDF Invoice generation using ReportLab.
Generates professional invoices with company branding.
"""
import io
import os
from decimal import Decimal
from django.conf import settings
from django.core.files.base import ContentFile
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable


COMPANY_NAME = "PrintShop India"
COMPANY_ADDRESS = "123 Print Street, Mumbai, Maharashtra 400001"
COMPANY_PHONE = "+91 98765 43210"
COMPANY_EMAIL = "orders@printshop.in"
COMPANY_GSTIN = "27AABCU9603R1ZM"


def generate_invoice_pdf(invoice):
    """
    Generate a PDF invoice and save it to the Invoice model's pdf_file field.
    Returns the Invoice instance with the PDF attached.
    """
    buffer = io.BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    styles = getSampleStyleSheet()
    elements = []

    # Custom styles
    title_style = ParagraphStyle(
        'InvoiceTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#06b6d4'),
        spaceAfter=6,
    )
    subtitle_style = ParagraphStyle(
        'InvoiceSubtitle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#6b7280'),
    )
    heading_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontSize=12,
        textColor=colors.HexColor('#111827'),
        spaceBefore=12,
        spaceAfter=6,
    )
    normal_style = styles['Normal']

    order = invoice.order

    # ── HEADER ──
    elements.append(Paragraph(COMPANY_NAME, title_style))
    elements.append(Paragraph(COMPANY_ADDRESS, subtitle_style))
    elements.append(Paragraph(f"Phone: {COMPANY_PHONE}  |  Email: {COMPANY_EMAIL}", subtitle_style))
    elements.append(Paragraph(f"GSTIN: {COMPANY_GSTIN}", subtitle_style))
    elements.append(Spacer(1, 8 * mm))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#e5e7eb')))
    elements.append(Spacer(1, 6 * mm))

    # ── INVOICE DETAILS ──
    elements.append(Paragraph("TAX INVOICE", ParagraphStyle(
        'TaxInvoice', parent=styles['Heading1'], fontSize=16,
        textColor=colors.HexColor('#111827'), alignment=1,
    )))
    elements.append(Spacer(1, 4 * mm))

    invoice_info = [
        ['Invoice Number:', invoice.invoice_number, 'Order Number:', f'#{order.id}'],
        ['Invoice Date:', invoice.issued_at.strftime('%d %b %Y'), 'Order Date:', order.created_at.strftime('%d %b %Y')],
        ['Payment Method:', order.payment_method or 'N/A', 'Payment Status:', 'Paid' if order.is_paid else 'Unpaid'],
    ]
    info_table = Table(invoice_info, colWidths=[3.5 * cm, 5 * cm, 3.5 * cm, 5 * cm])
    info_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#6b7280')),
        ('TEXTCOLOR', (2, 0), (2, -1), colors.HexColor('#6b7280')),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica-Bold'),
        ('FONTNAME', (3, 0), (3, -1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 6 * mm))

    # ── SHIPPING ADDRESS ──
    if order.shipping_address:
        addr = order.shipping_address
        elements.append(Paragraph("Ship To:", heading_style))
        addr_text = f"""
        <b>{addr.recipient_name}</b><br/>
        {addr.street}<br/>
        {f'{addr.apartment_suite}<br/>' if addr.apartment_suite else ''}
        {addr.city}, {addr.state} {addr.zip_code}<br/>
        {addr.country}<br/>
        Phone: {addr.phone_number}
        """
        elements.append(Paragraph(addr_text.strip(), normal_style))
        elements.append(Spacer(1, 6 * mm))

    # ── ITEMS TABLE ──
    elements.append(Paragraph("Order Items", heading_style))
    items_header = ['#', 'Product', 'SKU', 'Qty', 'Unit Price (₹)', 'Total (₹)']
    items_data = [items_header]

    for idx, item in enumerate(order.items.all(), 1):
        items_data.append([
            str(idx),
            item.product_name_snapshot or 'N/A',
            item.sku_snapshot or 'N/A',
            str(item.quantity),
            f'{item.unit_price:,.2f}',
            f'{item.total_price:,.2f}',
        ])

    items_table = Table(items_data, colWidths=[1 * cm, 6.5 * cm, 3 * cm, 1.5 * cm, 2.8 * cm, 2.8 * cm])
    items_table.setStyle(TableStyle([
        # Header
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#06b6d4')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        # Body
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
        ('ALIGN', (3, 0), (-1, -1), 'RIGHT'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')]),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 8 * mm))

    # ── TOTALS ──
    totals_data = [
        ['', '', 'Subtotal:', f'₹{invoice.subtotal:,.2f}'],
        ['', '', 'GST (18%):', f'₹{invoice.tax_total:,.2f}'],
        ['', '', 'Shipping:', f'₹{invoice.shipping_total:,.2f}'],
    ]
    if invoice.discount_total > 0:
        totals_data.append(['', '', 'Discount:', f'-₹{invoice.discount_total:,.2f}'])
    totals_data.append(['', '', 'Grand Total:', f'₹{invoice.grand_total:,.2f}'])

    totals_table = Table(totals_data, colWidths=[6 * cm, 4 * cm, 3.5 * cm, 3.5 * cm])
    totals_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TEXTCOLOR', (2, 0), (2, -1), colors.HexColor('#6b7280')),
        ('FONTNAME', (3, 0), (3, -1), 'Helvetica-Bold'),
        ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        # Grand total row
        ('FONTSIZE', (2, -1), (-1, -1), 12),
        ('TEXTCOLOR', (2, -1), (-1, -1), colors.HexColor('#06b6d4')),
        ('LINEABOVE', (2, -1), (-1, -1), 1, colors.HexColor('#06b6d4')),
        ('TOPPADDING', (0, -1), (-1, -1), 8),
    ]))
    elements.append(totals_table)
    elements.append(Spacer(1, 12 * mm))

    # ── FOOTER ──
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#e5e7eb')))
    elements.append(Spacer(1, 4 * mm))
    footer_style = ParagraphStyle(
        'Footer', parent=styles['Normal'],
        fontSize=8, textColor=colors.HexColor('#9ca3af'), alignment=1,
    )
    elements.append(Paragraph("Thank you for your order!", footer_style))
    elements.append(Paragraph(
        f"This is a computer-generated invoice. No signature required. | {COMPANY_NAME}",
        footer_style
    ))

    # Build the PDF
    doc.build(elements)

    # Save to model
    pdf_content = buffer.getvalue()
    buffer.close()
    filename = f"invoice_{invoice.invoice_number}.pdf"
    invoice.pdf_file.save(filename, ContentFile(pdf_content), save=True)

    return invoice
