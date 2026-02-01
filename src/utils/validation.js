/**
 * EN: Validation Utilities for Form Inputs
 * VI: Các tiện ích kiểm tra dữ liệu đầu vào (Validation) cho Form
 * 
 * EN: Contains validation rules and helper functions for medical data fields
 *     like Vital Signs (Pulse, BP, Temp), Body Metrics (Height, Weight), and Dates.
 * VI: Chứa các quy tắc validation và hàm helper cho các trường dữ liệu y tế
 *     như Sinh hiệu (Mạch, HA, Nhiệt độ), Chỉ số cơ thể (Chiều cao, Cân nặng), và Ngày tháng.
 */

export const VALIDATION_RULES = {
    namSinh: {
        min: 1900,
        max: new Date().getFullYear(),
        message: `Năm sinh phải từ 1900 đến ${new Date().getFullYear()}`
    },
    ngaySinh: {
        max: new Date(),
        message: 'Ngày sinh không thể ở tương lai'
    },
    chieuCao: {
        min: 30,
        max: 250,
        message: 'Chiều cao phải từ 30-250 cm'
    },
    canNang: {
        min: 0.5,
        max: 500,
        message: 'Cân nặng phải từ 0.5-500 kg'
    },
    mach: {
        min: 30,
        max: 200,
        message: 'Mạch phải từ 30-200 lần/phút'
    },
    nhietDo: {
        min: 35,
        max: 42,
        message: 'Nhiệt độ phải từ 35-42°C'
    },
    huyetAp: {
        pattern: /^\d{2,3}\/\d{2,3}$/,
        message: 'Huyết áp phải có dạng xxx/xx (VD: 120/80)'
    },
    nhipTho: {
        min: 8,
        max: 60,
        message: 'Nhịp thở phải từ 8-60 lần/phút'
    }
};

// EN: Validate Birth Year
// VI: Kiểm tra Năm sinh
export function validateNamSinh(value) {
    if (!value) return { valid: true };
    const year = parseInt(value);
    const currentYear = new Date().getFullYear();
    
    // EN: Check range [1900 - Current Year]
    // VI: Kiểm tra trong khoảng [1900 - Năm hiện tại]
    if (isNaN(year) || year < 1900 || year > currentYear) {
        return {
            valid: false,
            message: `Năm sinh phải từ 1900 đến ${currentYear}`
        };
    }
    return { valid: true };
}

// EN: Validate Birth Date (Full date)
// VI: Kiểm tra Ngày sinh (Ngày đầy đủ)
export function validateNgaySinh(value) {
    if (!value) return { valid: true };
    const date = new Date(value);
    const now = new Date();
    
    // EN: Cannot be in the future
    // VI: Không được ở tương lai
    if (isNaN(date.getTime()) || date > now) {
        return {
            valid: false,
            message: 'Ngày sinh không hợp lệ hoặc ở tương lai'
        };
    }
    return { valid: true };
}

// EN: Validate Height (cm)
// VI: Kiểm tra Chiều cao (cm)
export function validateChieuCao(value) {
    if (!value) return { valid: true };
    const height = parseFloat(value);
    
    if (isNaN(height) || height < 30 || height > 250) {
        return {
            valid: false,
            message: 'Chiều cao phải từ 30-250 cm'
        };
    }
    return { valid: true };
}

// EN: Validate Weight (kg)
// VI: Kiểm tra Cân nặng (kg)
export function validateCanNang(value) {
    if (!value) return { valid: true };
    const weight = parseFloat(value);
    
    if (isNaN(weight) || weight < 0.5 || weight > 500) {
        return {
            valid: false,
            message: 'Cân nặng phải từ 0.5-500 kg'
        };
    }
    return { valid: true };
}

// EN: Validate Pulse (bpm)
// VI: Kiểm tra Mạch (lần/phút)
export function validateMach(value) {
    if (!value) return { valid: true };
    const pulse = parseInt(value);
    
    if (isNaN(pulse) || pulse < 30 || pulse > 200) {
        return {
            valid: false,
            message: 'Mạch phải từ 30-200 lần/phút'
        };
    }
    return { valid: true };
}

