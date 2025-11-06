const JOB_STATUS_LABELS = {
  created: 'Mới tạo',
  assigned: 'Đã giao',
  in_progress: 'Đang thực hiện',
  review: 'Chờ duyệt',
  done: 'Hoàn thành',
  cancelled: 'Đã hủy',
  archived: 'Lưu trữ'
}

const CONTRACT_STATUS_LABELS ={
  signed: 'Đã ký',
  waiting_bod_approval:'Đang đợi BOD duyệt',
  waiting_hr_confirm:'Đang đợi HR xác nhận',
  without_debt:'Chưa có công nợ',
  assigned:'Đang đợi ký'
  

}

const PROJECT_STATUS_LABELS = {
  in_progress:'Đang thực hiện',
  team_acknowledged:'Team được phân công đã nhận thông tin',
  not_assigned:'Chưa phân công công việc',
  assigned:'Đã phân công công việc'
}

const PRIORITY_OPTIONS = [
  { value: 'high', label: 'Cao' },
  { value: 'medium', label: 'Trung bình' },
  { value: 'low', label: 'Thấp' },
];

const REGION_OPTIONS = [
  { value: 'all', label: 'Toàn quốc' },
  { value: 'north', label: 'Miền Bắc' },
  { value: 'middle', label: 'Miền Trung' },
  { value: 'south', label: 'Miền Nam' },
];

export { JOB_STATUS_LABELS, CONTRACT_STATUS_LABELS, PROJECT_STATUS_LABELS, PRIORITY_OPTIONS, REGION_OPTIONS }