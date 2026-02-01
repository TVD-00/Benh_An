export const DROPDOWN_OPTIONS = {
    timmach: [
        "T1 T2 đều rõ, không âm thổi",
        "- Lòng ngực cân đối, không sẹo mổ cũ, mỏm tim ở liên sườn V đường trung đòn (T) diện đập 2x2cm, tĩnh mạch cổ không nổi 45o\n- Không phát hiện ổ đập bất thường, rung miu (-), Harzer (-)\n- T1 T2 đều rõ, nảy cùng nhịp mạch, tần số  lần/phút, không âm thổi"
    ],
    hohap: [
        "Rì rào phế nang êm dịu 2 phế trường, không ran",
        "- Ngực di động theo nhịp thở, các khoảng gian sườn không dãn, không co kéo cơ hô hấp phụ\n- Rung thanh đều 2 bên, gõ trong\n- Rì rào phế nang êm dịu 2 phế trường, không ran"
    ],
    than: [
        "Cầu bàng quang (-), chạm thận (-)",
        "- Hố thắt lưng không sưng nề\n- Cầu bàng quang (-), chạm thận (-), rung thận (-), điểm niệu quản (-)"
    ],
    thankinh: [
        "Cổ mềm, không dấu thần kinh khu trú",
        "- Chức năng thần kinh cao cấp: GCS 15/15\n- Tư thế dáng bộ: Dáng đi thẳng\n- 12 đôi dây thần kinh sọ:\n- Hệ vận động: Sức cơ 5/5, trương lực trung bình, không rung giật\n- Hệ cảm giác: Nông, sâu\n- Phản xạ: Phản xạ gân xương 2+, phản xạ da bụng (+), Babinski (-), hoffman (-)\n- Dấu màng não: Cổ mềm, Kernig (-)\n- Hệ thần kinh thực vật: Không rối loạn cơ vòng"
    ],
    cokhop: [
        "Không giới hạn vận động",
        "- Cột sống không gù vẹo, các khớp không biến dạng\n- Các khớp không viêm, ấn không đau, dấu chuông bấm (-), lasegue (-), bonnet (-)\n- Chiều dài chi 2 bên không lệch"
    ],
    tieuhoa: [
        "Bụng mềm, gan lách không sờ chạm, không điểm đau khu trú",
        "- Bụng cân đối, không chướng, không tuần hoàn bàng hệ, không sẹo mổ cũ\n- Nhu động #4 lần/phút. Gõ trong khắp bụng, đục vùng gan lách\n- Bụng mềm, gan lách không sờ chạm, không điểm đau khu trú\n- [Các nghiệm pháp cần làm]\n- Thăm hậu môn - trực tràng: Cơ thắt tốt, niêm mạc trơn láng, túi cùng không đau, rút găng không nhầy máu"
    ]
};

// Preset gợi ý cho phần Cận lâm sàng đề nghị (theo nhóm mục tiêu)
export const CLS_DE_NGHI_PRESETS = {
    chanDoan: [
        // Hình ảnh học
        'ECG 12 chuyển đạo',
        'X-quang ngực thẳng',
        'X-quang bụng đứng',
        'Siêu âm bụng tổng quát',
        'Siêu âm tim',
        'Siêu âm Doppler mạch',
        'CT không cản quang',
        'CT có cản quang',
        'MRI',
        // Nội soi
        'Nội soi dạ dày tá tràng',
        'Nội soi đại tràng',
        'Nội soi phế quản',
        // Thăm dò chức năng
        'Đo chức năng hô hấp',
        'Điện não đồ (EEG)',
        'Điện cơ (EMG)'
    ],
    timNguyenNhan: [
        // Huyết học
        'CTM + HC lưới',
        'Phết máu ngoại biên',
        // Sinh hóa
        'Glucose máu đói',
        'HbA1c',
        'Lipid máu (Cholesterol, TG, HDL, LDL)',
        'Ure, Creatinine',
        'AST, ALT, GGT',
        'Bilirubin TP/TT',
        'Protein TP, Albumin',
        'Điện giải đồ (Na, K, Cl, Ca)',
        // Viêm nhiễm
        'CRP',
        'Procalcitonin',
        'Tốc độ máu lắng',
        'Ferritin, Transferrin',
        // Vi sinh
        'Cấy máu (2 mẫu)',
        'Cấy nước tiểu',
        'Cấy đàm',
        'Soi/cấy dịch não tủy',
        // Nước tiểu
        'Tổng phân tích nước tiểu',
        'Protein niệu 24h',
        // Miễn dịch
        'ANA, Anti-dsDNA',
        'RF, Anti-CCP',
        'Bổ thể C3, C4',
        // Nội tiết
        'TSH, FT3, FT4',
        'Cortisol sáng',
        // Ung thư
        'AFP, CEA, CA19-9, CA125, PSA'
    ],
    hoTroDieuTri: [
        // Đông máu
        'PT, aPTT, INR',
        'Fibrinogen',
        'D-dimer',
        // Truyền máu
        'Nhóm máu ABO + Rh',
        'Phản ứng chéo',
        // Hô hấp
        'Khí máu động mạch',
        'Lactate máu',
        // Tim mạch
        'Troponin T/I',
        'NT-proBNP / BNP',
        'CK, CK-MB',
        // Gan thận
        'Chức năng gan (AST, ALT, Bili)',
        'Chức năng thận (Ure, Cre, eGFR)',
        // Dinh dưỡng
        'Prealbumin',
        // Thuốc
        'Nồng độ thuốc (Vancomycin, Digoxin...)'
    ],
    theoDoiTienLuong: [
        'Monitor liên tục (mạch, HA, SpO2, ECG)',
        'Theo dõi tri giác (GCS)',
        'Theo dõi nước tiểu / Bilan dịch',
        'CVP (nếu có catheter TM trung tâm)',
        'Lặp lại CTM sau 6-12h',
        'Lặp lại sinh hóa sau 24-48h',
        'Đánh giá đáp ứng lâm sàng',
        'Siêu âm đánh giá lại',
        'X-quang kiểm tra (sau đặt ống, dẫn lưu...)'
    ]
};

