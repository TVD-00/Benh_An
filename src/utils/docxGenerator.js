// ============================================================================
// GENERATOR DOCX: SẢN KHOA
// ============================================================================
// EN: Obstetrics Medical Record DOCX Generator
// VI: Trình tạo file DOCX Bệnh án Sản khoa
//
// EN: Purpose: Generate Word document (DOCX) from form data for Obstetrics.
//     Uses 'docx' library to render document structure.
// VI: Mục đích: Tạo file Word bệnh án Sản khoa từ dữ liệu form.
//     Sử dụng thư viện 'docx' để render cấu trúc văn bản.

import { Packer, Document } from 'docx';
import { saveAs } from 'file-saver';
import {
    createPara,
    createHeading,
    createLabelValue,
    createLabelValueIf,
    splitLinesToParas,
    hasText,
    createLabelValueMultiline,
    createNamSinhRow,
    createTitle,
    createDateParagraph,
    getDefaultDocStyles,
    getDefaultSectionProps,
    formatDateTime,
    buildClsDeNghiParas,
    buildTuVanParas
} from './docxBase';

export const generateDocx = async (data) => {
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
                    createTitle("BỆNH ÁN SẢN KHOA"),
                    createDateParagraph(dateNow),

                    // --- A. ADMINISTRATIVE SECTION (PHẦN HÀNH CHÍNH) ---
                    createHeading("A. ", "PHẦN HÀNH CHÁNH", { spacing: { before: 100, after: 100 } }),
                    createLabelValue("1. Họ và tên: ", data.hoTen),
                    createNamSinhRow(data.namSinh, data.tuoi),
                    // EN: "PARA" is specific to Obstetrics (Parity)
                    // VI: "PARA" chỉ có ở Sản Khoa
                    createLabelValue("3. PARA: ", data.para),
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
                    
                    createHeading("2. ", "Tiền sử:", { spacing: { before: 60, after: 0 } }),
                    ...splitLinesToParas(data.tienSu),
                    
                    createHeading("3. ", "Bệnh sử:", { spacing: { before: 60, after: 0 } }),
                    ...splitLinesToParas(data.benhSuNhapVien),

                    // EN: Obstetrics Specific: Pregnancy History
                    // VI: Phần riêng của Sản khoa: Quá trình khám thai
                    createHeading("", "Quá trình khám thai", { spacing: { before: 40, after: 0 } }),
                    ...splitLinesToParas(data.khamThaiComputed),

                    // II. Physical Examination (Khám bệnh)
                    createHeading("II. ", "Khám bệnh", { spacing: { before: 160, after: 60 } }),
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

                    // 2. Organ Examination (Các cơ quan)
                    createHeading("2. ", "Các cơ quan:", { spacing: { before: 120, after: 20 } }),
                    createHeading("a) ", "Tuần hoàn:", { spacing: { after: 0 } }),
                    ...splitLinesToParas(data.timmach),
                    createHeading("b) ", "Hô hấp:", { spacing: { before: 40, after: 0 } }),
                    ...splitLinesToParas(data.hohap),
                    createHeading("c) ", "Thận - tiết niệu:", { spacing: { before: 40, after: 0 } }),
                    ...splitLinesToParas(data.than),
                    createHeading("d) ", "Thần kinh:", { spacing: { before: 40, after: 0 } }),
                    ...splitLinesToParas(data.thankinh),
                    createHeading("e) ", "Cơ - Xương - Khớp:", { spacing: { before: 40, after: 0 } }),
                    ...splitLinesToParas(data.cokhop),
                    createLabelValue("f) Các cơ quan khác: ", data.coQuanKhac, { spacing: { before: 40, after: 0 } }),

                    // 3. Specialist Examination (Khám chuyên khoa Sản)
                    createHeading("3. ", "Khám chuyên khoa:", { spacing: { before: 60, after: 0 } }),
                    ...splitLinesToParas(data.khamChuyenKhoa),

                    // 4. Lab Tests Done (Cận lâm sàng đã làm)
                    createHeading("4. ", "Các cận lâm sàng đã làm:", { spacing: { before: 60, after: 0 } }),
                    ...splitLinesToParas(data.clsDaLam),

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

                    createHeading("6. ", "Tiên lượng:", { spacing: { before: 60, after: 0 } }),
                    ...splitLinesToParas(data.tienLuong),

                    createHeading("7. ", "Điều trị:", { spacing: { before: 60 } }),
                    createHeading("a) ", "Hướng điều trị:", { spacing: { after: 0 } }),
                    ...splitLinesToParas(data.huongDieuTri),
                    createHeading("b) ", "Điều trị cụ thể:", { spacing: { before: 40, after: 0 } }),
                    ...splitLinesToParas(data.dieuTri),

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

        // EN: Pack and Download
        // VI: Pack và Download
        const blob = await Packer.toBlob(doc);
        saveAs(blob, `${data.hoTen || 'benhan_sankhoa'}.docx`);
    } catch (err) {
        console.error(err);
        alert('Lỗi tạo file DOCX: ' + err.message);
    }
};
