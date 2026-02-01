// ============================================================================
// GENERATOR DOCX: NỘI KHOA
// ============================================================================
// EN: Internal Medicine Medical Record DOCX Generator
// VI: Trình tạo file DOCX Bệnh án Nội khoa
//
// EN: Purpose: Generate Word document (DOCX) from form data for Internal Medicine.
// VI: Mục đích: Tạo file Word (DOCX) từ dữ liệu form cho chuyên khoa Nội.

import { Packer, Document } from 'docx';
import {
    createPara,
    createHeading,
    createLabelValue,
    createLabelValueIf,
    splitLinesToParas,
    createLabelValueMultiline,
    hasText,
    createNamSinhRow,
    createTitle,
    createDateParagraph,
    getDefaultDocStyles,
    getDefaultSectionProps,
    formatDateTime,
    buildClsDeNghiParas,
    buildTuVanParas
} from './docxBase';

// EN: Helper function to trigger file download in browser
// VI: Hàm hỗ trợ để kích hoạt tải xuống file trong trình duyệt
function downloadBlob(blob, fileName) {
    // EN: Create blob with explicit MIME type for Word document
    // VI: Tạo blob với MIME type rõ ràng cho tài liệu Word
    const docxBlob = new Blob([blob], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

    // EN: Create URL and download link
    // VI: Tạo URL và link download
    const url = URL.createObjectURL(docxBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;

    // EN: Programmatically click the link to trigger download
    // VI: Giả lập click vào link để kích hoạt tải xuống
    document.body.appendChild(link);
    link.click();

    // EN: Cleanup DOM elements and revoke URL
    // VI: Dọn dẹp các phần tử DOM và thu hồi URL
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// EN: Normalize file name (remove special characters)
// VI: Chuẩn hóa tên file (loại bỏ ký tự đặc biệt)
function normalizeFileName(name) {
    if (!name) return 'benh_an';
    // EN: Remove invalid characters for filenames
    // VI: Loại bỏ ký tự không hợp lệ cho tên file
    return name
        .trim()
        .replace(/[<>:"/\\|?*]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 100); // EN: Limit length / VI: Giới hạn độ dài
}

export const generateNoiKhoaDocx = async (data) => {
    try {
        const dateNow = formatDateTime(data?.ngayLamBenhAn || new Date());

        // EN: Initialize Document with standard styles and margins
        // VI: Khởi tạo Document với style và margin chuẩn
        const doc = new Document({
            styles: getDefaultDocStyles(),
            sections: [{
                properties: getDefaultSectionProps(),
                children: [
                    // --- HEADER ---
                    createTitle("BỆNH ÁN NỘI KHOA"),
                    createDateParagraph(dateNow),

                    // --- A. ADMINISTRATIVE SECTION (PHẦN HÀNH CHÁNH) ---
                    createHeading("A. ", "PHẦN HÀNH CHÁNH", { spacing: { before: 100, after: 100 } }),
                    createLabelValue("1. Họ và tên: ", data.hoTen),
                    createLabelValue("2. Giới tính: ", data.gioiTinh),
                    createNamSinhRow(data.namSinh, data.tuoi),
                    createLabelValue("4. Dân tộc: ", data.danToc),
                    createLabelValue("5. Nghề nghiệp: ", data.ngheNghiep),
                    ...createLabelValueIf("Tôn giáo: ", data.tonGiao),
                    createLabelValue("6. Địa chỉ: ", data.diaChi),
                    ...createLabelValueIf("Bệnh viện: ", data.benhVien),
                    ...createLabelValueIf("Khoa/Phòng/Giường: ", data.khoaPhongGiuong),
                    ...createLabelValueIf("Liên hệ người thân (tên): ", data.lienHeNguoiThanTen),
                    ...createLabelValueIf("Liên hệ người thân (SĐT): ", data.lienHeNguoiThanSdt),
                    createLabelValue("7. Ngày giờ vào viện: ", formatDateTime(data.ngayVaoVien), { spacing: { after: 0 } }),
                    ...createLabelValueIf("Ngày giờ làm bệnh án: ", formatDateTime(data.ngayLamBenhAn), { spacing: { after: 120 } }),

                    // --- B. MEDICAL RECORD SECTION (PHẦN BỆNH ÁN) ---
                    createHeading("B. ", "PHẦN BỆNH ÁN", { spacing: { before: 180, after: 100 } }),

                    // I. History Taking (Hỏi bệnh)
                    createHeading("I. ", "Hỏi bệnh", { spacing: { before: 120, after: 60 } }),
                    ...createLabelValueMultiline("1. Lý do vào viện: ", data.lyDo),

                    createHeading("2. ", "Bệnh sử:", { spacing: { before: 60, after: 0 } }),
                    ...splitLinesToParas(data.benhSu),

                    createHeading("3. ", "Tiền sử:", { spacing: { before: 60, after: 0 } }),
                    ...splitLinesToParas(data.tienSu),

                    // II. Physical Examination (Khám bệnh)
                    createHeading("II. ", "Khám bệnh", { spacing: { before: 160, after: 60 } }),

                    // Khám lúc vào viện (ngắn gọn)
                    ...(hasText(data.khamLucVaoVien)
                        ? [
                            createHeading("", "Khám lúc vào viện:", { spacing: { before: 0, after: 0 } }),
                            ...splitLinesToParas(data.khamLucVaoVien),
                        ]
                        : []
                    ),
                    
                    // 1. General Examination (Toàn trạng)
                    createHeading("1. ", "Toàn trạng:", { spacing: { after: 0 } }),
                    createPara(`- Sinh hiệu: Mạch ${data.mach || ''} lần/phút, nhiệt độ: ${data.nhietDo || ''}°C, HA ${data.haTren || ''}/${data.haDuoi || ''} mmHg, nhịp thở: ${data.nhipTho || ''} lần/phút`),
                    createPara(`- Chiều cao: ${data.chieuCao || ''} cm, cân nặng: ${data.canNang || ''} kg, BMI = ${data.bmi || ''} kg/m² => Phân loại ${data.phanLoaiBMI || '-'} theo WHO Asia`),
                    ...splitLinesToParas(data.toanThan),

                    // 2. Organ Examination (Khám cơ quan)
                    createHeading("2. ", "Khám cơ quan:", { spacing: { before: 120, after: 20 } }),
                    createHeading("a) ", "Tuần hoàn:", { spacing: { after: 0 } }),
                    ...splitLinesToParas(data.timmach),
                    createHeading("b) ", "Hô hấp:", { spacing: { before: 40, after: 0 } }),
                    ...splitLinesToParas(data.hohap),
                    createHeading("c) ", "Tiêu hoá:", { spacing: { before: 40, after: 0 } }),
                    ...splitLinesToParas(data.tieuhoa),
                    createHeading("d) ", "Thận - tiết niệu:", { spacing: { before: 40, after: 0 } }),
                    ...splitLinesToParas(data.than),
                    createHeading("e) ", "Thần kinh:", { spacing: { before: 40, after: 0 } }),
                    ...splitLinesToParas(data.thankinh),
                    createHeading("f) ", "Cơ - Xương - Khớp:", { spacing: { before: 40, after: 0 } }),
                    ...splitLinesToParas(data.cokhop),
                    createLabelValue("g) Các cơ quan khác: ", data.coQuanKhac, { spacing: { before: 40, after: 0 } }),

                    // III. Conclusion (Kết luận)
                    createHeading("III. ", "Kết luận", { spacing: { before: 160, after: 60 } }),
                    createHeading("1. ", "Tóm tắt bệnh án:", { spacing: { after: 0 } }),
                    ...splitLinesToParas(data.tomTat),

                    ...createLabelValueMultiline("2. Chẩn đoán sơ bộ: ", data.chanDoan, { spacing: { before: 60 } }),

                    createHeading("3. ", "Chẩn đoán phân biệt:", { spacing: { before: 60, after: 0 } }),
                    ...splitLinesToParas(data.chanDoanPhanBiet),

                    createHeading("4. ", "Đề nghị cận lâm sàng và kết quả:", { spacing: { before: 60 } }),
                    createHeading("a) ", "Đề nghị cận lâm sàng:", { spacing: { before: 20 } }),
                    ...buildClsDeNghiParas(data),

                    createHeading("b) ", "Kết quả:", { spacing: { before: 40, after: 0 } }),
                    ...splitLinesToParas(data.ketQua),

                    createHeading("5. ", "Chẩn đoán xác định:", { spacing: { before: 60, after: 0 } }),
                    ...splitLinesToParas(data.chanDoanXacDinh),

                    createHeading("6. ", "Điều trị:", { spacing: { before: 60 } }),
                    createHeading("a) ", "Hướng điều trị:", { spacing: { after: 0 } }),
                    ...splitLinesToParas(data.huongDieuTri),
                    createHeading("b) ", "Điều trị cụ thể:", { spacing: { before: 40, after: 0 } }),
                    ...splitLinesToParas(data.dieuTri),

                    createHeading("7. ", "Tiên lượng:", { spacing: { before: 60, after: 0 } }),
                    ...splitLinesToParas(data.tienLuong),

                    ...(() => {
                        const tuVanParas = buildTuVanParas(data);
                        return tuVanParas.length
                            ? [createHeading("IV. ", "Tư vấn", { spacing: { before: 160, after: 60 } }), ...tuVanParas]
                            : [];
                    })(),

                    // --- C. DISCUSSION (PHẦN BIỆN LUẬN) ---
                    createHeading("C. ", "PHẦN BIỆN LUẬN", { spacing: { before: 180, after: 60 } }),
                    ...splitLinesToParas(data.bienLuan),
                ],
            }],
        });

        // EN: Generate blob from document
        // VI: Tạo blob từ document
        const blob = await Packer.toBlob(doc);

        // EN: Create filename from patient's name
        // VI: Tạo tên file từ họ tên bệnh nhân
        const fileName = `BenhAn_NoiKhoa_${normalizeFileName(data.hoTen)}.docx`;

        // EN: Trigger download
        // VI: Kích hoạt tải xuống
        downloadBlob(blob, fileName);

    } catch (err) {
        console.error('Lỗi tạo file DOCX:', err);
        throw new Error('Không thể tạo file DOCX: ' + err.message);
    }
};
