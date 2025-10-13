// Helper to dynamically import `docx` and generate a .docx Blob for a contract object.
// Produces a Vietnamese contract layout with two main sections:
// I. THÔNG TIN CHUNG and II. NỘI DUNG DỊCH VỤ
export async function generateContractDocxBlob(contract = {}, options = {}) {
  // dynamic import of docx (works in ESM/browser bundlers)
  let mod;
  try {
    // prevent Vite from statically analyzing and pre-bundling this import
    // so the dev server won't fail if `docx` isn't installed in the environment
    mod = await import(/* @vite-ignore */ 'docx');
  } catch (err) {
    throw new Error('docx import failed: ' + (err?.message || err));
  }

  // normalize possible export shapes
  const docx = mod.default && Object.keys(mod).length === 1 ? mod.default : mod;
  const Document = docx.Document || docx.Doc || null;
  const Packer = docx.Packer || docx.Pack || null;
  const Paragraph = docx.Paragraph || null;
  const Table = docx.Table || null;
  const TableRow = docx.TableRow || null;
  const TableCell = docx.TableCell || null;
  const TextRun = docx.TextRun || null;

  if (!Document || !Packer || !Paragraph || !TextRun || !Table || !TableRow || !TableCell) {
    throw new Error('docx library does not expose expected constructors');
  }

  // Helpers
  const fmtNumber = (v) => {
    if (v === null || v === undefined || v === '') return '';
    if (typeof v === 'number') return v.toLocaleString('vi-VN');
    const s = String(v).replace(/,/g, '');
    const n = Number(s);
    return Number.isNaN(n) ? String(v) : n.toLocaleString('vi-VN');
  };

  const pad4 = (n) => String(n).padStart(4, '0');

  // Gather basic info with many fallbacks for field names
  const contractCodeRaw = contract.code || contract.contract_number || contract.contractNo || '';
  const contractCode = contractCodeRaw || `HD-${new Date().getFullYear()}-${pad4(contract.id || (Date.now() % 10000))}`;
  const customer = contract.customer || {};
  const customerName = customer.name || contract.customer_name || '';
  const description = contract.description || contract.note || '';

  // Company (Bên B) default to Getvini, allow override via options.companyInfo
  const company = options.companyInfo || contract.company || {
    name: 'Getvini',
    tax_code: '',
    representative: '',
    position: '',
    address: '',
    email: '',
    phone: '',
  };

  // Legal basis list
  const legalBasis = contract.legal_basis || contract.cancu || options.legalBasis || [
    'Bộ luật Dân sự (BLDS)',
    'Luật Thương mại',
    'Điều lệ công ty và các quy định liên quan'
  ];

  // Prepare customer and company detail strings
  const mkDetails = (obj) => {
    const lines = [];
    if (!obj) return lines;
    if (obj.name) lines.push(String(obj.name));
    if (obj.tax_code || obj.mst) lines.push(`MST: ${obj.tax_code || obj.mst}`);
    if (obj.representative || obj.rep || obj.contact_person) lines.push(`Đại diện: ${obj.representative || obj.rep || obj.contact_person}`);
    if (obj.position || obj.title) lines.push(`Chức vụ: ${obj.position || obj.title}`);
    if (obj.address) lines.push(`Địa chỉ: ${obj.address}`);
    if (obj.email) lines.push(`Email: ${obj.email}`);
    if (obj.phone || obj.mobile) lines.push(`Điện thoại: ${obj.phone || obj.mobile}`);
    return lines.filter(Boolean).join('\n');
  };

  const customerDetails = mkDetails(customer) || '';
  const companyDetails = mkDetails(company) || '';

  // Title heuristic
  const firstServiceName = (Array.isArray(contract.items) && contract.items[0] && (contract.items[0].name || contract.items[0].service_name)) || contract.service_name || '';
  const titleText = contract.is_cooperation || contract.type === 'cooperation' ? 'HỢP ĐỒNG HỢP TÁC' : `HỢP ĐỒNG CUNG CẤP DỊCH VỤ ${firstServiceName ? '[' + firstServiceName + ']' : ''}`;

  // Build children for document
  const children = [];

  // Section I
  children.push(new Paragraph({ children: [new TextRun({ text: '🧾 I. THÔNG TIN CHUNG', bold: true })] }));
  children.push(new Paragraph({ text: 'Mục đích: định danh hợp đồng, các bên và phạm vi hiệu lực.' }));

  const infoHeader = new TableRow({ children: [
    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Mục', bold: true })] })] }),
    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Nội dung', bold: true })] })] }),
  ] });

  const signDate = contract.signed_date || contract.approval_date || contract.date || contract.signedAt || '';

  const row1 = new TableRow({ children: [new TableCell({ children: [new Paragraph('1. Tiêu đề')] }), new TableCell({ children: [new Paragraph(titleText)] })] });
  const row2 = new TableRow({ children: [new TableCell({ children: [new Paragraph('2. Số hợp đồng')] }), new TableCell({ children: [new Paragraph(contractCode)] })] });
  const row3 = new TableRow({ children: [new TableCell({ children: [new Paragraph('3. Ngày ký')] }), new TableCell({ children: [new Paragraph(signDate ? String(signDate) : '')] })] });
  const row4 = new TableRow({ children: [new TableCell({ children: [new Paragraph('4. Bên A (Khách hàng)')] }), new TableCell({ children: [new Paragraph(customerDetails)] })] });
  const row5 = new TableRow({ children: [new TableCell({ children: [new Paragraph('5. Bên B (Công ty bạn)')] }), new TableCell({ children: [new Paragraph(companyDetails)] })] });
  const row6 = new TableRow({ children: [new TableCell({ children: [new Paragraph('6. Căn cứ pháp lý')] }), new TableCell({ children: [new Paragraph(Array.isArray(legalBasis) ? legalBasis.join('; ') : String(legalBasis))] })] });

  const infoTable = new Table({ rows: [infoHeader, row1, row2, row3, row4, row5, row6] });
  children.push(infoTable);

  // Section II
  children.push(new Paragraph({ children: [new TextRun({ text: '\n⚙️ II. NỘI DUNG DỊCH VỤ', bold: true })] }));
  children.push(new Paragraph('Mục này thể hiện các dịch vụ cụ thể trong hợp đồng — nên in ra theo dữ liệu trong DB.'));

  // Collect services from options.serviceRows or contract.items / contract.jobs
  const svcSource = options.serviceRows || contract.serviceRows || contract.items || contract.services || contract.jobs || [];
  const services = Array.isArray(svcSource) ? svcSource.map((it, idx) => {
    const qty = it.total_quantity ?? it.quantity ?? it.qty ?? it.count ?? 0;
    const unit = it.total_sale_price ?? it.sale_price ?? it.unit_price ?? it.price ?? it.unitPrice ?? 0;
    const amount = it.amount ?? (Number(qty) && Number(unit) ? (Number(qty) * Number(unit)) : (it.total ?? (Number(unit) || 0)));
    return {
      no: idx + 1,
      name: it.name || it.service_name || it.title || `Dịch vụ ${idx + 1}`,
      quantity: qty,
      unit_price: unit,
      amount: amount,
      eta: it.estimated_time || it.duration || it.time || ''
    };
  }) : [];

  const svcHeader = new TableRow({ children: [
    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'STT', bold: true })] })] }),
    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Tên dịch vụ', bold: true })] })] }),
    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Khối lượng', bold: true })] })] }),
    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Đơn giá', bold: true })] })] }),
    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Thành tiền', bold: true })] })] }),
    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Thời gian dự kiến', bold: true })] })] }),
  ] });

  const svcRows = services.length > 0 ? services.map(s => new TableRow({ children: [
    new TableCell({ children: [new Paragraph(String(s.no))] }),
    new TableCell({ children: [new Paragraph(String(s.name))] }),
    new TableCell({ children: [new Paragraph(fmtNumber(s.quantity))] }),
    new TableCell({ children: [new Paragraph(fmtNumber(s.unit_price))] }),
    new TableCell({ children: [new Paragraph(fmtNumber(s.amount))] }),
    new TableCell({ children: [new Paragraph(String(s.eta || ''))] }),
  ] })) : [new TableRow({ children: [new TableCell({ children: [new Paragraph('Không có dịch vụ')], columnSpan: 6 })] })];

  const servicesTable = new Table({ rows: [svcHeader, ...svcRows] });
  children.push(servicesTable);

  // Total contract value
  const totalValue = services.reduce((acc, s) => acc + (Number(s.amount) || 0), 0);
  children.push(new Paragraph({ text: `Tổng giá trị hợp đồng: ${fmtNumber(totalValue)} VND`, spacing: { before: 200 } }));

  // Conditions
  const condStart = contract.start_date || contract.startAt || contract.start || '';
  const condEnd = contract.end_date || contract.endAt || contract.end || '';
  const acceptance = contract.acceptance_criteria || contract.acceptance || options.acceptance || '';
  children.push(new Paragraph({ text: 'Điều kiện thực hiện:' }));
  children.push(new Paragraph({ text: `- Thời gian bắt đầu: ${condStart || ''}` }));
  children.push(new Paragraph({ text: `- Thời hạn hoàn thành: ${condEnd || ''}` }));
  children.push(new Paragraph({ text: `- Yêu cầu nghiệm thu: ${acceptance || ''}` }));

  // Build document
  const doc = new Document({ sections: [{ children }] });

  // Pack document to Blob with multiple fallbacks for Packer API
  let blob;
  try {
    if (typeof Packer.toBlob === 'function') {
      blob = await Packer.toBlob(doc);
    } else if (typeof Packer.toBuffer === 'function') {
      const buf = await Packer.toBuffer(doc);
      blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    } else {
      const p = new Packer();
      if (typeof p.toBlob === 'function') {
        blob = await p.toBlob(doc);
      } else if (typeof p.toBuffer === 'function') {
        const buf = await p.toBuffer(doc);
        blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      } else {
        throw new Error('No packer method available');
      }
    }
  } catch (err) {
    throw new Error('docx packing failed: ' + (err?.message || err));
  }

  return blob;
}

export default generateContractDocxBlob;
