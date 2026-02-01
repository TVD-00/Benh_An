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

export const generateHauPhauDocx = async (data) => {
    try {
        const dateNow = formatDateTime(data?.ngayLamBenhAn || new Date());

        const doc = new Document({
            styles: getDefaultDocStyles(),
            sections: [{
                properties: getDefaultSectionProps(),
                children: [
                    createTitle("BỆNH ÁN HẬU PHẪU"),
                    createDateParagraph(dateNow),

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

                    createHeading("B. ", "PHẦN BỆNH ÁN", { spacing: { before: 180, after: 100 } }),

                    createHeading("I. ", "Hỏi bệnh", { spacing: { before: 120, after: 60 } }),
                    ...createLabelValueMultiline("1. Lý do vào viện: ", data.lyDo),

                    createHeading("2. ", "Bệnh sử:", {}),

                    createHeading("", "Quá trình trước mổ", { spacing: { before: 40 } }),
                    ...splitLinesToParas(data.benhSuTruocMo),

                    createHeading("", "Quá trình mổ", { spacing: { before: 40 } }),
                    createPara(`- Chẩn đoán trước mổ: ${data.chanDoanTruocMo || ''}`),
                    createPara(`- Phân loại: ${data.phanLoaiMo || ''}`),
                    createPara(`- Thời gian mổ: ${data.thoiGianMo || ''}`),
                    createPara(`- Phương pháp: ${data.phuongPhapMo || ''}`),
                    createPara("- Tường trình phẫu thuật:"),
                    ...splitLinesToParas(data.tuongTrinhPhauThuat),

                    createHeading("", "Diễn tiến hậu phẫu", { spacing: { before: 40 } }),
                    ...splitLinesToParas(data.dienTienHauPhau),

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
                    createPara(`- Chiều cao: ${data.chieuCao || ''} cm, cân nặng: ${data.canNang || ''} kg, BMI = ${data.bmi || ''} kg/m² => Phân loại ${data.phanLoaiBMI || '-'} theo WHO Asia`),
                    ...splitLinesToParas(data.toanThan),

                    createHeading("2. ", "Bệnh ngoại khoa:", { spacing: { before: 120, after: 0 } }),
                    ...splitLinesToParas(data.benhNgoaiKhoa),

                    createHeading("3. ", "Khám cơ quan:", { spacing: { before: 120, after: 20 } }),
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

                    createHeading("4. ", "Các cận lâm sàng đã làm:", { spacing: { before: 60, after: 0 } }),
                    ...splitLinesToParas(data.clsDaLam),

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
        saveAs(blob, `${data.hoTen || 'benhan_hauphau'}.docx`);
    } catch (err) {
        console.error(err);
        alert('Lỗi tạo file DOCX: ' + err.message);
    }
};
