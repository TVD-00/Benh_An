// ============================================================================
// BASE UTILITIES FOR DOCX GENERATION
// ============================================================================
// EN: Common configuration (fonts, margins) and helper functions for generating
// basic Word document components (paragraphs, headings, label-value pairs).
// This keeps the DOCX generation code clean and consistent across specialties.
//
// VI: Chứa các cấu hình chung (font, margin) và các hàm helper để tạo
// các thành phần cơ bản của file Word (đoạn văn, tiêu đề, cặp nhãn-giá trị).
// Giúp code tạo DOCX ở các chuyên khoa gọn gàng và nhất quán hơn.

import { Paragraph, TextRun, AlignmentType, PageOrientation, LineRuleType } from 'docx';

// --- DOCX CONFIGURATION (CẤU HÌNH DOCX) ---
// EN: Adhere to administrative/medical document standards
// VI: Tuân thủ quy chuẩn trình bày văn bản hành chính/y tế
export const DOCX_CONFIG = {
    // EN: Unit in twips (1/1440 inch). 1134 twips ~ 2cm. Standard A4 margin.
    // VI: Đơn vị twip (1/1440 inch). 1134 twips ~ 2cm. Dùng cho căn lề chuẩn A4.
    MARGIN_2CM: 1134,
    
    // EN: 360 = 1.5 line spacing (240 = single). Improves readability.
    // VI: 360 = 1.5 line spacing (240 = single). Giúp văn bản thoáng, dễ đọc.
    LINE_15: 360,
    
    // EN: Unit in half-point. 28 = 14pt (standard text size).
    // VI: Đơn vị half-point. 28 = 14pt (chuẩn văn bản thông thường).
    FONT_SIZE: 28,
    
    // EN: 40 = 20pt (used for main titles).
    // VI: 40 = 20pt (dùng cho tiêu đề lớn).
    TITLE_SIZE: 40,
    
    // EN: Standard serif font for printed documents in VN.
    // VI: Font serif chuẩn cho văn bản in ấn tại VN.
    FONT_FAMILY: "Times New Roman"
};

// EN: Default text style
// VI: Style mặc định cho text
export const runBase = {
    font: DOCX_CONFIG.FONT_FAMILY,
    size: DOCX_CONFIG.FONT_SIZE
};

// EN: Default paragraph style
// VI: Style mặc định cho đoạn văn (Paragraph)
export const basePara = {
    spacing: { line: DOCX_CONFIG.LINE_15, lineRule: LineRuleType.AUTO }
};

// EN: Helper check empty string
// VI: Helper kiểm tra rỗng
export function hasText(value) {
    return String(value ?? '').trim().length > 0;
}

/**
 * EN: Create a Normal Paragraph
 * VI: Tạo một đoạn văn bản thường (Normal Paragraph)
 * @param {string} text - EN: Content text / VI: Nội dung văn bản
 * @param {object} opts - EN: Override options (spacing, alignment...) / VI: Các tùy chọn đè (spacing, alignment...)
 */
export function createPara(text, opts = {}) {
    return new Paragraph({
        ...basePara,
        ...opts,
        children: [
            new TextRun({ text: text || "", bold: false, ...runBase, ...(opts.run || {}) }),
        ],
    });
}

/**
 * EN: Create a Heading
 * Example: "I. ", "Hành chính" -> Both bold.
 * VI: Tạo tiêu đề mục (Heading)
 * Ví dụ: "I. ", "Hành chính" -> In đậm cả hai.
 * @param {string} prefixBold - EN: Numbering/Prefix (e.g., "1. ", "I. ") / VI: Phần số thứ tự (VD: "1. ", "I. ")
 * @param {string} titleBold - EN: Heading content / VI: Nội dung tiêu đề
 */
export function createHeading(prefixBold, titleBold, opts = {}) {
    return new Paragraph({
        ...basePara,
        ...opts,
        children: [
            new TextRun({ text: prefixBold || "", bold: true, ...runBase }),
            new TextRun({ text: titleBold || "", bold: true, ...runBase }),
        ],
    });
}

/**
 * EN: Create a "Label: Value" pair
 * Commonly used for administrative section. E.g., "Name: " (bold) + "John Doe" (normal).
 * VI: Tạo dòng kiểu "Nhãn: Giá trị" (Label-Value pair)
 * Thường dùng cho phần hành chính. VD: "Họ tên: " (đậm) + "Nguyễn Văn A" (thường).
 */
