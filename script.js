let workLogs = JSON.parse(localStorage.getItem('workLogs')) || [];

// 頁面載入時執行初始化
window.onload = function() {
    const now = new Date();
    
    // 設定「新增紀錄」的日期預設為今天
    const today = now.toISOString().split('T')[0];
    document.getElementById('logDate').value = today;

    // 設定月份篩選器為當前月份 (YYYY-MM)
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    document.getElementById('monthFilter').value = currentMonth;
    
    // 監聽事件並綁定渲染函數
    document.getElementById('hourlyRate').addEventListener('change', renderAll);
    document.getElementById('monthFilter').addEventListener('change', renderAll); 
    
    renderAll();
};

/**
 * 核心渲染函數：處理篩選、渲染清單和日曆。
 */
function renderAll() {
    const selectedMonth = document.getElementById('monthFilter').value;
    if (!selectedMonth) return; // 如果沒有選取月份，則不執行渲染

    const [year, month] = selectedMonth.split('-').map(Number);

    // 過濾出選定月份的紀錄
    const filteredLogs = workLogs.filter(log => {
        const logDate = new Date(log.date);
        // Date.getMonth() 是 0-11，所以要 +1
        return logDate.getFullYear() === year && (logDate.getMonth() + 1) === month;
    });

    renderLogs(filteredLogs);      // 渲染詳細清單
    updateSummary(filteredLogs);   // 更新總結
    renderCalendar(year, month, filteredLogs); // 渲染日曆
    saveLogs();
}

/**
 * 處理月份切換的邏輯。
 * @param {number} delta - 1 代表下個月, -1 代表上個月。
 */
function changeMonth(delta) {
    const monthFilterInput = document.getElementById('monthFilter');
    const currentMonthValue = monthFilterInput.value; // YYYY-MM 格式

    // 將 YYYY-MM 轉換為 Date 物件
    const [year, month] = currentMonthValue.split('-').map(Number);
    const date = new Date(year, month - 1, 1); // 月份是 0-indexed

    // 改變月份
    date.setMonth(date.getMonth() + delta);

    // 格式化回 YYYY-MM
    const newYear = date.getFullYear();
    const newMonth = String(date.getMonth() + 1).padStart(2, '0');
    
    const newMonthValue = `${newYear}-${newMonth}`;

    // 更新 input 的值，並觸發 renderAll
    monthFilterInput.value = newMonthValue;
    renderAll();
}

/**
 * 將時間字串轉換為分鐘數。
 */
function timeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
}

/**
 * 新增工時紀錄。
 */
function addLog() {
    const hourlyRate = parseFloat(document.getElementById('hourlyRate').value) || 0;
    const logDate = document.getElementById('logDate').value;
    const startTimeStr = document.getElementById('startTime').value;
    const endTimeStr = document.getElementById('endTime').value;
    const breakMinutes = parseFloat(document.getElementById('breakTime').value) || 0;
    
    if (!hourlyRate || !logDate || !startTimeStr || !endTimeStr) {
        alert("請確保時薪、日期和時間都已填寫。");
        return;
    }

    const startMins = timeToMinutes(startTimeStr);
    const endMins = timeToMinutes(endTimeStr);
    let workMinutes = (endMins - startMins) - breakMinutes;
    
    if (workMinutes < 0) {
        alert("工時計算結果為負數，請檢查時間輸入。");
        return;
    }

    const totalHours = workMinutes / 60.0;
    const calculatedSalary = totalHours * hourlyRate;

    const newLog = {
        date: logDate,
        type: '工時',
        startTime: startTimeStr,
        endTime: endTimeStr,
        breakMinutes: breakMinutes,
        totalHours: totalHours,
        salary: calculatedSalary
    };

    workLogs.push(newLog);
    renderAll();
}

/**
 * 新增請假/排休紀錄。
 */
function addLeave(type) {
    const logDate = document.getElementById('logDate').value;
    if (!logDate) {
        alert("請輸入請假/排休的日期。");
        return;
    }

    const newLog = {
        date: logDate,
        type: type, // '排休' 或 '請假'
        totalHours: 0,
        salary: 0
    };

    // 檢查是否已存在該日期的排休/請假紀錄，避免重複
    const existingIndex = workLogs.findIndex(log => log.date === logDate && (log.type === '排休' || log.type === '請假'));
    if (existingIndex !== -1) {
        // 如果存在，則用新的類型替換它
        workLogs[existingIndex] = newLog;
    } else {
        workLogs.push(newLog);
    }
    
    renderAll();
}

/**
 * 將紀錄儲存到瀏覽器的 localStorage。
 */
