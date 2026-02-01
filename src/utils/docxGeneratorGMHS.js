import { Packer, Document } from 'docx';
import {
    createPara,
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
    formatDate,
    hasText,
    buildClsDeNghiParas,
    buildTuVanParas,
    normalizeFileName,
    downloadBlob
} from './docxBase';

export const generateGMHSDocx = async (data) => {
    try {
        const dateNow = formatDateTime(data?.ngayLamBenhAn || new Date());

        const tuVanParas = buildTuVanParas(data);
        const shouldPrintTuVan = tuVanParas.length > 0;

        const doc = new Document({
            styles: getDefaultDocStyles(),
            sections: [{
                properties: getDefaultSectionProps(),
                children: [
                    createTitle('PHIẾU KHÁM TIỀN MÊ (GMHS)'),
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

                    createHeading('B. ', 'THÔNG TIN PHẪU THUẬT/THỦ THUẬT', { spacing: { before: 180, after: 100 } }),
                    ...createLabelValueIf('Chẩn đoán phẫu thuật: ', data.chanDoanPhauThuat),
                    ...createLabelValueIf('Phẫu thuật/thủ thuật dự kiến: ', data.phauThuatDuKien),
                    ...createLabelValueIf('Ngày mổ dự kiến: ', formatDate(data.ngayMoDuKien)),
                    ...createLabelValueIf('Phương pháp vô cảm dự kiến: ', data.phuongPhapVoCamDuKien, { spacing: { after: 120 } }),

                    createHeading('C. ', 'HỎI BỆNH', { spacing: { before: 160, after: 60 } }),
                    ...createLabelValueMultiline('1. Lý do/Chỉ định tiền mê: ', data.lyDo),
                    createHeading('2. ', 'Bệnh sử:', { spacing: { before: 60, after: 0 } }),
                    ...splitLinesToParas(data.benhSu),
                    createHeading('3. ', 'Tiền sử:', { spacing: { before: 60, after: 0 } }),
                    ...splitLinesToParas(data.tienSu),
                    ...(hasText(data.thuocDangDung)
                        ? [
                            createHeading('4. ', 'Thuốc đang dùng:', { spacing: { before: 60, after: 0 } }),
                            ...splitLinesToParas(data.thuocDangDung),
                        ]
                        : []
                    ),
                    ...(hasText(data.diUng)
                        ? [
                            createHeading('5. ', 'Dị ứng:', { spacing: { before: 40, after: 0 } }),
                            ...splitLinesToParas(data.diUng),
                        ]
                        : []
                    ),
                    ...(hasText(data.tienSuGayMe)
                        ? [
                            createHeading('6. ', 'Tiền sử vô cảm/gây mê:', { spacing: { before: 40, after: 0 } }),
                            ...splitLinesToParas(data.tienSuGayMe),
                        ]
                        : []
                    ),
                    ...(hasText(data.thoiQuen)
                        ? [
                            createHeading('7. ', 'Thói quen/Yếu tố nguy cơ:', { spacing: { before: 40, after: 0 } }),
                            ...splitLinesToParas(data.thoiQuen),
                        ]
                        : []
                    ),

                    createHeading('D. ', 'KHÁM TIỀN MÊ', { spacing: { before: 160, after: 60 } }),
                    ...(hasText(data.khamLucVaoVien)
                        ? [
                            createHeading('', 'Khám lúc vào viện:', { spacing: { before: 0, after: 0 } }),
                            ...splitLinesToParas(data.khamLucVaoVien),
                        ]
                        : []
                    ),
                    createHeading('1. ', 'Toàn trạng:', { spacing: { after: 0 } }),
                    createPara(`- Sinh hiệu: Mạch ${data.mach || ''} lần/phút, nhiệt độ: ${data.nhietDo || ''}°C, HA ${data.haTren || ''}/${data.haDuoi || ''} mmHg, nhịp thở: ${data.nhipTho || ''} lần/phút`),
                    createPara(`- Chiều cao: ${data.chieuCao || ''} cm, cân nặng: ${data.canNang || ''} kg, BMI = ${data.bmi || ''} kg/m² => Phân loại ${data.phanLoaiBMI || '-'}`),
                    ...splitLinesToParas(data.toanThan),
                    ...(hasText(data.timmach)
                        ? [
                            createHeading('2. ', 'Tim mạch:', { spacing: { before: 60, after: 0 } }),
                            ...splitLinesToParas(data.timmach),
                        ]
                        : []
                    ),
                    ...(hasText(data.hohap)
                        ? [
                            createHeading('3. ', 'Hô hấp:', { spacing: { before: 40, after: 0 } }),
                            ...splitLinesToParas(data.hohap),
                        ]
                        : []
                    ),

                    createHeading('E. ', 'ĐÁNH GIÁ ĐƯỜNG THỞ & NGUY CƠ', { spacing: { before: 160, after: 60 } }),
                    ...createLabelValueIf('ASA: ', data.asa),
                    ...createLabelValueIf('Mallampati: ', data.airwayMallampati),
                    ...createLabelValueIf('Há miệng (cm): ', data.airwayHaMiengCm),
                    ...createLabelValueIf('Cổ (vận động/cứng cổ): ', data.airwayCo),
                    ...createLabelValueIf('Răng giả/răng lung lay: ', data.airwayRangGia),
                    ...createLabelValueIf('Dự kiến khó đặt NKQ: ', data.airwayDuKienKho),
                    ...(hasText(data.nguyCoPhauthuat)
                        ? [
                            createHeading('', 'Nguy cơ phẫu thuật:', { spacing: { before: 40, after: 0 } }),
                            ...splitLinesToParas(data.nguyCoPhauthuat),
                        ]
                        : []
                    ),
                    ...(hasText(data.nguyCoVoCam)
                        ? [
                            createHeading('', 'Nguy cơ vô cảm:', { spacing: { before: 40, after: 0 } }),
                            ...splitLinesToParas(data.nguyCoVoCam),
                        ]
                        : []
                    ),

                    createHeading('F. ', 'KẾ HOẠCH VÔ CẢM', { spacing: { before: 160, after: 60 } }),
                    ...(hasText(data.keHoachVoCam)
                        ? [
                            createHeading('1. ', 'Phương pháp vô cảm:', { spacing: { after: 0 } }),
                            ...splitLinesToParas(data.keHoachVoCam),
                        ]
                        : []
                    ),
                    ...(hasText(data.keHoachGiamDau)
                        ? [
                            createHeading('2. ', 'Kế hoạch giảm đau:', { spacing: { before: 40, after: 0 } }),
                            ...splitLinesToParas(data.keHoachGiamDau),
                        ]
                        : []
                    ),
                    ...(hasText(data.duPhongPONV)
                        ? [
                            createHeading('3. ', 'Dự phòng PONV:', { spacing: { before: 40, after: 0 } }),
                            ...splitLinesToParas(data.duPhongPONV),
                        ]
                        : []
                    ),
                    ...(hasText(data.keHoachHoiSuc)
                        ? [
                            createHeading('4. ', 'Hồi sức sau mổ:', { spacing: { before: 40, after: 0 } }),
                            ...splitLinesToParas(data.keHoachHoiSuc),
                        ]
                        : []
                    ),

                    createHeading('G. ', 'CẬN LÂM SÀNG', { spacing: { before: 160, after: 60 } }),
                    createHeading('1. ', 'Đề nghị cận lâm sàng:', { spacing: { after: 0 } }),
                    ...buildClsDeNghiParas(data),
                    ...(hasText(data.ketQua)
                        ? [
                            createHeading('2. ', 'Kết quả:', { spacing: { before: 40, after: 0 } }),
                            ...splitLinesToParas(data.ketQua),
                        ]
                        : []
                    ),

                    createHeading('H. ', 'KẾT LUẬN', { spacing: { before: 160, after: 60 } }),
                    ...(hasText(data.tomTat)
                        ? [
                            createHeading('1. ', 'Tóm tắt:', { spacing: { after: 0 } }),
                            ...splitLinesToParas(data.tomTat),
                        ]
                        : []
                    ),
                    ...(hasText(data.ketLuanGMHS)
                        ? [
                            createHeading('2. ', 'Kết luận/đề xuất:', { spacing: { before: 40, after: 0 } }),
                            ...splitLinesToParas(data.ketLuanGMHS),
                        ]
                        : []
                    ),

                    ...(shouldPrintTuVan
                        ? [
                            createHeading('I. ', 'TƯ VẤN', { spacing: { before: 180, after: 100 } }),
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
        downloadBlob(blob, `PhieuKhamTienMe_GMHS_${normalizeFileName(data.hoTen)}.docx`);
    } catch (err) {
        console.error(err);
        alert('Lỗi tạo file DOCX: ' + err.message);
    }
};