// Preset gợi ý cho mục Tư vấn (chia nhóm để dễ chọn)
export const TU_VAN_PRESETS = [
    // Giải thích bệnh
    'Giải thích chẩn đoán và tiên lượng bệnh',
    'Giải thích kế hoạch điều trị',
    'Giải thích các thủ thuật/phẫu thuật (nếu có)',
    // Dùng thuốc
    'Hướng dẫn dùng thuốc đúng liều, đúng giờ',
    'Tác dụng phụ thuốc cần theo dõi',
    'Thuốc cần tránh (tương tác thuốc)',
    // Chế độ ăn
    'Chế độ ăn giảm muối (THA, suy tim)',
    'Chế độ ăn tiểu đường (hạn chế đường, tinh bột)',
    'Chế độ ăn suy thận (giảm đạm, hạn chế kali)',
    'Chế độ ăn bệnh gan (đủ năng lượng, hạn chế đạm nếu não gan)',
    'Chế độ ăn loét dạ dày (ăn chín, chia nhỏ bữa)',
    'Chế độ ăn gout (hạn chế purin, uống đủ nước)',
    // Sinh hoạt
    'Vận động phù hợp tình trạng bệnh',
    'Ngưng hút thuốc lá',
    'Hạn chế bia rượu',
    'Ngủ đủ giấc, giảm stress',
    // Dấu hiệu báo động
    'Dấu hiệu cần tái khám ngay: sốt cao, khó thở, đau ngực, lơ mơ',
    'Dấu hiệu hạ đường huyết (vã mồ hôi, run, đói)',
    'Dấu hiệu xuất huyết (ói máu, tiêu phân đen, chảy máu bất thường)',
    'Dấu hiệu nhiễm trùng (sốt, ớn lạnh, vết mổ sưng đỏ)',
    // Tái khám
    'Tái khám đúng hẹn',
    'Mang theo toa thuốc và kết quả xét nghiệm cũ khi tái khám'
];

// Preset gợi ý cho YHCT (ngắn, để SV dễ điền)
export const YHCT_PRESETS = {
    vong: [
        'Sắc mặt bình thường',
        'Lưỡi hồng, rêu trắng mỏng',
        'Thần sắc tỉnh, không vật vã'
    ],
    van: [
        'Giọng nói rõ, không khó thở',
        'Không mùi hôi đặc biệt'
    ],
    vanHoi: [
        'Ăn ngủ bình thường',
        'Đại tiểu tiện bình thường',
        'Không sợ lạnh, không sốt'
    ],
    thiet: [
        'Mạch bình hoà',
        'Ấn không đau nhiều'
    ],
    batCuong: [
        'Biểu/Lý: ...',
        'Hàn/Nhiệt: ...',
        'Hư/Thực: ...',
        'Âm/Dương: ...'
    ],
    tangPhu: [
        'Tâm: ...',
        'Can: ...',
        'Tỳ: ...',
        'Phế: ...',
        'Thận: ...'
    ],
    phapTri: [
        'Thanh nhiệt',
        'Ôn trung tán hàn',
        'Bổ khí',
        'Hoạt huyết'
    ],
    phuongThang: [
        'Không dùng thuốc (chỉ định không dùng thuốc)',
        'Châm cứu/xoa bóp/bấm huyệt',
        'Dưỡng sinh'
    ]
};
