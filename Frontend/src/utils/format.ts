    export const formatSalary = (min?: number | null, max?: number | null) => {
        const toMillion = (num: number) => {
            return (num / 1000000).toLocaleString('vi-VN', { maximumFractionDigits: 1 });
        };

        if (min && max) {
            return `${toMillion(min)} - ${toMillion(max)} Triệu`;
        } else if (min) {
            return `Từ ${toMillion(min)} Triệu`;
        } else if (max) {
            return `Đến ${toMillion(max)} Triệu`;
        }
        return 'Thỏa thuận';
    };
    export const formatDate = (dateString: string | Date | undefined) => {
        if (!dateString) return 'Chưa cập nhật';
        return new Date(dateString).toLocaleDateString('vi-VN');
    };
    // Hàm tách text thành mảng dựa trên dấu xuống dòng (\n)
    export const formatTextToList = (text?: string) => {
        if (!text) return [];
        return text.split('\n').filter(line => line.trim() !== '');
    };
    export const timeAgo = (dateString: string): string => {
        const now = new Date();
        const past = new Date(dateString);

        const diffMs = now.getTime() - past.getTime();
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);

        if (diffSec < 60) {
            return `${diffSec} giây trước`;
        }
        if (diffMin < 60) {
            return `${diffMin} phút trước`;
        }
        if (diffHour < 24) {
            return `${diffHour} giờ trước`;
        }
        if (diffDay < 7) {
            return `${diffDay} ngày trước`;
        }

        return past.toLocaleDateString('vi-VN');
    };