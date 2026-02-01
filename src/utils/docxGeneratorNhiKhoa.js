import { Packer, Document, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import {
    createPara,
    createHeading,
    createLabelValue,
    createLabelValueIf,
    splitLinesToParas,
    createLabelValueMultiline,
    hasText,
    createTitle,
    createDateParagraph,
    getDefaultDocStyles,
    getDefaultSectionProps,
    formatDateTime,
    formatDate,
    buildClsDeNghiParas,
    buildTuVanParas
} from './docxBase';

export const generateNhiKhoaDocx = async (data) => {
    try {
        const dateNow = formatDateTime(data?.ngayLamBenhAn || new Date());

        // Dòng "3. Sinh ngày: xxxx (xx tuổi)"
        const paraSinhNgayRow = new Paragraph({
            spacing: { line: 360, lineRule: "auto" },
            children: [
                new TextRun({ text: "3. Sinh ngày: ", bold: true, font: "Times New Roman", size: 28 }),
                new TextRun({ text: `${formatDate(data.ngaySinh)} `, bold: false, font: "Times New Roman", size: 28 }),
                new TextRun({ text: `(${data.tuoi})`, bold: false, font: "Times New Roman", size: 28 }),
            ],
        });

        const doc = new Document({
            styles: getDefaultDocStyles(),
            sections: [{
                properties: getDefaultSectionProps(),
                children: [
                    createTitle("BỆNH ÁN NHI KHOA"),
                    createDateParagraph(dateNow),

                    createHeading("A. ", "PHẦN HÀNH CHÁNH", { spacing: { before: 100, after: 100 } }),
                    createLabelValue("1. Họ và tên: ", data.hoTen),
                    createLabelValue("2. Giới tính: ", data.gioiTinh),
                    paraSinhNgayRow,
                    createLabelValue("4. Dân tộc: ", data.danToc),
                    createLabelValue("5. Họ tên bố/mẹ: ", data.hotenBoMe),
                    createLabelValue("6. Nghề nghiệp: ", data.ngheNghiep),
                    ...createLabelValueIf("Tôn giáo: ", data.tonGiao),
                    createLabelValue("7. Địa chỉ: ", data.diaChi),
                    ...createLabelValueIf("Bệnh viện: ", data.benhVien),
                    ...createLabelValueIf("Khoa/Phòng/Giường: ", data.khoaPhongGiuong),
                    ...createLabelValueIf("Liên hệ người thân (tên): ", data.lienHeNguoiThanTen),
                    ...createLabelValueIf("Liên hệ người thân (SĐT): ", data.lienHeNguoiThanSdt),
                    createLabelValue("8. Ngày giờ vào viện: ", formatDateTime(data.ngayVaoVien), { spacing: { after: 0 } }),
                    ...createLabelValueIf("Ngày giờ làm bệnh án: ", formatDateTime(data.ngayLamBenhAn), { spacing: { after: 120 } }),

                    createHeading("B. ", "PHẦN BỆNH ÁN", { spacing: { before: 180, after: 100 } }),

                    createHeading("I. ", "Hỏi bệnh", { spacing: { before: 120, after: 60 } }),
                    ...createLabelValueMultiline("1. Lý do vào viện: ", data.lyDo),
                    createHeading("2. ", "Bệnh sử:", { spacing: { before: 60, after: 0 } }),
                    ...splitLinesToParas(data.benhSu),
                    createHeading("3. ", "Tiền sử:", { spacing: { before: 60, after: 0 } }),
                    ...splitLinesToParas(data.tienSu),

                    createHeading("II. ", "Khám bệnh", { spacing: { before: 160, after: 60 } }),
                    ...(hasText(data.khamLucVaoVien)
                        ? [
                            createHeading("", "Khám lúc vào viện:", { spacing: { before: 0, after: 0 } }),
                            ...splitLinesToParas(data.khamLucVaoVien),
                        ]
                        : []
                    ),
                    createHeading("1. ", "Toàn trạng:", { spacing: { after: 0 } }),
                    createPara(`- Sinh hiệu: Mạch ${data.mach || ''} lần/phút, nhiệt độ: ${data.nhietDo || ''}°C, HA ${data.haTren || ''}/${data.haDuoi || ''} mmHg, nhịp thở: ${data.nhipTho || ''} lần/phút`),
                    createPara(`- Chiều cao: ${data.chieuCao || ''} cm, cân nặng: ${data.canNang || ''} kg, Đánh giá Z-score: CN/Tuổi ${data.wa || '-'}; CC/Tuổi ${data.ha || '-'}; CN/CC ${data.wh || '-'}`),
                    ...splitLinesToParas(data.toanThan),

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

                    createHeading("C. ", "PHẦN BIỆN LUẬN", { spacing: { before: 180, after: 60 } }),
                    ...splitLinesToParas(data.bienLuan),
                ],
            }],
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `${data.hoTen || 'benhan_nhikhoa'}.docx`);
    } catch (err) {
        console.error(err);
        alert('Lỗi tạo file DOCX: ' + err.message);
    }
};
