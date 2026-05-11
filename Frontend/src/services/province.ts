export const fetchProvinces = async () => {
    try {
        const response = await fetch('https://provinces.open-api.vn/api/');
        const data = await response.json();

        return data.map((prov: any) => ({
            code: prov.code,
            name: prov.name.replace('Tỉnh ', '').replace('Thành phố ', '').trim()
        }));
        // console.log('Fetched provinces:', provinces.value);
    } catch (error) {
        console.error("Lỗi khi fetch danh sách tỉnh thành:", error);
    }
};