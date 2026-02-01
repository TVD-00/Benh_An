import { Packer, Document } from 'docx';
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
    normalizeFileName,
    downloadBlob
} from './docxBase';

export const generateRangHamMatDocx = async (data) => {
    try {
        const dateNow = formatDateTime(data?.ngayLamBenhAn || new Date());

        const tuVanParas = buildTuVanParas(data);
        const shouldPrintTuVan = tuVanParas.length > 0;

        const doc = new Document({
            styles: getDefaultDocStyles(),
            sections: [{
                properties: getDefaultSectionProps(),
                children: [
                    createTitle('BỆNH ÁN RĂNG HÀM MẶT'),
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
                    createLabelValue('7. Ngày giờ vào viện: ', formatDateTime(data.ngayVaoVien), { spacing: { after: 0 } }),
                    ...createLabelValueIf('Ngày giờ làm bệnh án: ', formatDateTime(data.ngayLamBenhAn), { spacing: { after: 120 } }),

                    createHeading('B. ', 'HỎI BỆNH', { spacing: { before: 180, after: 100 } }),
                    ...createLabelValueMultiline('1. Chủ chứng: ', data.lyDo),
                    createHeading('2. ', 'Bệnh sử:', { spacing: { before: 60, after: 0 } }),
                    ...splitLinesToParas(data.benhSu),
                    createHeading('3. ', 'Tiền sử:', { spacing: { before: 60, after: 0 } }),
                    ...splitLinesToParas(data.tienSu),
                    ...(hasText(data.diUng)
                        ? [
                            createHeading('4. ', 'Dị ứng:', { spacing: { before: 40, after: 0 } }),
                            ...splitLinesToParas(data.diUng),
                        ]
                        : []
                    ),
                    ...(hasText(data.thuocDangDung)
                        ? [
                            createHeading('5. ', 'Thuốc đang dùng:', { spacing: { before: 40, after: 0 } }),
                            ...splitLinesToParas(data.thuocDangDung),
                        ]
                        : []
                    ),

                    createHeading('C. ', 'KHÁM RĂNG HÀM MẶT', { spacing: { before: 160, after: 60 } }),
                    ...(hasText(data.khamNgoaiMat)
                        ? [
                            createHeading('1. ', 'Ngoài mặt:', { spacing: { after: 0 } }),
                            ...splitLinesToParas(data.khamNgoaiMat),
                        ]
                        : []
                    ),
                    ...(hasText(data.khamTrongMieng)
                        ? [
                            createHeading('2. ', 'Trong miệng:', { spacing: { before: 40, after: 0 } }),
                            ...splitLinesToParas(data.khamTrongMieng),
                        ]
                        : []
                    ),
                    ...(hasText(data.khamRang)
                        ? [
                            createHeading('3. ', 'Răng:', { spacing: { before: 40, after: 0 } }),
                            ...splitLinesToParas(data.khamRang),
                        ]
                        : []
                    ),
                    ...(hasText(data.khamNhaChu)
                        ? [
                            createHeading('4. ', 'Nha chu:', { spacing: { before: 40, after: 0 } }),
                            ...splitLinesToParas(data.khamNhaChu),
                        ]
                        : []
                    ),
                    ...(hasText(data.khopCanTmj)
                        ? [
                            createHeading('5. ', 'Khớp cắn/TMJ:', { spacing: { before: 40, after: 0 } }),
                            ...splitLinesToParas(data.khopCanTmj),
                        ]
                        : []
                    ),

                    ...(hasText(data.canLamSang)
                        ? [
                            createHeading('D. ', 'CẬN LÂM SÀNG', { spacing: { before: 160, after: 60 } }),
                            createHeading('1. ', 'Chỉ định:', { spacing: { after: 0 } }),
                            ...splitLinesToParas(data.canLamSang),
                        ]
                        : []
                    ),
                    ...(hasText(data.ketQuaCLS)
                        ? [
                            createHeading('2. ', 'Kết quả:', { spacing: { before: 40, after: 0 } }),
                            ...splitLinesToParas(data.ketQuaCLS),
                        ]
                        : []
                    ),

                    createHeading('E. ', 'KẾT LUẬN & XỬ TRÍ', { spacing: { before: 160, after: 60 } }),
                    ...(hasText(data.tomTat)
                        ? [
                            createHeading('1. ', 'Tóm tắt:', { spacing: { after: 0 } }),
                            ...splitLinesToParas(data.tomTat),
                        ]
                        : []
                    ),
                    ...(hasText(data.chanDoan)
                        ? [
                            createHeading('2. ', 'Chẩn đoán:', { spacing: { before: 40, after: 0 } }),
                            ...splitLinesToParas(data.chanDoan),
                        ]
                        : []
                    ),
                    ...(hasText(data.chanDoanPhanBiet)
                        ? [
                            createHeading('3. ', 'Chẩn đoán phân biệt:', { spacing: { before: 40, after: 0 } }),
                            ...splitLinesToParas(data.chanDoanPhanBiet),
                        ]
                        : []
                    ),
                    ...(hasText(data.huongDieuTri)
                        ? [
                            createHeading('4. ', 'Hướng điều trị:', { spacing: { before: 40, after: 0 } }),
                            ...splitLinesToParas(data.huongDieuTri),
                        ]
                        : []
                    ),
                    ...(hasText(data.dieuTri)
                        ? [
                            createHeading('5. ', 'Điều trị/Thủ thuật:', { spacing: { before: 40, after: 0 } }),
                            ...splitLinesToParas(data.dieuTri),
                        ]
                        : []
                    ),
                    ...(hasText(data.donThuoc)
                        ? [
                            createHeading('6. ', 'Đơn thuốc:', { spacing: { before: 40, after: 0 } }),
                            ...splitLinesToParas(data.donThuoc),
                        ]
                        : []
                    ),
                    ...(hasText(data.henTaiKham)
                        ? [
                            createHeading('7. ', 'Hẹn tái khám:', { spacing: { before: 40, after: 0 } }),
                            ...splitLinesToParas(data.henTaiKham),
                        ]
                        : []
                    ),
                    ...(hasText(data.tienLuong)
                        ? [
                            createHeading('8. ', 'Tiên lượng:', { spacing: { before: 40, after: 0 } }),
                            ...splitLinesToParas(data.tienLuong),
                        ]
                        : []
                    ),

                    ...(shouldPrintTuVan
                        ? [
                            createHeading('F. ', 'TƯ VẤN', { spacing: { before: 180, after: 100 } }),
                            ...tuVanParas,
                        ]
                        : []
                    ),

                    ...(hasText(data.bienLuan)
                        ? [
                            createHeading('', 'Ghi chú/biện luận thêm:', { spacing: { before: 120, after: 0 } }),
                            ...splitLinesToParas(data.bienLuan),
                        ]
                        : []
                    ),
                ],
            }],
        });

        const blob = await Packer.toBlob(doc);
        downloadBlob(blob, `BenhAn_RangHamMat_${normalizeFileName(data.hoTen)}.docx`);
    } catch (err) {
        console.error(err);
        alert('Lỗi tạo file DOCX: ' + err.message);
    }
};