export function createLabelValue(labelBold, valueText, opts = {}) {
    return new Paragraph({
        ...basePara,
        ...opts,
        children: [
            new TextRun({ text: labelBold || "", bold: true, ...runBase }),
            new TextRun({ text: valueText || "", bold: false, ...runBase }),
        ],
    });
}

// VI: Chỉ tạo dòng nếu có dữ liệu (tránh in field trống)
export function createLabelValueIf(labelBold, valueText, opts = {}) {
    if (!hasText(valueText)) return [];
    return [createLabelValue(labelBold, valueText, opts)];
}

/**
 * EN: Split multi-line text into separate Paragraphs.
 * Handles cases where users copy-paste or use line breaks in textareas.
 * VI: Tách văn bản nhiều dòng thành nhiều đoạn (Paragraph) riêng biệt.
 * Xử lý trường hợp người dùng copy-paste hoặc xuống dòng trong textarea.
 */
export function splitLinesToParas(text) {
    return String(text || "").split(/\r?\n/).map(line => createPara(line));
}

// VI: Chỉ tách dòng nếu có dữ liệu
export function splitLinesToParasIf(text) {
    if (!hasText(text)) return [];
    return splitLinesToParas(text);
}

/**
 * EN: Create Label-Value with support for Multi-line Value.
 * The first line stays on the same line as Label, subsequent lines start new paragraphs.
 * VI: Tạo Label-Value nhưng hỗ trợ Value nhiều dòng.
 * Dòng đầu tiên sẽ nằm cùng dòng với Label, các dòng sau xuống dòng mới.
 */
export function createLabelValueMultiline(labelBold, valueText, opts = {}) {
    const lines = String(valueText || "").split(/\r?\n/);
    const first = lines.shift() ?? "";

    const out = [
        new Paragraph({
            ...basePara,
            ...opts,
            children: [
                new TextRun({ text: labelBold || "", bold: true, ...runBase }),
                new TextRun({ text: first, bold: false, ...runBase }),
            ],
        }),
    ];

    // EN: Subsequent lines create separate paragraphs
    // VI: Các dòng tiếp theo tạo thành paragraph riêng
    for (const line of lines) out.push(createPara(line));
    return out;
}

// VI: Chỉ tạo Label-Value multiline nếu có dữ liệu
export function createLabelValueMultilineIf(labelBold, valueText, opts = {}) {
    if (!hasText(valueText)) return [];
    return createLabelValueMultiline(labelBold, valueText, opts);
}

/**
 * EN: Specialized helper for Birth Year / Age row
 * Format: "Birth Year: " [year] "(... age)"
 * VI: Helper riêng cho dòng Năm sinh/Tuổi
 * Format: "Năm sinh: " [năm] "(... tuổi)"
 */
export function createNamSinhRow(namSinh, tuoi) {
    return new Paragraph({
        ...basePara,
        children: [
            new TextRun({ text: "Năm sinh: ", bold: true, ...runBase }),
            new TextRun({ text: `${namSinh || ''} `, bold: false, ...runBase }),
            new TextRun({ text: `(${tuoi || ''} tuổi)`, bold: false, ...runBase }),
        ],
    });
}

/**
 * EN: Create Main Title (Centered)
 * VI: Tạo Tiêu đề lớn giữa trang (CENTER)
 */
export function createTitle(titleText) {
    return new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200, line: DOCX_CONFIG.LINE_15, lineRule: LineRuleType.AUTO },
        children: [
            new TextRun({
                text: titleText,
                bold: true,
                font: DOCX_CONFIG.FONT_FAMILY,
                size: DOCX_CONFIG.TITLE_SIZE,
            }),
        ],
    });
}

/**
 * EN: Create Date Paragraph (Italic)
 * VI: Tạo dòng ngày tháng làm bệnh án (in nghiêng)
 */
export function createDateParagraph(dateStr) {
    return new Paragraph({
        ...basePara,
        spacing: { ...basePara.spacing, after: 200 },
        children: [
            new TextRun({ text: `Ngày làm bệnh án: ${dateStr}`, italics: true, bold: false, ...runBase }),
        ],
    });
}

/**
 * EN: Default Style Configuration for the entire Document
 * VI: Cấu hình style mặc định cho toàn bộ Document
 */
