import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook để tính toán tuổi từ năm sinh
 */
export function useAgeCalculation(namSinh) {
    const [tuoi, setTuoi] = useState('');

    useEffect(() => {
        if (namSinh) {
            const year = parseInt(namSinh);
            const currentYear = new Date().getFullYear();
            if (!isNaN(year) && year > 1900 && year <= currentYear) {
                setTuoi(currentYear - year);
            } else {
                setTuoi('');
            }
        } else {
            setTuoi('');
        }
    }, [namSinh]);

    return tuoi;
}

/**
 * Hook để tính BMI và phân loại
 */
export function useBMICalculation(chieuCao, canNang) {
    const [bmi, setBmi] = useState('');
    const [phanLoaiBMI, setPhanLoaiBMI] = useState('');

    useEffect(() => {
        if (canNang && chieuCao) {
            const h = parseFloat(chieuCao) / 100;
            const w = parseFloat(canNang);
            if (h > 0 && w > 0) {
                const bmiValue = (w / (h * h)).toFixed(1);
                setBmi(bmiValue);

                let pl = "";
                if (bmiValue < 18.5) pl = "gầy";
                else if (bmiValue < 23) pl = "trung bình";
                else if (bmiValue < 25) pl = "thừa cân";
                else if (bmiValue < 27.5) pl = "tiền béo phì";
                else if (bmiValue < 30) pl = "béo phì độ I";
                else pl = "béo phì độ II";

                setPhanLoaiBMI(pl);
            } else {
                setBmi('');
                setPhanLoaiBMI('');
            }
        } else {
            setBmi('');
            setPhanLoaiBMI('');
        }
    }, [chieuCao, canNang]);

    return { bmi, phanLoaiBMI };
}

/**
 * Hook để tính tuổi chi tiết cho Nhi Khoa (tuổi + tháng)
 */
export function useDetailedAge() {
    const calcAge = useCallback((dobStr) => {
        if (!dobStr) return { text: '-', years: null, months: null };
        const dob = new Date(dobStr);
        if (isNaN(dob.getTime())) return { text: '-', years: null, months: null };

        const now = new Date();
        let years = now.getFullYear() - dob.getFullYear();
        let months = now.getMonth() - dob.getMonth();
        let days = now.getDate() - dob.getDate();

        if (days < 0) months -= 1;
        if (months < 0) {
            years -= 1;
            months += 12;
        }

        if (years < 0) return { text: 'Chưa sinh', years: 0, months: 0 };

        const text = (months > 0) ? `${years} tuổi ${months} tháng` : `${years} tuổi`;
        return { text, years, months };
    }, []);

    return calcAge;
}

/**
 * Hook để persist state vào localStorage
 * Trả về [storedValue, setValue, clearValue]
 */
export function useLocalStorage(key, initialValue) {
    // Dùng ref để giữ initialValue không trigger re-render
    const initialRef = useRef(initialValue);

    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            if (item) {
                const parsed = JSON.parse(item);
                // Merge nhẹ để tự bổ sung field mới khi nâng cấp form
                const base = JSON.parse(JSON.stringify(initialValue));
                if (
                    parsed && typeof parsed === 'object' && !Array.isArray(parsed) &&
                    base && typeof base === 'object' && !Array.isArray(base)
                ) {
                    // Chỉ lấy các key có trong base để tránh giữ lại field cũ/không còn dùng
                    const filtered = {};
                    for (const k of Object.keys(base)) {
                        if (Object.prototype.hasOwnProperty.call(parsed, k)) {
                            filtered[k] = parsed[k];
                        }
                    }
                    return { ...base, ...filtered };
                }
                return parsed;
            }
            // Deep clone initialValue để tránh mutation
            return JSON.parse(JSON.stringify(initialValue));
        } catch (error) {
            console.error(`Error loading ${key} from localStorage:`, error);
            return JSON.parse(JSON.stringify(initialValue));
        }
    });

    // Debounce lưu localStorage để tránh lag khi nhập textarea dài
    const saveTimeoutRef = useRef(null);
    const lastValueRef = useRef(null);
    const SAVE_DEBOUNCE_MS = 500;

    const scheduleSave = useCallback((valueToStore) => {
        lastValueRef.current = valueToStore;
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
            saveTimeoutRef.current = null;
            try {
                window.localStorage.setItem(key, JSON.stringify(lastValueRef.current));
            } catch (error) {
                console.error(`Error saving ${key} to localStorage:`, error);
            }
        }, SAVE_DEBOUNCE_MS);
    }, [key]);

    // Flush lần cuối khi unmount (giảm rủi ro mất dữ liệu cuối cùng)
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
                saveTimeoutRef.current = null;
            }
            if (lastValueRef.current !== null) {
                try {
                    window.localStorage.setItem(key, JSON.stringify(lastValueRef.current));
                } catch {
                    // Bỏ qua nếu không ghi được
                }
            }
        };
    }, [key]);

    const setValue = useCallback((value) => {
        // Cho phép value là function (functional update)
        setStoredValue(prev => {
            const valueToStore = value instanceof Function ? value(prev) : value;
            scheduleSave(valueToStore);
            return valueToStore;
        });
    }, [scheduleSave]);

    const clearValue = useCallback(() => {
        try {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
                saveTimeoutRef.current = null;
            }
            lastValueRef.current = null;
            window.localStorage.removeItem(key);
            // Deep clone để tạo object mới, đảm bảo React detect change
            const freshValue = JSON.parse(JSON.stringify(initialRef.current));
            setStoredValue(freshValue);
        } catch (error) {
            console.error(`Error clearing ${key} from localStorage:`, error);
        }
    }, [key]);

    return [storedValue, setValue, clearValue];
}

/**
 * Hook để debounce value (hữu ích cho API calls)
 */
export function useDebounce(value, delay = 500) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

/**
 * Hook để tính dự sinh cho Sản Khoa
 */
export function useDueDate(tcn1_sa1_date, tcn1_sa1_x, tcn1_sa1_y) {
    const [dueDate, setDueDate] = useState('');

    useEffect(() => {
        const d0 = tcn1_sa1_date ? new Date(tcn1_sa1_date) : null;
        const x = parseInt(tcn1_sa1_x);
        const y = parseInt(tcn1_sa1_y);

        if (d0 && !isNaN(x) && !isNaN(y) && !isNaN(d0.getTime())) {
            const gaDays = (x * 7) + y;
            const due = new Date(d0.getTime());
            due.setDate(due.getDate() + (280 - gaDays));

            const dd = String(due.getDate()).padStart(2, '0');
            const mm = String(due.getMonth() + 1).padStart(2, '0');
            const yyyy = due.getFullYear();
            setDueDate(`${dd}/${mm}/${yyyy}`);
        } else {
            setDueDate('');
        }
    }, [tcn1_sa1_date, tcn1_sa1_x, tcn1_sa1_y]);

    return dueDate;
}
