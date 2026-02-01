import React, { useRef, useCallback } from 'react';

// Component hiển thị preview bệnh án trước khi xuất
const PreviewModal = ({ isOpen, onClose, data, formType, onExport }) => {
    const printRef = useRef(null);

    // Đóng modal khi click overlay
    const handleOverlayClick = useCallback((e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    }, [onClose]);

    // In trực tiếp
    const handlePrint = useCallback(() => {
        const content = printRef.current;
        if (!content) return;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Bệnh Án - ${data?.hoTen || 'Preview'}</title>
                <style>
                    body {
                        font-family: 'Times New Roman', Times, serif;
                        font-size: 14pt;
                        line-height: 1.5;
                        margin: 2cm;
                        color: #000;
                    }
                    h1 { text-align: center; font-size: 20pt; margin-bottom: 1em; }
                    h2 { font-size: 14pt; margin: 1em 0 0.5em; }
                    h3 { font-size: 14pt; margin: 0.5em 0 0.25em; }
                    .date { font-style: italic; margin-bottom: 1em; }
                    .section { margin-bottom: 1em; }
                    .label { font-weight: bold; }
                    .vital-signs { margin: 0.5em 0; }
                    pre { white-space: pre-wrap; font-family: inherit; margin: 0; }
                    @media print {
                        body { margin: 0; }
                    }
                </style>
            </head>
            <body>${content.innerHTML}</body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }, [data]);

    if (!isOpen) return null;

    // Render nội dung preview dựa trên formType
    const renderContent = () => {
        if (!data) return <p>Không có dữ liệu</p>;

        // Format huyết áp từ haTren/haDuoi
        const huyetAp = data.haTren && data.haDuoi
            ? `${data.haTren}/${data.haDuoi}`
            : (data.huyetAp || '');

        // Render riêng cho GMHS
        if (formType === 'gmhs') {
            const ngayMoDuKien = (() => {
                if (!data.ngayMoDuKien) return '';
                const d = new Date(data.ngayMoDuKien);
                if (isNaN(d.getTime())) return data.ngayMoDuKien;
                return d.toLocaleDateString('vi-VN');
            })();

            return (
                <div ref={printRef} className="preview-content">
                    <h1>{getFormTitle(formType)}</h1>
                    <p className="date">Ngày làm bệnh án: {formatDateTime(data.ngayLamBenhAn) || new Date().toLocaleString('vi-VN')}</p>

                    <div className="section">
                        <h2>A. PHẦN HÀNH CHÁNH</h2>
                        <p><span className="label">Họ và tên:</span> {data.hoTen}</p>
                        <p><span className="label">Giới tính:</span> {data.gioiTinh}</p>
                        <p><span className="label">Năm sinh:</span> {data.namSinh} ({data.tuoi} tuổi)</p>
                        <p><span className="label">Dân tộc:</span> {data.danToc}</p>
                        <p><span className="label">Nghề nghiệp:</span> {data.ngheNghiep}</p>
                        {data.tonGiao && <p><span className="label">Tôn giáo:</span> {data.tonGiao}</p>}
                        <p><span className="label">Địa chỉ:</span> {data.diaChi}</p>
                        {data.benhVien && <p><span className="label">Bệnh viện:</span> {data.benhVien}</p>}
                        {data.khoaPhongGiuong && <p><span className="label">Khoa/Phòng/Giường:</span> {data.khoaPhongGiuong}</p>}
                        {(data.lienHeNguoiThanTen || data.lienHeNguoiThanSdt) && (
                            <p><span className="label">Liên hệ người thân:</span> {data.lienHeNguoiThanTen} {data.lienHeNguoiThanSdt ? `(${data.lienHeNguoiThanSdt})` : ''}</p>
                        )}
                        <p><span className="label">Ngày giờ vào viện:</span> {formatDateTime(data.ngayVaoVien)}</p>
                        {data.ngayLamBenhAn && <p><span className="label">Ngày giờ làm bệnh án:</span> {formatDateTime(data.ngayLamBenhAn)}</p>}
                    </div>

                    <div className="section">
                        <h2>B. THÔNG TIN PHẪU THUẬT/THỦ THUẬT</h2>
                        {data.chanDoanPhauThuat && <p><span className="label">Chẩn đoán phẫu thuật:</span> {data.chanDoanPhauThuat}</p>}
                        {data.phauThuatDuKien && <p><span className="label">Phẫu thuật/thủ thuật dự kiến:</span> {data.phauThuatDuKien}</p>}
                        {ngayMoDuKien && <p><span className="label">Ngày mổ dự kiến:</span> {ngayMoDuKien}</p>}
                        {data.phuongPhapVoCamDuKien && <p><span className="label">Vô cảm dự kiến:</span> {data.phuongPhapVoCamDuKien}</p>}
                    </div>

                    <div className="section">
                        <h2>C. HỎI BỆNH</h2>
                        <p><span className="label">1. Lý do/Chỉ định tiền mê:</span></p>
                        <pre>{data.lyDo}</pre>
                        <p><span className="label">2. Bệnh sử:</span></p>
                        <pre>{data.benhSu}</pre>
                        <p><span className="label">3. Tiền sử:</span></p>
                        <pre>{data.tienSu}</pre>
                        {data.thuocDangDung && <><p><span className="label">4. Thuốc đang dùng:</span></p><pre>{data.thuocDangDung}</pre></>}
                        {data.diUng && <><p><span className="label">5. Dị ứng:</span></p><pre>{data.diUng}</pre></>}
                        {data.tienSuGayMe && <><p><span className="label">6. Tiền sử vô cảm/gây mê:</span></p><pre>{data.tienSuGayMe}</pre></>}
                        {data.thoiQuen && <><p><span className="label">7. Thói quen/Yếu tố nguy cơ:</span></p><pre>{data.thoiQuen}</pre></>}
                    </div>

                    <div className="section">
                        <h2>D. KHÁM TIỀN MÊ</h2>
                        {data.khamLucVaoVien && <><p><span className="label">Khám lúc vào viện:</span></p><pre>{data.khamLucVaoVien}</pre></>}
                        <div className="vital-signs">
                            <p>- Sinh hiệu: Mạch {data.mach} lần/phút, nhiệt độ: {data.nhietDo}°C, HA {huyetAp} mmHg, nhịp thở: {data.nhipTho} lần/phút</p>
                            <p>- Chiều cao: {data.chieuCao} cm, cân nặng: {data.canNang} kg, BMI = {data.bmi} kg/m² =&gt; Phân loại {data.phanLoaiBMI || '-'}</p>
                        </div>
                        {data.toanThan && <pre>{data.toanThan}</pre>}
                        {data.timmach && <><p><b>Tim mạch:</b></p><pre>{data.timmach}</pre></>}
                        {data.hohap && <><p><b>Hô hấp:</b></p><pre>{data.hohap}</pre></>}
                    </div>

                    <div className="section">
                        <h2>E. ĐƯỜNG THỞ & NGUY CƠ</h2>
                        {data.asa && <p><span className="label">ASA:</span> {data.asa}</p>}
                        {data.airwayMallampati && <p><span className="label">Mallampati:</span> {data.airwayMallampati}</p>}
                        {data.airwayHaMiengCm && <p><span className="label">Há miệng (cm):</span> {data.airwayHaMiengCm}</p>}
                        {data.airwayCo && <p><span className="label">Cổ:</span> {data.airwayCo}</p>}
                        {data.airwayRangGia && <p><span className="label">Răng giả/răng lung lay:</span> {data.airwayRangGia}</p>}
                        {data.airwayDuKienKho && <p><span className="label">Dự kiến khó đặt NKQ:</span> {data.airwayDuKienKho}</p>}
                        {data.nguyCoPhauthuat && <><p><span className="label">Nguy cơ phẫu thuật:</span></p><pre>{data.nguyCoPhauthuat}</pre></>}
                        {data.nguyCoVoCam && <><p><span className="label">Nguy cơ vô cảm:</span></p><pre>{data.nguyCoVoCam}</pre></>}
                    </div>

                    <div className="section">
                        <h2>F. KẾ HOẠCH VÔ CẢM</h2>
                        {data.keHoachVoCam && <><p><span className="label">1. Phương pháp vô cảm:</span></p><pre>{data.keHoachVoCam}</pre></>}
                        {data.keHoachGiamDau && <><p><span className="label">2. Kế hoạch giảm đau:</span></p><pre>{data.keHoachGiamDau}</pre></>}
                        {data.duPhongPONV && <><p><span className="label">3. Dự phòng PONV:</span></p><pre>{data.duPhongPONV}</pre></>}
                        {data.keHoachHoiSuc && <><p><span className="label">4. Hồi sức sau mổ:</span></p><pre>{data.keHoachHoiSuc}</pre></>}
                    </div>

                    <div className="section">
                        <h2>G. CẬN LÂM SÀNG</h2>
                        <p><span className="label">1. Đề nghị cận lâm sàng:</span></p>
                        {(() => {
                            const groups = [
                                { title: 'Chẩn đoán', presets: data.clsChanDoanPresets, note: data.clsChuanDoan },
                                { title: 'Tìm nguyên nhân', presets: data.clsTimNguyenNhanPresets, note: data.clsThuongQuy },
                                { title: 'Hỗ trợ điều trị', presets: data.clsHoTroDieuTriPresets, note: data.clsHoTroDieuTri },
                                { title: 'Theo dõi/tiên lượng', presets: data.clsTheoDoiTienLuongPresets, note: data.clsTheoDoiTienLuong },
                            ];
                            const visible = groups.filter(g => {
                                const hasPreset = Array.isArray(g.presets) && g.presets.length > 0;
                                const hasNote = g.note && String(g.note).trim();
                                return hasPreset || hasNote;
                            });
                            if (visible.length === 0) return <p>-</p>;
                            return visible.map(g => (
                                <div key={g.title} style={{ margin: '0.25em 0 0.75em' }}>
                                    <p><b>{g.title}:</b></p>
                                    {Array.isArray(g.presets) && g.presets.length > 0 && (
                                        <pre>{g.presets.map(p => `- ${p}`).join('\n')}</pre>
                                    )}
                                    {g.note && String(g.note).trim() && (
                                        <pre>{g.note}</pre>
                                    )}
                                </div>
                            ));
                        })()}

                        {data.ketQua && (
                            <>
                                <p><span className="label">2. Kết quả:</span></p>
                                <pre>{data.ketQua}</pre>
                            </>
                        )}
                    </div>

                    <div className="section">
                        <h2>H. KẾT LUẬN</h2>
                        {data.tomTat && <><p><span className="label">1. Tóm tắt:</span></p><pre>{data.tomTat}</pre></>}
                        {data.ketLuanGMHS && <><p><span className="label">2. Kết luận/đề xuất:</span></p><pre>{data.ketLuanGMHS}</pre></>}
                    </div>

                    {data.tuVanInDocx !== false && (
                        (Array.isArray(data.tuVanPresets) && data.tuVanPresets.length > 0) || (data.tuVan && String(data.tuVan).trim())
                    ) && (
                        <div className="section">
                            <h2>I. Tư vấn</h2>
                            {Array.isArray(data.tuVanPresets) && data.tuVanPresets.length > 0 && (
                                <pre>{data.tuVanPresets.map(p => `- ${p}`).join('\n')}</pre>
                            )}
                            {data.tuVan && String(data.tuVan).trim() && (
                                <pre>{data.tuVan}</pre>
                            )}
                        </div>
                    )}

                    {data.bienLuan && (
                        <div className="section">
                            <h2>Ghi chú/biện luận thêm</h2>
                            <pre>{data.bienLuan}</pre>
                        </div>
                    )}
                </div>
            );
        }

        // Render riêng cho Răng Hàm Mặt
        if (formType === 'ranghammat') {
            return (
                <div ref={printRef} className="preview-content">
                    <h1>{getFormTitle(formType)}</h1>
                    <p className="date">Ngày làm bệnh án: {formatDateTime(data.ngayLamBenhAn) || new Date().toLocaleString('vi-VN')}</p>

                    <div className="section">
                        <h2>A. PHẦN HÀNH CHÁNH</h2>
                        <p><span className="label">Họ và tên:</span> {data.hoTen}</p>
                        <p><span className="label">Giới tính:</span> {data.gioiTinh}</p>
                        <p><span className="label">Năm sinh:</span> {data.namSinh} ({data.tuoi} tuổi)</p>
                        <p><span className="label">Dân tộc:</span> {data.danToc}</p>
                        <p><span className="label">Nghề nghiệp:</span> {data.ngheNghiep}</p>
                        {data.tonGiao && <p><span className="label">Tôn giáo:</span> {data.tonGiao}</p>}
                        <p><span className="label">Địa chỉ:</span> {data.diaChi}</p>
                        {data.benhVien && <p><span className="label">Bệnh viện:</span> {data.benhVien}</p>}
                        {data.khoaPhongGiuong && <p><span className="label">Khoa/Phòng/Giường:</span> {data.khoaPhongGiuong}</p>}
                        {(data.lienHeNguoiThanTen || data.lienHeNguoiThanSdt) && (
                            <p><span className="label">Liên hệ người thân:</span> {data.lienHeNguoiThanTen} {data.lienHeNguoiThanSdt ? `(${data.lienHeNguoiThanSdt})` : ''}</p>
                        )}
                        <p><span className="label">Ngày giờ vào viện:</span> {formatDateTime(data.ngayVaoVien)}</p>
                        {data.ngayLamBenhAn && <p><span className="label">Ngày giờ làm bệnh án:</span> {formatDateTime(data.ngayLamBenhAn)}</p>}
                    </div>

                    <div className="section">
                        <h2>B. HỎI BỆNH</h2>
                        <p><span className="label">1. Chủ chứng:</span></p>
                        <pre>{data.lyDo}</pre>
                        <p><span className="label">2. Bệnh sử:</span></p>
                        <pre>{data.benhSu}</pre>
                        <p><span className="label">3. Tiền sử:</span></p>
                        <pre>{data.tienSu}</pre>
                        {data.diUng && <><p><span className="label">4. Dị ứng:</span></p><pre>{data.diUng}</pre></>}
                        {data.thuocDangDung && <><p><span className="label">5. Thuốc đang dùng:</span></p><pre>{data.thuocDangDung}</pre></>}
                    </div>

                    <div className="section">
                        <h2>C. KHÁM RĂNG HÀM MẶT</h2>
                        {data.khamNgoaiMat && <><p><span className="label">1. Ngoài mặt:</span></p><pre>{data.khamNgoaiMat}</pre></>}
                        {data.khamTrongMieng && <><p><span className="label">2. Trong miệng:</span></p><pre>{data.khamTrongMieng}</pre></>}
                        {data.khamRang && <><p><span className="label">3. Răng:</span></p><pre>{data.khamRang}</pre></>}
                        {data.khamNhaChu && <><p><span className="label">4. Nha chu:</span></p><pre>{data.khamNhaChu}</pre></>}
                        {data.khopCanTmj && <><p><span className="label">5. Khớp cắn/TMJ:</span></p><pre>{data.khopCanTmj}</pre></>}
                    </div>

                    {(data.canLamSang || data.ketQuaCLS) && (
                        <div className="section">
                            <h2>D. CẬN LÂM SÀNG</h2>
                            {data.canLamSang && <><p><span className="label">1. Chỉ định:</span></p><pre>{data.canLamSang}</pre></>}
                            {data.ketQuaCLS && <><p><span className="label">2. Kết quả:</span></p><pre>{data.ketQuaCLS}</pre></>}
                        </div>
                    )}

                    <div className="section">
                        <h2>E. KẾT LUẬN & XỬ TRÍ</h2>
                        {data.tomTat && <><p><span className="label">1. Tóm tắt:</span></p><pre>{data.tomTat}</pre></>}
                        {data.chanDoan && <><p><span className="label">2. Chẩn đoán:</span></p><pre>{data.chanDoan}</pre></>}
                        {data.chanDoanPhanBiet && <><p><span className="label">3. Chẩn đoán phân biệt:</span></p><pre>{data.chanDoanPhanBiet}</pre></>}
                        {data.huongDieuTri && <><p><span className="label">4. Hướng điều trị:</span></p><pre>{data.huongDieuTri}</pre></>}
                        {data.dieuTri && <><p><span className="label">5. Điều trị/Thủ thuật:</span></p><pre>{data.dieuTri}</pre></>}
                        {data.donThuoc && <><p><span className="label">6. Đơn thuốc:</span></p><pre>{data.donThuoc}</pre></>}
                        {data.henTaiKham && <><p><span className="label">7. Hẹn tái khám:</span></p><pre>{data.henTaiKham}</pre></>}
                        {data.tienLuong && <><p><span className="label">8. Tiên lượng:</span></p><pre>{data.tienLuong}</pre></>}
                    </div>

                    {data.tuVanInDocx !== false && (
                        (Array.isArray(data.tuVanPresets) && data.tuVanPresets.length > 0) || (data.tuVan && String(data.tuVan).trim())
                    ) && (
                        <div className="section">
                            <h2>F. Tư vấn</h2>
                            {Array.isArray(data.tuVanPresets) && data.tuVanPresets.length > 0 && (
                                <pre>{data.tuVanPresets.map(p => `- ${p}`).join('\n')}</pre>
                            )}
                            {data.tuVan && String(data.tuVan).trim() && (
                                <pre>{data.tuVan}</pre>
                            )}
                        </div>
                    )}

                    {data.bienLuan && (
                        <div className="section">
                            <h2>Ghi chú/biện luận thêm</h2>
                            <pre>{data.bienLuan}</pre>
                        </div>
                    )}
                </div>
            );
        }

        // Render riêng cho YHCT
        if (formType === 'yhct') {
            return (
                <div ref={printRef} className="preview-content">
                    <h1>{getFormTitle(formType)}</h1>
                    <p className="date">Ngày làm bệnh án: {formatDateTime(data.ngayLamBenhAn) || new Date().toLocaleString('vi-VN')}</p>

                    <div className="section">
                        <h2>A. PHẦN HÀNH CHÁNH</h2>
                        <p><span className="label">Họ và tên:</span> {data.hoTen}</p>
                        <p><span className="label">Giới tính:</span> {data.gioiTinh}</p>
                        <p><span className="label">Năm sinh:</span> {data.namSinh} ({data.tuoi} tuổi)</p>
                        <p><span className="label">Dân tộc:</span> {data.danToc}</p>
                        <p><span className="label">Nghề nghiệp:</span> {data.ngheNghiep}</p>
                        {data.tonGiao && <p><span className="label">Tôn giáo:</span> {data.tonGiao}</p>}
                        <p><span className="label">Địa chỉ:</span> {data.diaChi}</p>
                        {data.benhVien && <p><span className="label">Bệnh viện:</span> {data.benhVien}</p>}
                        {data.khoaPhongGiuong && <p><span className="label">Khoa/Phòng/Giường:</span> {data.khoaPhongGiuong}</p>}
                        {(data.lienHeNguoiThanTen || data.lienHeNguoiThanSdt) && (
                            <p><span className="label">Liên hệ người thân:</span> {data.lienHeNguoiThanTen} {data.lienHeNguoiThanSdt ? `(${data.lienHeNguoiThanSdt})` : ''}</p>
                        )}
                        <p><span className="label">Ngày giờ vào viện:</span> {formatDateTime(data.ngayVaoVien)}</p>
                        {data.ngayLamBenhAn && <p><span className="label">Ngày giờ làm bệnh án:</span> {formatDateTime(data.ngayLamBenhAn)}</p>}
                    </div>

                    <div className="section">
                        <h2>B. HỎI BỆNH</h2>
                        <p><span className="label">1. Chủ chứng:</span></p>
                        <pre>{data.lyDo}</pre>
                        <p><span className="label">2. Bệnh sử:</span></p>
                        <pre>{data.benhSu}</pre>
                        <p><span className="label">3. Tiền sử:</span></p>
                        <pre>{data.tienSu}</pre>
                    </div>

                    <div className="section">
                        <h2>C. Y HỌC CỔ TRUYỀN</h2>
                        <h3>I. Tứ chẩn</h3>
                        {data.yhctVong && <><p><b>Vọng:</b></p><pre>{data.yhctVong}</pre></>}
                        {data.yhctVan && <><p><b>Văn:</b></p><pre>{data.yhctVan}</pre></>}
                        {data.yhctVanHoi && <><p><b>Vấn:</b></p><pre>{data.yhctVanHoi}</pre></>}
                        {data.yhctThiet && <><p><b>Thiết:</b></p><pre>{data.yhctThiet}</pre></>}

                        {(data.yhctBatCuong || data.yhctTangPhu) && <h3>II. Biện luận</h3>}
                        {data.yhctBatCuong && <><p><b>Bát cương:</b></p><pre>{data.yhctBatCuong}</pre></>}
                        {data.yhctTangPhu && <><p><b>Tạng phủ:</b></p><pre>{data.yhctTangPhu}</pre></>}

                        {data.yhctChanDoan && <><h3>III. Chẩn đoán YHCT</h3><pre>{data.yhctChanDoan}</pre></>}
                        {data.yhctPhapTri && <><p><b>Pháp trị:</b></p><pre>{data.yhctPhapTri}</pre></>}
                        {data.yhctPhuongThang && <><p><b>Phương thang/không dùng thuốc:</b></p><pre>{data.yhctPhuongThang}</pre></>}
                    </div>

                    {data.tuVanInDocx !== false && (
                        (Array.isArray(data.tuVanPresets) && data.tuVanPresets.length > 0) || (data.tuVan && String(data.tuVan).trim())
                    ) && (
                        <div className="section">
                            <h2>D. Tư vấn</h2>
                            {Array.isArray(data.tuVanPresets) && data.tuVanPresets.length > 0 && (
                                <pre>{data.tuVanPresets.map(p => `- ${p}`).join('\n')}</pre>
                            )}
                            {data.tuVan && String(data.tuVan).trim() && (
                                <pre>{data.tuVan}</pre>
                            )}
                        </div>
                    )}

                    {data.bienLuan && (
                        <div className="section">
                            <h2>Ghi chú/biện luận thêm</h2>
                            <pre>{data.bienLuan}</pre>
                        </div>
                    )}
                </div>
            );
        }

        // Render chung cho tất cả form types
        return (
            <div ref={printRef} className="preview-content">
                <h1>{getFormTitle(formType)}</h1>
                <p className="date">Ngày làm bệnh án: {formatDateTime(data.ngayLamBenhAn) || new Date().toLocaleString('vi-VN')}</p>

                {/* PHẦN HÀNH CHÍNH */}
                <div className="section">
                    <h2>A. PHẦN HÀNH CHÁNH</h2>
                    <p><span className="label">1. Họ và tên:</span> {data.hoTen}</p>
                    <p><span className="label">2. Giới tính:</span> {data.gioiTinh}</p>
                    <p><span className="label">3. Năm sinh:</span> {data.namSinh} ({data.tuoi} tuổi)</p>
                    <p><span className="label">4. Dân tộc:</span> {data.danToc}</p>
                    <p><span className="label">5. Nghề nghiệp:</span> {data.ngheNghiep}</p>
                    {data.tonGiao && <p><span className="label">Tôn giáo:</span> {data.tonGiao}</p>}
                    <p><span className="label">6. Địa chỉ:</span> {data.diaChi}</p>
                    {data.benhVien && <p><span className="label">Bệnh viện:</span> {data.benhVien}</p>}
                    {data.khoaPhongGiuong && <p><span className="label">Khoa/Phòng/Giường:</span> {data.khoaPhongGiuong}</p>}
                    {(data.lienHeNguoiThanTen || data.lienHeNguoiThanSdt) && (
                        <p><span className="label">Liên hệ người thân:</span> {data.lienHeNguoiThanTen} {data.lienHeNguoiThanSdt ? `(${data.lienHeNguoiThanSdt})` : ''}</p>
                    )}
                    <p><span className="label">7. Ngày giờ vào viện:</span> {formatDateTime(data.ngayVaoVien)}</p>
                    {data.ngayLamBenhAn && <p><span className="label">Ngày giờ làm bệnh án:</span> {formatDateTime(data.ngayLamBenhAn)}</p>}
                </div>

                {/* PHẦN BỆNH ÁN */}
                <div className="section">
                    <h2>B. PHẦN BỆNH ÁN</h2>

                    <h3>I. Hỏi bệnh</h3>
                    <p><span className="label">1. Lý do vào viện:</span></p>
                    <pre>{data.lyDo}</pre>

                    <p><span className="label">2. Bệnh sử:</span></p>
                    <pre>{data.benhSu}</pre>

                    <p><span className="label">3. Tiền sử:</span></p>
                    <pre>{data.tienSu}</pre>
                </div>

                {/* KHÁM BỆNH */}
                <div className="section">
                    <h3>II. Khám bệnh</h3>
                    {data.khamLucVaoVien && (
                        <>
                            <p><span className="label">Khám lúc vào viện:</span></p>
                            <pre>{data.khamLucVaoVien}</pre>
                        </>
                    )}
                    <p><span className="label">1. Toàn trạng:</span></p>
                    <div className="vital-signs">
                        <p>- Sinh hiệu: Mạch {data.mach} lần/phút, nhiệt độ: {data.nhietDo}°C, HA {huyetAp} mmHg, nhịp thở: {data.nhipTho} lần/phút</p>
                        <p>- Chiều cao: {data.chieuCao} cm, cân nặng: {data.canNang} kg, BMI = {data.bmi} kg/m² =&gt; Phân loại {data.phanLoaiBMI || '-'}</p>
                    </div>
                    <pre>{data.toanThan}</pre>

                    <p><span className="label">2. Khám cơ quan:</span></p>
                    {data.timmach && <><p><b>a) Tuần hoàn:</b></p><pre>{data.timmach}</pre></>}
                    {data.hohap && <><p><b>b) Hô hấp:</b></p><pre>{data.hohap}</pre></>}
                    {data.tieuhoa && <><p><b>c) Tiêu hoá:</b></p><pre>{data.tieuhoa}</pre></>}
                    {data.than && <><p><b>d) Thận - tiết niệu:</b></p><pre>{data.than}</pre></>}
                    {data.thankinh && <><p><b>e) Thần kinh:</b></p><pre>{data.thankinh}</pre></>}
                    {data.cokhop && <><p><b>f) Cơ - Xương - Khớp:</b></p><pre>{data.cokhop}</pre></>}
                    {data.coQuanKhac && <p><b>g) Các cơ quan khác:</b> {data.coQuanKhac}</p>}
                </div>

                {/* KẾT LUẬN */}
                <div className="section">
                    <h3>III. Kết luận</h3>
                    <p><span className="label">1. Tóm tắt bệnh án:</span></p>
                    <pre>{data.tomTat}</pre>

                    <p><span className="label">2. Chẩn đoán sơ bộ:</span> {data.chanDoan}</p>

                    {data.chanDoanPhanBiet && (
                        <>
                            <p><span className="label">3. Chẩn đoán phân biệt:</span></p>
                            <pre>{data.chanDoanPhanBiet}</pre>
                        </>
                    )}

                    <p><span className="label">4. Đề nghị cận lâm sàng:</span></p>
                    {(() => {
                        const groups = [
                            { title: 'Chẩn đoán', presets: data.clsChanDoanPresets, note: data.clsChuanDoan },
                            { title: 'Tìm nguyên nhân', presets: data.clsTimNguyenNhanPresets, note: data.clsThuongQuy },
                            { title: 'Hỗ trợ điều trị', presets: data.clsHoTroDieuTriPresets, note: data.clsHoTroDieuTri },
                            { title: 'Theo dõi/tiên lượng', presets: data.clsTheoDoiTienLuongPresets, note: data.clsTheoDoiTienLuong },
                        ];
                        const visible = groups.filter(g => {
                            const hasPreset = Array.isArray(g.presets) && g.presets.length > 0;
                            const hasNote = g.note && String(g.note).trim();
                            return hasPreset || hasNote;
                        });
                        if (visible.length === 0) return <p>-</p>;
                        return visible.map(g => (
                            <div key={g.title} style={{ margin: '0.25em 0 0.75em' }}>
                                <p><b>{g.title}:</b></p>
                                {Array.isArray(g.presets) && g.presets.length > 0 && (
                                    <pre>{g.presets.map(p => `- ${p}`).join('\n')}</pre>
                                )}
                                {g.note && String(g.note).trim() && (
                                    <pre>{g.note}</pre>
                                )}
                            </div>
                        ));
                    })()}

                    {data.ketQua && (
                        <>
                            <p><span className="label">Kết quả:</span></p>
                            <pre>{data.ketQua}</pre>
                        </>
                    )}

                    <p><span className="label">5. Chẩn đoán xác định:</span></p>
                    <pre>{data.chanDoanXacDinh}</pre>

                    <p><span className="label">6. Điều trị:</span></p>
                    <p><b>a) Hướng điều trị:</b></p>
                    <pre>{data.huongDieuTri}</pre>
                    <p><b>b) Điều trị cụ thể:</b></p>
                    <pre>{data.dieuTri}</pre>

                    <p><span className="label">7. Tiên lượng:</span></p>
                    <pre>{data.tienLuong}</pre>
                </div>

                {/* TƯ VẤN */}
                {data.tuVanInDocx !== false && (
                    (Array.isArray(data.tuVanPresets) && data.tuVanPresets.length > 0) || (data.tuVan && String(data.tuVan).trim())
                ) && (
                    <div className="section">
                        <h3>IV. Tư vấn</h3>
                        {Array.isArray(data.tuVanPresets) && data.tuVanPresets.length > 0 && (
                            <pre>{data.tuVanPresets.map(p => `- ${p}`).join('\n')}</pre>
                        )}
                        {data.tuVan && String(data.tuVan).trim() && (
                            <pre>{data.tuVan}</pre>
                        )}
                    </div>
                )}

                {/* BIỆN LUẬN */}
                {data.bienLuan && (
                    <div className="section">
                        <h2>C. PHẦN BIỆN LUẬN</h2>
                        <pre>{data.bienLuan}</pre>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="preview-overlay" onClick={handleOverlayClick}>
            <div className="preview-modal">
                <div className="preview-header">
                    <h2>Xem trước bệnh án</h2>
                    <div className="preview-actions">
                        <button className="btn" onClick={handlePrint}>
                            In
                        </button>
                        <button className="btn btn-primary" onClick={onExport}>
                            Xuất Word
                        </button>
                        <button className="btn" onClick={onClose}>
                            Đóng
                        </button>
                    </div>
                </div>
                <div className="preview-body">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

// Helper functions
function getFormTitle(formType) {
    const titles = {
        noikhoa: 'BỆNH ÁN NỘI KHOA',
        sankhoa: 'BỆNH ÁN SẢN KHOA',
        tienphau: 'BỆNH ÁN TIỀN PHẪU',
        hauphau: 'BỆNH ÁN HẬU PHẪU',
        phukhoa: 'BỆNH ÁN PHỤ KHOA',
        nhikhoa: 'BỆNH ÁN NHI KHOA',
        gmhs: 'PHIẾU KHÁM TIỀN MÊ (GMHS)',
        ranghammat: 'BỆNH ÁN RĂNG HÀM MẶT',
        yhct: 'BỆNH ÁN Y HỌC CỔ TRUYỀN'
    };
    return titles[formType] || 'BỆNH ÁN';
}

function formatDateTime(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('vi-VN');
}

export default PreviewModal;