export function getDefaultDocStyles() {
    return {
        default: {
            document: {
                run: { font: DOCX_CONFIG.FONT_FAMILY, size: DOCX_CONFIG.FONT_SIZE },
                paragraph: { spacing: { line: DOCX_CONFIG.LINE_15, lineRule: LineRuleType.AUTO } },
            },
        },
    };
}

/**
 * EN: Section Properties Configuration (A4 Margins)
 * VI: Cấu hình Section Properties (Lề trang A4)
 */
export function getDefaultSectionProps() {
    return {
        page: {
            margin: {
                top: DOCX_CONFIG.MARGIN_2CM,
                right: DOCX_CONFIG.MARGIN_2CM,
                bottom: DOCX_CONFIG.MARGIN_2CM,
                left: DOCX_CONFIG.MARGIN_2CM
            },
            size: { orientation: PageOrientation.PORTRAIT },
        },
    };
}

// --- DATA FORMATTING HELPERS (HELPERS FORMAT DỮ LIỆU) ---

// EN: Format date string to "HH:mm:ss dd/MM/yyyy"
// VI: Format date string sang "HH:mm:ss dd/MM/yyyy"
export function formatDateTime(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('vi-VN');
}

// EN: Format date string to "dd/MM/yyyy"
// VI: Format date string sang "dd/MM/yyyy"
export function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}

export function formatDDMMYYYY(dateObj) {
    if (!dateObj || isNaN(dateObj.getTime())) return '';
    const d = dateObj.getDate().toString().padStart(2, '0');
    const m = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const y = dateObj.getFullYear();
    return `${d}/${m}/${y}`;
}

// EN: Helper to trigger file download from Blob (browser environment)
// VI: Helper trigger download file từ Blob (chạy trên trình duyệt)
export function downloadBlob(blob, fileName) {
    const docxBlob = new Blob([blob], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

    const url = URL.createObjectURL(docxBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// EN: Remove special characters for safe filenames
// VI: Loại bỏ ký tự đặc biệt để dùng làm tên file an toàn
export function normalizeFileName(name) {
    if (!name) return 'benh_an';
    return name
        .trim()
        .replace(/[<>:"/\\|?*]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 100);
}

// VI: Render nhóm CLS đề nghị theo mục tiêu
export function buildClsDeNghiParas(data) {
    const out = [];
    const groups = [
        {
            title: 'Chẩn đoán',
            presets: data?.clsChanDoanPresets,
            note: data?.clsChuanDoan
        },
        {
            title: 'Tìm nguyên nhân',
            presets: data?.clsTimNguyenNhanPresets,
            note: data?.clsThuongQuy
        },
        {
            title: 'Hỗ trợ điều trị',
            presets: data?.clsHoTroDieuTriPresets,
            note: data?.clsHoTroDieuTri
        },
        {
            title: 'Theo dõi/tiên lượng',
            presets: data?.clsTheoDoiTienLuongPresets,
            note: data?.clsTheoDoiTienLuong
        }
    ];

    for (const g of groups) {
        const presetArr = Array.isArray(g.presets) ? g.presets.filter(hasText) : [];
        const hasPreset = presetArr.length > 0;
        const hasNote = hasText(g.note);
        if (!hasPreset && !hasNote) continue;

        out.push(createHeading('', `${g.title}:`, { spacing: { before: 20, after: 0 } }));
        if (hasPreset) {
            for (const p of presetArr) out.push(createPara(`- ${p}`));
        }
        if (hasNote) {
            out.push(...splitLinesToParas(g.note));
        }
    }

    return out;
}

// VI: Render mục Tư vấn (presets + textarea) - có thể tắt in bằng tuVanInDocx
export function buildTuVanParas(data) {
    const enabled = data?.tuVanInDocx !== false;
    if (!enabled) return [];

    const presets = Array.isArray(data?.tuVanPresets) ? data.tuVanPresets.filter(hasText) : [];
    const hasPreset = presets.length > 0;
    const hasNote = hasText(data?.tuVan);
    if (!hasPreset && !hasNote) return [];

    const out = [];
    if (hasPreset) {
        for (const p of presets) out.push(createPara(`- ${p}`));
    }
    if (hasNote) out.push(...splitLinesToParas(data.tuVan));
    return out;
}
