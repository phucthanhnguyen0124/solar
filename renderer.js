const Chart = require('chart.js/auto');
const lottie = require('lottie-web'); // Nếu dùng npm

// Biểu đồ thu nhập
const ctx = document.getElementById('incomeChart').getContext('2d');
const incomeData = {
  labels: [], // Các giờ trong ngày
  datasets: [{
    label: 'Thu nhập mỗi giờ (VNĐ)',
    data: [], // Dữ liệu thu nhập
    borderColor: 'rgba(75, 192, 192, 1)', // Màu của đường liên kết
    backgroundColor: 'rgba(75, 192, 192, 0.2)', // Màu nền
    borderWidth: 2, // Độ dày của đường liên kết
    tension: 0.4, // Độ cong của đường (0 là thẳng, 0.4 là cong vừa phải)
    pointRadius: 4, // Kích thước các điểm
    pointHoverRadius: 6, // Kích thước điểm khi hover
    pointStyle: [] // Sử dụng để hiển thị icon mây/mưa
  }]
};

const incomeChart = new Chart(ctx, {
  type: 'line',
  data: incomeData,
  options: {
    responsive: true,
    scales: {
      x: {
        title: {
          display: true,
          text: 'Thời gian (giờ)'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Thu nhập (VNĐ)'
        }
      }
    }
  }
});

// Tính toán thu nhập
const pricePerKwh = 1.012; // VNĐ/kWh
const averageDailyIncome = 10000000; // Tổng thu nhập trung bình mỗi ngày
const hoursPerDayWithSun = 12; // 12 giờ nắng (5:00 đến 18:00)
const incomePerHourPeak = averageDailyIncome / hoursPerDayWithSun; // Thu nhập trung bình mỗi giờ khi ánh sáng mạnh nhất

let totalIncome = 0;
let activeHours = 0; // Số giờ đã có thu nhập

// Tỷ lệ xuất hiện mây/mưa
const cloudChance = 0.3; // 30% xuất hiện mây
const rainChance = 0.2;  // 20% xuất hiện mưa

// Khởi tạo animation nhà máy (giữ nguyên)
lottie.loadAnimation({
  container: document.getElementById('lottieAnimation'), // Div chứa animation
  renderer: 'svg',
  loop: true,
  autoplay: true,
  path: 'C:/Users/Admin/solar-income-simulator/assets/nhamay.json' // Đường dẫn tới file JSON
});

// Khởi tạo animation mây
const cloudAnimation = lottie.loadAnimation({
  container: document.getElementById('cloudAnimation'), // Div chứa animation
  renderer: 'svg',
  loop: true,
  autoplay: true,
  path: 'C:/Users/Admin/solar-income-simulator/assets/cloud.json'
});

// Khởi tạo animation mưa
const rainAnimation = lottie.loadAnimation({
  container: document.getElementById('rainAnimation'), // Div chứa animation
  renderer: 'svg',
  loop: true,
  autoplay: true,
  path: 'C:/Users/Admin/solar-income-simulator/assets/rain.json'
});

// Hàm bật/tắt animation
function toggleAnimation(type) {
  if (type === 'cloud') {
    document.getElementById('cloudAnimation').style.display = 'block';
    document.getElementById('rainAnimation').style.display = 'none';
  } else if (type === 'rain') {
    document.getElementById('cloudAnimation').style.display = 'none';
    document.getElementById('rainAnimation').style.display = 'block';
  } else {
    document.getElementById('cloudAnimation').style.display = 'none';
    document.getElementById('rainAnimation').style.display = 'none';
  }
}

// Hàm tính thu nhập theo giờ
function calculateHourlyIncome(hour) {
  if (hour < 5 || hour >= 18) return { income: 0, condition: 'clear' }; // Không có thu nhập ngoài khung giờ 5:00-18:00

  let multiplier = 1;
  let condition = 'clear';

  // Yếu tố mây/mưa
  if (Math.random() < rainChance) {
    multiplier *= 0.5; // Mưa giảm 50% sản lượng
    condition = 'rain';
    toggleAnimation('rain');
  } else if (Math.random() < cloudChance) {
    multiplier *= 0.8; // Mây giảm 20% sản lượng
    condition = 'cloud';
    toggleAnimation('cloud');
  } else {
    toggleAnimation('clear');
  }

  if (hour >= 5 && hour < 12) {
    // Tăng dần từ 5:00 đến 12:00
    const factor = (hour - 5) / 7; // Tăng dần từ 0 đến 1
    return { income: incomePerHourPeak * (0.5 + factor) * multiplier, condition };
  }

  if (hour >= 12 && hour < 18) {
    // Giảm dần từ 12:00 đến 18:00
    const factor = (18 - hour) / 6; // Giảm dần từ 1 đến 0
    return { income: incomePerHourPeak * (0.5 + factor) * multiplier, condition };
  }

  return { income: 0, condition };
}

