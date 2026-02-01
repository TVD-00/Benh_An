import { Packer, Document } from 'docx';
import { saveAs } from 'file-saver';
import {
    createHeading,
    createLabelValue,
    createLabelValueIf,
    splitLinesToParas,
    createLabelValueMultiline,
    createNamSinhRow,
    createTitle,
    createDateParagraph,
    getDefaultDocStyles,
    getDefaultSectionProps,
    formatDateTime,
    hasText,
    buildTuVanParas,
    normalizeFileName
} from './docxBase';

export const generateYHCTDocx = async (data) => {
    try {
        const dateNow = formatDateTime(data?.ngayLamBenhAn || new Date());

        const tuVanParas = buildTuVanParas(data);
        const shouldPrintTuVan = tuVanParas.length > 0;

        const doc = new Document({
            styles: getDefaultDocStyles(),
            sections: [{
                properties: getDefaultSectionProps(),
                children: [
                    createTitle('BỆNH ÁN Y HỌC CỔ TRUYỀN'),
                    createDateParagraph(dateNow),

                    createHeading('A. ', 'PHẦN HÀNH CHÁNH', { spacing: { before: 100, after: 100 } }),
                    createLabelValue('1. Họ và tên: ', data.hoTen),
                    createLabelValue('2. Giới tính: ', data.gioiTinh),
                    createNamSinhRow(data.namSinh, data.tuoi),
                    createLabelValue('4. Dân tộc: ', data.danToc),
                    createLabelValue('5. Nghề nghiệp: ', data.ngheNghiep),
                    ...createLabelValueIf('Tôn giáo: ', data.tonGiao),
                    createLabelValue('6. Địa chỉ: ', data.diaChi),
                    ...createLabelValueIf('Bệnh viện: ', data.benhVien),
                    ...createLabelValueIf('Khoa/Phòng/Giường: ', data.khoaPhongGiuong),
                    ...createLabelValueIf('Liên hệ người thân (tên): ', data.lienHeNguoiThanTen),
                    ...createLabelValueIf('Liên hệ người thân (SĐT): ', data.lienHeNguoiThanSdt),
                    createLabelValue('7. Ngày giờ vào viện: ', formatDateTime(data.ngayVaoVien)),
                    ...createLabelValueIf('Ngày giờ làm bệnh án: ', formatDateTime(data.ngayLamBenhAn), { spacing: { after: 120 } }),

                    // =================================================================
                    // PHẦN B: HỎI BỆNH (YHCT)
                    // =================================================================
                    createHeading('B. ', 'HỎI BỆNH', { spacing: { before: 180, after: 100 } }),
                    ...createLabelValueMultiline('1. Chủ chứng: ', data.lyDo),
                    createHeading('2. ', 'Bệnh sử:', { spacing: { before: 60, after: 0 } }),
                    ...splitLinesToParas(data.benhSu),
                    createHeading('3. ', 'Tiền sử:', { spacing: { before: 60, after: 0 } }),
                    ...splitLinesToParas(data.tienSu),

                    // =================================================================
                    // PHẦN C: Y HỌC CỔ TRUYỀN
                    // =================================================================
                    createHeading('C. ', 'Y HỌC CỔ TRUYỀN', { spacing: { before: 180, after: 100 } }),
                    createHeading('I. ', 'Tứ chẩn', { spacing: { before: 120, after: 60 } }),
                    createHeading('1. ', 'Vọng:', { spacing: { after: 0 } }),
                    ...splitLinesToParas(data.yhctVong),
                    createHeading('2. ', 'Văn:', { spacing: { before: 40, after: 0 } }),
                    ...splitLinesToParas(data.yhctVan),
                    createHeading('3. ', 'Vấn:', { spacing: { before: 40, after: 0 } }),
                    ...splitLinesToParas(data.yhctVanHoi),
                    createHeading('4. ', 'Thiết:', { spacing: { before: 40, after: 0 } }),
                    ...splitLinesToParas(data.yhctThiet),

                    ...(hasText(data.yhctBatCuong)
                        ? [
                            createHeading('II. ', 'Biện luận', { spacing: { before: 120, after: 20 } }),
                            createHeading('', 'Bát cương:', { spacing: { before: 20, after: 0 } }),
                            ...splitLinesToParas(data.yhctBatCuong),
                        ]
                        : []
                    ),
                    ...(hasText(data.yhctTangPhu)
                        ? [
                            createHeading('', 'Tạng phủ (tuỳ chọn):', { spacing: { before: 40, after: 0 } }),
                            ...splitLinesToParas(data.yhctTangPhu),
                        ]
                        : []
                    ),
                    ...(hasText(data.yhctChanDoan)
                        ? [
                            createHeading('III. ', 'Chẩn đoán YHCT:', { spacing: { before: 60, after: 0 } }),
                            ...splitLinesToParas(data.yhctChanDoan),
                        ]
                        : []
                    ),
                    ...(hasText(data.yhctPhapTri)
                        ? [
                            createHeading('IV. ', 'Pháp trị:', { spacing: { before: 40, after: 0 } }),
                            ...splitLinesToParas(data.yhctPhapTri),
                        ]
                        : []
                    ),
                    ...(hasText(data.yhctPhuongThang)
                        ? [
                            createHeading('V. ', 'Phương thang/không dùng thuốc:', { spacing: { before: 40, after: 0 } }),
                            ...splitLinesToParas(data.yhctPhuongThang),
                        ]
                        : []
                    ),

                    ...(hasText(data.bienLuan)
                        ? [
                            createHeading('', 'Ghi chú/biện luận thêm:', { spacing: { before: 60, after: 0 } }),
                            ...splitLinesToParas(data.bienLuan),
                        ]
                        : []
                    ),

                    ...(shouldPrintTuVan
                        ? [
                            createHeading('D. ', 'TƯ VẤN', { spacing: { before: 180, after: 100 } }),
                            ...tuVanParas,
                        ]
                        : []
                    ),
                ],
            }],
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `BenhAn_YHCT_${normalizeFileName(data.hoTen)}.docx`);
    } catch (err) {
        console.error(err);
        alert('Lỗi tạo file DOCX: ' + err.message);
    }
};
