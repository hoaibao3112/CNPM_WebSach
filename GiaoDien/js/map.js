var map;
var marker_start = null;
var marker_end = null;
var route = null;

function delete_input(input_field, lat, long) {
    input_field.value = '';
    load_map(lat, long)
    document.getElementById('distance').textContent = `0 km`;
    document.getElementById('duration').textContent = `0 phút`;
}

function load_map(lat, long) {
    if (map) {
        map.remove();
    }

    map = L.map('map', {closePopupOnClick: false}).setView([lat, long], 17);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    add_mark(lat, long, 'Bắt đầu', 'start');
}

function add_mark(lat, long, popup_text, type) {
    if (type === 'start' && marker_start) {
        map.removeLayer(marker_start);
    }
    if (type === 'end' && marker_end) {
        map.removeLayer(marker_end);
    }

    var marker = L.marker([lat, long]).addTo(map);
    marker.bindPopup(popup_text).openPopup();

    if (type === 'start') {
        marker_start = marker;
    } else if (type === 'end') {
        marker_end = marker;
    }
}

function search_address(address, lat, long) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const toLat = parseFloat(data[0].lat);
                const toLon = parseFloat(data[0].lon);
                map.setView([toLat, toLon], 13);
                add_mark(toLat, toLon, "<b>Điểm đến</b><br>" + address, 'end');
                draw_route(lat, long, toLat, toLon);
            } else {
                alert("Không tìm thấy địa chỉ.");
            }
        })
        .catch(error => {
            console.error("Lỗi khi tìm địa chỉ:", error);
            alert("Đã xảy ra lỗi khi tìm địa chỉ.");
        });
}

function calculate_distance_duration(fromLat, fromLon, toLat, toLon) {
    try {
        const pointA = L.latLng(fromLat, fromLon);
        const pointB = L.latLng(toLat, toLon);
        const distanceInMeters = map.distance(pointA, pointB);
        const distanceInKm = (distanceInMeters / 1000).toFixed(2);

        // Giả dụ 500 mét 1 cây đèn đỏ đi trong phố
        const estimated_red_lights = Math.floor(distanceInMeters / 500);

        // Giả dụ: đi 30 km/h
        const minute = Math.ceil((distanceInKm / 30) * 60 + estimated_red_lights);


        document.getElementById('distance').textContent = `${distanceInKm} km`;
        document.getElementById('duration').textContent = `${minute} phút`;
    } catch (error) {
        console.error("Lỗi khi tính khoảng cách và thời gian:", error);
        document.getElementById('distance').textContent = `0 km`;
        document.getElementById('duration').textContent = `0 phút`;
    }
}

function draw_route(fromLat, fromLon, toLat, toLon) {
    if (route) {
        map.removeLayer(route);
        route = null;
    }

    const url = `https://router.project-osrm.org/route/v1/driving/${fromLon},${fromLat};${toLon},${toLat}?overview=full&geometries=geojson`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.routes && data.routes.length > 0) {
                const routeData = data.routes[0].geometry;
                route = L.geoJSON(routeData, {
                    style: {
                        color: 'green',
                        weight: 4
                    }
                }).addTo(map);

                // Hiển thị cả hai điểm trên bản đồ
                map.fitBounds(route.getBounds(), {
                    padding: [10, 10],
                });



                calculate_distance_duration(fromLat, fromLon, toLat, toLon);
            } else {
                alert("Không tìm được tuyến đường.");
            }
        })
        .catch(error => {
            console.error("Lỗi khi vẽ tuyến đường:", error);
            alert("Đã xảy ra lỗi khi vẽ tuyến đường.");
        });
}

function fillFullAddress() {
    const input_field = document.getElementById('input_field');
    const diachichitiet = document.getElementById('diachichitiet');
    const phuongxa = document.getElementById('phuongxa');
    const tinhthanh = document.getElementById('tinhthanh');

    diachichitiet.addEventListener('input', function() {
        // Hàm lấy text nếu không phải placeholder
        function getSelectedText(select) {
            const opt = select.options[select.selectedIndex];
            if (!opt || !opt.value || opt.text.includes('-- Chọn')) return '';
            return opt.text;
        }

        const parts = [
            diachichitiet.value.trim() || '',
            getSelectedText(phuongxa),
            getSelectedText(tinhthanh)
        ].filter(part => part !== ''); // bỏ phần rỗng

        input_field.value = parts.length > 0 ? parts.join(', ') : '';
    });
}


function main() {
    var lat = 10.7599599;
    var long = 106.6818616;
    load_map(lat, long);

    const input_field = document.getElementById('input_field');
    const input_button = document.getElementById('input_button');
    const delete_button = document.getElementById('delete_button');

    input_button.addEventListener('click', function () {
        const input_text = input_field.value.trim();
        if (input_text !== '') {
            search_address(input_text, lat, long);
        }
    });

    delete_button.addEventListener('click', function () {
        delete_input(input_field, lat, long);
    });

    // Hàm format và đổ địa chỉ đẹp
    fillFullAddress();
}

window.onload = main;