// EN: Validate Temperature (Celcius)
// VI: Kiểm tra Nhiệt độ (độ C)
export function validateNhietDo(value) {
    if (!value) return { valid: true };
    const temp = parseFloat(value);
    
    if (isNaN(temp) || temp < 35 || temp > 42) {
        return {
            valid: false,
            message: 'Nhiệt độ phải từ 35-42°C'
        };
    }
    return { valid: true };
}

// EN: Validate Blood Pressure (Systolic/Diastolic)
// VI: Kiểm tra Huyết áp (Tâm thu/Tâm trương)
export function validateHuyetAp(value) {
    if (!value) return { valid: true };
    const pattern = /^\d{2,3}\/\d{2,3}$/;
    
    // EN: Check format xxx/xx
    // VI: Kiểm tra định dạng xxx/xx
    if (!pattern.test(value)) {
        return {
            valid: false,
            message: 'Huyết áp phải có dạng xxx/xx (VD: 120/80)'
        };
    }
    
    // EN: Check logical range for Systolic and Diastolic
    // VI: Kiểm tra khoảng giá trị hợp lý cho Tâm thu và Tâm trương
    const [sys, dia] = value.split('/').map(Number);
    if (sys < 70 || sys > 250 || dia < 40 || dia > 150 || sys <= dia) {
        return {
            valid: false,
            message: 'Giá trị huyết áp không hợp lý'
        };
    }
    
    return { valid: true };
}

// EN: Validate Respiratory Rate
// VI: Kiểm tra Nhịp thở
export function validateNhipTho(value) {
    if (!value) return { valid: true };
    const resp = parseInt(value);
    
    if (isNaN(resp) || resp < 8 || resp > 60) {
        return {
            valid: false,
            message: 'Nhịp thở phải từ 8-60 lần/phút'
        };
    }
    return { valid: true };
}

// EN: Validate PARA code (Obstetrics) - 4 digits
// VI: Kiểm tra chỉ số PARA (Sản khoa) - 4 chữ số
export function validatePARA(value) {
    if (!value) return { valid: true };
    const pattern = /^\d{4}$/;
    
    if (!pattern.test(value)) {
        return {
            valid: false,
            message: 'PARA phải có 4 chữ số (VD: 1001)'
        };
    }
    return { valid: true };
}

// EN: Validate Required Field
// VI: Kiểm tra trường bắt buộc
export function validateRequired(value, fieldName) {
    if (!value || String(value).trim() === '') {
        return {
            valid: false,
            message: `${fieldName} là bắt buộc`
        };
    }
    return { valid: true };
}

// EN: Main Validator Function for entire form
// VI: Hàm Validator tổng hợp cho toàn bộ form
export function validateForm(formData, rules = {}) {
    const errors = {};
    
    for (const [field, rule] of Object.entries(rules)) {
        const value = formData[field];
        let result;
        
        switch (rule.type) {
            case 'namSinh':
                result = validateNamSinh(value);
                break;
            case 'ngaySinh':
                result = validateNgaySinh(value);
                break;
            case 'chieuCao':
                result = validateChieuCao(value);
                break;
            case 'canNang':
                result = validateCanNang(value);
                break;
            case 'mach':
                result = validateMach(value);
                break;
            case 'nhietDo':
                result = validateNhietDo(value);
                break;
            case 'huyetAp':
                result = validateHuyetAp(value);
                break;
            case 'nhipTho':
                result = validateNhipTho(value);
                break;
            case 'para':
                result = validatePARA(value);
                break;
            case 'required':
                result = validateRequired(value, rule.fieldName || field);
                break;
            default:
                result = { valid: true };
        }
        
        if (!result.valid) {
            errors[field] = result.message;
        }
    }
    
    return {
        valid: Object.keys(errors).length === 0,
        errors
    };
}
