const JOB_STATUS_LABELS = {
  created: 'Mới tạo',
  assigned: 'Đã giao',
  in_progress: 'Đang thực hiện',
  review: 'Chờ kiểm tra',
  done: 'Hoàn thành',
  cancelled: 'Đã hủy',
  archived: 'Lưu trữ',
  not_assigned:'Chưa phân công'
}

const CONTRACT_STATUS_LABELS ={
  signed: 'Đã ký',
  waiting_bod_approval:'Đang đợi BOD duyệt',
  waiting_hr_confirm:'Đang đợi HR xác nhận',
  without_debt:'Chưa có công nợ',
  assigned:'Đang đợi ký',
  not_assigned:'Đã duyệt'
  

}

const SERVICE_JOB_LABELS ={
  user: 'Nội bộ',
  partner: 'Đối tác'
}

const OPPPORTUNITY_STATUS_LABELS = {
  waiting_bod_approval:'Đang chờ BOD duyệt',
  approved:'Đã được duyệt',
  not_assigned:'Chưa phân công công việc',
  assigned:'Đã phân công công việc',
  contract_created:'Cơ hội đã được tạo hợp đồng',
  quoted:'Đã tạo báo giá'
}

const  PROJECT_STATUS_LABELS = {
  in_progress:'Đang thực hiện',
  team_acknowledged:'Team được phân công đã nhận thông tin',
  not_assigned:'Chưa phân công công việc',
  assigned:'Đã phân công công việc',
  assigning:'Đang phân công'
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

const PARTNER_TYPE = {
  individual:'Cá nhân',
  business:'Doanh nghiệp'
}

const CUSTOMER_STATUS_OPTIONS = [
  { value: 'active', label: 'Khách hàng hiện hữu' },
  { value: 'inactive', label: 'Không hoạt động' },
  { value: 'potential', label: 'Khách hàng tiềm năng' },
];

export { JOB_STATUS_LABELS, CONTRACT_STATUS_LABELS, PROJECT_STATUS_LABELS, PRIORITY_OPTIONS, REGION_OPTIONS, OPPPORTUNITY_STATUS_LABELS, CUSTOMER_STATUS_OPTIONS,SERVICE_JOB_LABELS, PARTNER_TYPE}