function saveLogs() {
    localStorage.setItem('workLogs', JSON.stringify(workLogs));
}

/**
 * 刪除指定的單筆紀錄。
 */
function deleteLog(originalIndex) {
    // originalIndex 是在 workLogs 陣列中的原始索引
    workLogs.splice(originalIndex, 1); 
    renderAll();
}

/**
 * 更新總結區塊的數據。
 */
function updateSummary(logs) {
    let totalHoursAccumulated = logs.reduce((sum, log) => sum + log.totalHours, 0);
    let totalSalaryAccumulated = logs.reduce((sum, log) => sum + log.salary, 0);
    
    document.getElementById('totalHours').textContent = totalHoursAccumulated.toFixed(2);
    document.getElementById('totalSalary').textContent = totalSalaryAccumulated.toFixed(0);
}

/**
 * 渲染詳細紀錄清單。
 */
function renderLogs(logs) {
    const logList = document.getElementById('logList');
    logList.innerHTML = '';
    
    // logs 是篩選後的陣列
    logs.forEach(log => {
        // 找到它在 workLogs 陣列中的原始索引，用於刪除
        const originalIndex = workLogs.indexOf(log); 
        
        const listItem = document.createElement('li');
        let detailText = '';
        let itemClass = '';

        if (log.type === '工時') {
            detailText = `(${log.startTime} - ${log.endTime}, 休 ${log.breakMinutes} 分) | 工時: ${log.totalHours.toFixed(2)} 小時 | 收入: NT$ ${log.salary.toFixed(0)}`;
            itemClass = 'log-work';
        } else {
            detailText = `**${log.type}** (不計薪)`;
            itemClass = 'log-leave';
        }

        listItem.className = itemClass;
        listItem.innerHTML = `
            <strong>${log.date}</strong> ${detailText}
            <button class="delete-btn" onclick="deleteLog(${originalIndex})">刪除</button>
        `;
        logList.appendChild(listItem);
    });
}

/**
 * 渲染日曆總結 (月曆)
 */
function renderCalendar(year, month, logs) {
    const calendarDisplay = document.getElementById('calendarDisplay');
    calendarDisplay.innerHTML = '';

    const daysInMonth = new Date(year, month, 0).getDate();
    const dailyData = {};

    // 彙總每日數據
    logs.forEach(log => {
        const day = new Date(log.date).getDate();
        if (!dailyData[day]) {
            dailyData[day] = { hours: 0, salary: 0, type: '無紀錄' };
        }
        
        // 累加工時和薪水
        if (log.type === '工時') {
            dailyData[day].hours += log.totalHours;
            dailyData[day].salary += log.salary;
            dailyData[day].type = '工時';
        } else {
            // 如果是請假或排休，則覆蓋狀態，但工時和薪水仍為 0
            dailyData[day].type = log.type; 
        }
    });

    // 找出月份第一天是星期幾
    const firstDayOfMonth = new Date(year, month - 1, 1).getDay(); // 0 (Sun) to 6 (Sat)
    
    // 填充空白
    // 讓日曆從星期一開始 (i=0 for Monday)
    for (let i = 0; i < (firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1); i++) { 
         const emptyCell = document.createElement('div');
         emptyCell.className = 'calendar-day empty';
         calendarDisplay.appendChild(emptyCell);
    }
    
    // 渲染日曆天數
    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        
        const data = dailyData[day];

        if (data && data.type !== '無紀錄') {
            if (data.type === '工時') {
                 dayCell.classList.add('day-work');
                 dayCell.innerHTML = `
                    <span class="day-number">${day}</span>
                    <span class="day-info hour">${data.hours.toFixed(1)} 小時</span>
                    <span class="day-info salary">NT$ ${data.salary.toFixed(0)}</span>
                `;
            } else if (data.type === '排休') {
                dayCell.classList.add('day-off');
                dayCell.innerHTML = `<span class="day-number">${day}</span><span class="day-info status">排休</span>`;
            } else if (data.type === '請假') {
                dayCell.classList.add('day-leave');
                dayCell.innerHTML = `<span class="day-number">${day}</span><span class="day-info status">請假</span>`;
            }
        } else {
             dayCell.innerHTML = `<span class="day-number">${day}</span>`;
        }

        calendarDisplay.appendChild(dayCell);
    }
}

/**
 * 清除所有紀錄。
 */
function clearLogs() {
    if (confirm("您確定要清除所有工作紀錄嗎？此操作無法撤銷。")) {
        workLogs = [];
        localStorage.removeItem('workLogs');
        renderAll();
    }
}