// Hàm khởi tạo dữ liệu từ 00:00 đến giờ hiện tại
function initializeData() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0); // 00:00 hôm nay
  const currentHour = now.getHours(); // Giờ hiện tại

  for (let hour = 0; hour <= currentHour; hour++) {
    const simulatedTime = new Date(startOfDay.getTime() + hour * 3600000); // Tính thời gian từng giờ
    const { income, condition } = calculateHourlyIncome(hour);
    const timeLabel = simulatedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    incomeData.labels.push(timeLabel);
    incomeData.datasets[0].data.push(income.toFixed(0)); // Làm tròn số thu nhập

    // Thêm icon mây/mưa vào điểm dữ liệu
    if (condition === 'cloud') {
      incomeData.datasets[0].pointStyle.push('https://cdn-icons-png.flaticon.com/512/414/414927.png'); // Icon mây
    } else if (condition === 'rain') {
      incomeData.datasets[0].pointStyle.push('https://cdn-icons-png.flaticon.com/512/414/414974.png'); // Icon mưa
    } else {
      incomeData.datasets[0].pointStyle.push('circle'); // Không có mây/mưa
    }

    if (income > 0) {
      totalIncome += income;
      activeHours++;
    }
  }

  // Cập nhật tổng thu nhập và thu nhập trung bình hiển thị
  updateIncomeDisplay();

  incomeChart.update(); // Cập nhật biểu đồ với dữ liệu giả lập
}

// Hàm cập nhật tổng thu nhập và thu nhập trung bình hiển thị
function updateIncomeDisplay() {
  const totalIncomeElement = document.getElementById('totalIncome');
  const averageIncomeElement = document.getElementById('averageIncome');

  totalIncomeElement.textContent = totalIncome.toLocaleString(); // Hiển thị số tiền với dấu phân cách
  averageIncomeElement.textContent = (totalIncome / activeHours).toLocaleString(undefined, { maximumFractionDigits: 0 }); // Làm tròn thu nhập trung bình
}

// Khởi tạo dữ liệu từ 00:00 đến giờ hiện tại
initializeData();
// Hàm hiển thị trạng thái thời tiết
function updateWeatherStatus(condition) {
    const weatherStatusElement = document.getElementById('weatherStatus');
    if (condition === 'rain') {
      weatherStatusElement.textContent = 'Trời đang mưa';
    } else if (condition === 'cloud') {
      weatherStatusElement.textContent = 'Trời đang có mây';
    } else {
      weatherStatusElement.textContent = ''; // Xóa trạng thái khi không có mưa hoặc mây
    }
  }
  
  // Hàm bật/tắt animation và cập nhật trạng thái thời tiết
  function toggleAnimation(type) {
    const cloudAnimation = document.getElementById('cloudAnimation');
    const rainAnimation = document.getElementById('rainAnimation');
  
    if (type === 'cloud') {
      cloudAnimation.classList.add('visible');
      rainAnimation.classList.remove('visible');
      updateWeatherStatus('cloud');
    } else if (type === 'rain') {
      cloudAnimation.classList.remove('visible');
      rainAnimation.classList.add('visible');
      updateWeatherStatus('rain');
    } else {
      cloudAnimation.classList.remove('visible');
      rainAnimation.classList.remove('visible');
      updateWeatherStatus(''); // Xóa trạng thái thời tiết
    }
  }
  
  // Thêm sự kiện cho các nút test
  document.getElementById('testRain').addEventListener('click', () => {
    toggleAnimation('rain');
  });
  
  document.getElementById('testCloud').addEventListener('click', () => {
    toggleAnimation('cloud');
  });
  
  document.getElementById('clearWeather').addEventListener('click', () => {
    toggleAnimation('clear');
  });

  